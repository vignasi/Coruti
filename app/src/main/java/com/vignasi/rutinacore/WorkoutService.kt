package com.vignasi.rutinacore

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.drawable.Icon
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
    private var beeper: Beeper? = null
    private var wake: PowerManager.WakeLock? = null
    private var lastTick = 0L
    private var lastShownSec = -1
    private var finishing = false
    private var ttsReady = false
    private var pendingSay: String? = null
    // Señales de la fase en curso: último tono, última repetición contada y si ya se dijo «mitad»
    private var cuePhase = -1
    private var cueRep = -1
    private var cueHalf = false

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
        beeper = Beeper()
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
            val cfg = Store.config(this)
            val data = Rutina.get(this)
            Workout.start(buildSteps(data, cfg, Store.lastDay(this), Store.sessions(this)), cfg,
                dayType(activeModules(data, cfg, Store.lastDay(this))))
            resetCues()
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
            if (Workout.leftMs <= 0) advance() else Workout.current()?.let { cues(it, before, after) }
        }
        lastTick = now
        if (Workout.active) {
            refresh(force = false)
            handler.postDelayed(ticker, 40)
        }
    }

    private fun resetCues() { cuePhase = -1; cueRep = -1; cueHalf = false }

    /** Sonido durante el ejercicio: tono agudo al subir/empujar y grave al bajar/volver, cuenta en voz alta,
     *  «mitad» en los de mantener y pitidos en los 3 últimos segundos. Igual que cues() en index.html. */
    private fun cues(st: Step, before: Int, after: Int) {
        val el = Workout.elapsedInStep()
        if (!st.prep && !st.rest && st.reps > 0) {
            val ex = Rutina.get(this).ex(st.k)
            val k = ex.phaseCount(el)
            if (k != cuePhase) {
                cuePhase = k
                when (ex.phases[k % ex.phases.size].tone) {
                    1 -> beeper?.beep(Beeper.UP, 150)
                    -1 -> beeper?.beep(Beeper.DOWN, 150)
                }
            }
            val n = (el / ex.rep).toInt()
            if (n != cueRep && n < st.reps) {
                cueRep = n
                if (Workout.count) {
                    val nums = Rutina.get(this).numbers
                    speak(if (n == st.reps - 1) "Última" else nums.getOrElse(n) { (n + 1).toString() })
                }
            }
            return
        }
        if (!st.prep && !st.rest && !cueHalf && st.s >= 10 && el >= st.s / 2f) {
            cueHalf = true
            speak("Mitad")
        }
        if (after != before && after in 1..3) beeper?.beep(Beeper.COUNT, 80)
    }

    private fun advance() {
        resetCues()
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
            st.rest || st.prep -> { beeper?.beep(Beeper.PREP, 250); speak(st.say) }
            st.reps > 0 -> if (!Workout.count) speak("Empieza") // el tono de la fase y la cuenta marcan el inicio
            else -> { beeper?.beep(Beeper.START, 350); speak("Empieza") }
        }
    }

    private fun finish() {
        finishing = true
        val rounds = Workout.rounds
        val day = Workout.day
        Workout.active = false
        Workout.running = false
        Workout.done = true
        Workout.idx = 0
        Store.markDone(this, rounds, day)
        beeper?.chime()
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
            val title = if (st.prep) "Prepárate: " + Rutina.get(this).ex(st.k).name else st.name
            var text = "${fmt(Workout.leftSec())} · Ronda ${st.r}/${Workout.rounds}"
            if (!st.prep && !st.rest && st.reps > 0) {
                val n = minOf(st.reps, (Workout.elapsedInStep() / Rutina.get(this).ex(st.k).rep).toInt() + 1)
                text += " · $n/${st.reps}"
            }
            st.kg?.let { text += " · " + kgRange(it) }
            b.setContentTitle(title)
                .setContentText(text)
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
        beeper?.release()
        super.onDestroy()
    }
}
