package com.vignasi.rutinacore

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import kotlin.math.PI
import kotlin.math.min
import kotlin.math.sin

/** Pitidos de tono puro (mismas frecuencias que la página web) para no depender del ToneGenerator. */
class Beeper {
    companion object {
        const val UP = 880       // sube / empuja
        const val DOWN = 440     // baja / vuelve
        const val START = 988
        const val PREP = 520
        const val COUNT = 740    // 3 últimos segundos
        private const val RATE = 44100
    }

    private val tracks = HashMap<String, AudioTrack>()

    fun beep(freq: Int, ms: Int) {
        try {
            val key = "$freq/$ms"
            val t = tracks.getOrPut(key) { build(freq, ms) }
            if (t.playState == AudioTrack.PLAYSTATE_PLAYING) t.stop()
            t.reloadStaticData()
            t.play()
        } catch (e: Exception) { }
    }

    fun chime() {
        val h = android.os.Handler(android.os.Looper.getMainLooper())
        listOf(523, 659, 784, 1047).forEachIndexed { i, f -> h.postDelayed({ beep(f, if (i == 3) 600 else 180) }, i * 190L) }
    }

    private fun build(freq: Int, ms: Int): AudioTrack {
        val n = RATE * ms / 1000
        val pcm = ShortArray(n)
        val fade = RATE / 200 // 5 ms para que no haga clic
        for (i in 0 until n) {
            val env = min(1.0, min(i, n - 1 - i).toDouble() / fade)
            pcm[i] = (sin(2 * PI * freq * i / RATE) * env * 0.45 * Short.MAX_VALUE).toInt().toShort()
        }
        val t = AudioTrack.Builder()
            .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
            .setAudioFormat(AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT).setSampleRate(RATE).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
            .setTransferMode(AudioTrack.MODE_STATIC)
            .setBufferSizeInBytes(n * 2)
            .build()
        t.write(pcm, 0, n)
        return t
    }

    fun release() {
        tracks.values.forEach { try { it.release() } catch (e: Exception) { } }
        tracks.clear()
    }
}
