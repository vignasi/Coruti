package com.vignasi.rutinacore

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.drawable.Icon
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.speech.tts.TextToSpeech
import java.util.Locale

/** Lleva el temporizador de la rutina cuando se usa desde el widget, sin abrir la app. */
class WorkoutService : Service() {

    companion object {
        const val ACTION_TOGGLE = "com.vignasi.rutinacore.TOGGLE"
        const val ACTION_SKIP = "com.vignasi.rutinacore.SKIP"
        const val ACTION_STOP = "com.vignasi.rutinacore.STOP"
        private const val CHANNEL = "rutina"
        private const val NOTIF_ID = 7
    }

    private val handler = Handler(Looper.getMainLooper())
    private var tts: TextToSpeech? = null
    private var tone: ToneGenerator? = null
    private var wake: PowerManager.WakeLock? = null
    private var lastTick = 0L
    private var lastShownSec = -1
    private var finishing = false
    private var ttsReady = false
    private var pendingSay: String? = null

    private val ticker = object : Runnable {
        override fun run() { tick() }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CHANNEL, "Rutina en curso", NotificationManager.IMPORTANCE_LOW))
        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale("es", "ES")
                ttsReady = true
                pendingSay?.let { tts?.speak(it, TextToSpeech.QUEUE_FLUSH, null, "rutina") }
                pendingSay = null
            }
        }
        tone = try { ToneGenerator(AudioManager.STREAM_MUSIC, 90) } catch (e: Exception) { null }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startInForeground()
        when (intent?.action) {
            ACTION_TOGGLE -> toggle()
            ACTION_SKIP -> if (Workout.active) { advance(); refresh(force = true) }
            ACTION_STOP -> stopWorkout()
        }
        if (!Workout.active && !finishing) shutdown()
        return START_NOT_STICKY
    }

    private fun toggle() {
        if (!Workout.active) {
            Workout.start(Store.rounds(this))
            acquireWake()
            lastTick = SystemClock.elapsedRealtime()
            announce(Workout.current())
            handler.removeCallbacks(ticker)
            handler.post(ticker)
        } else {
            Workout.running = !Workout.running
            lastTick = SystemClock.elapsedRealtime()
            speak(if (Workout.running) "Seguimos" else "Pausa")
        }
        refresh(force = true)
    }

    private fun tick() {
        if (!Workout.active) return
        val now = SystemClock.elapsedRealtime()
        if (Workout.running) {
            val before = Workout.leftSec()
            Workout.leftMs -= now - lastTick
            val after = Workout.leftSec()
            if (after != before && after in 1..3) beep(ToneGenerator.TONE_PROP_BEEP, 120)
            if (Workout.leftMs <= 0) advance()
        }
        lastTick = now
        if (Workout.active) {
            refresh(force = false)
            handler.postDelayed(ticker, 250)
        }
    }

    private fun advance() {
        Workout.idx++
        val st = Workout.current()
        if (st == null) {
            finish()
            return
        }
        Workout.leftMs = st.s * 1000L
        announce(st)
    }

    private fun announce(st: Step?) {
        st ?: return
        when {
            st.rest -> { beep(ToneGenerator.TONE_PROP_ACK, 250); speak(st.say) }
            st.prep -> { beep(ToneGenerator.TONE_PROP_ACK, 250); speak(st.say) }
            else -> { beep(ToneGenerator.TONE_PROP_BEEP2, 350); speak("Empieza") }
        }
    }

    private fun finish() {
        finishing = true
        val rounds = Workout.rounds
        Workout.active = false
        Workout.running = false
        Workout.done = true
        Workout.idx = 0
        Store.markDone(this, rounds)
        beep(ToneGenerator.TONE_CDMA_CONFIRM, 600)
        speak("Rutina terminada. Buen trabajo.")
        try {
            getSystemService(Vibrator::class.java)?.vibrate(
                VibrationEffect.createWaveform(longArrayOf(0, 300, 150, 300, 150, 600), -1)
            )
        } catch (e: Exception) { }
        WidgetUpdater.refresh(this, force = true)
        handler.postDelayed({ finishing = false; shutdown() }, 5000)
    }

    private fun stopWorkout() {
        Workout.reset()
        handler.removeCallbacks(ticker)
        WidgetUpdater.refresh(this, force = true)
    }

    private fun shutdown() {
        handler.removeCallbacks(ticker)
        releaseWake()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun refresh(force: Boolean) {
        WidgetUpdater.refresh(this, force)
        val sec = Workout.leftSec()
        if (force || sec != lastShownSec) {
            lastShownSec = sec
            if (Workout.active) getSystemService(NotificationManager::class.java).notify(NOTIF_ID, notification())
        }
    }

    private fun action(label: String, act: String, req: Int): Notification.Action {
        val i = Intent(this, WorkoutService::class.java).setAction(act)
        val p = PendingIntent.getForegroundService(this, req, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        return Notification.Action.Builder(Icon.createWithResource(this, R.drawable.ic_stat), label, p).build()
    }

    private fun notification(): Notification {
        val st = Workout.current()
        val open = PendingIntent.getActivity(
            this, 40,
            Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val b = Notification.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(open)
        if (st != null && Workout.active) {
            val title = if (st.prep) "Prepárate: " + EXERCISES.getValue(st.k).name else st.name
            b.setContentTitle(title)
                .setContentText("${fmt(Workout.leftSec())} · Ronda ${st.r}/${Workout.rounds}")
                .setProgress(st.s, st.s - Workout.leftSec(), false)
                .addAction(action(if (Workout.running) "Pausa" else "Seguir", ACTION_TOGGLE, 41))
                .addAction(action("Saltar", ACTION_SKIP, 42))
                .addAction(action("Parar", ACTION_STOP, 43))
        } else {
            b.setContentTitle("Rutina core")
        }
        return b.build()
    }

    private fun startInForeground() {
        val n = notification()
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(NOTIF_ID, n)
        }
    }

    private fun speak(text: String) {
        if (ttsReady) tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "rutina") else pendingSay = text
    }

    private fun beep(type: Int, ms: Int) {
        try { tone?.startTone(type, ms) } catch (e: Exception) { }
    }

    private fun acquireWake() {
        if (wake == null) {
            wake = getSystemService(PowerManager::class.java)
                .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "rutinacore:workout")
        }
        if (wake?.isHeld == false) wake?.acquire(60 * 60 * 1000L)
    }

    private fun releaseWake() {
        try { if (wake?.isHeld == true) wake?.release() } catch (e: Exception) { }
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        releaseWake()
        tts?.shutdown()
        tone?.release()
        super.onDestroy()
    }
}
