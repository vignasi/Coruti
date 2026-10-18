package com.vignasi.rutinacore

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.speech.tts.TextToSpeech
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import java.util.Locale

class MainActivity : Activity() {

    companion object {
        const val EXTRA_AUTOSTART = "autostart"
    }

    private lateinit var web: WebView
    private var tts: TextToSpeech? = null
    private var pageReady = false
    private var pendingAutostart = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale("es", "ES")
            }
        }

        web = WebView(this)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        web.addJavascriptInterface(Bridge(), "Android")
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                if (url.scheme == "http" || url.scheme == "https") {
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                    return true
                }
                return false
            }

            override fun onPageFinished(view: WebView, url: String) {
                pageReady = true
                js("window.refreshStats && window.refreshStats()")
                if (pendingAutostart) {
                    pendingAutostart = false
                    js("window.autoStart && window.autoStart()")
                }
            }
        }
        setContentView(web)

        pendingAutostart = intent?.getBooleanExtra(EXTRA_AUTOSTART, false) == true
        web.loadUrl("file:///android_asset/index.html")
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (intent.getBooleanExtra(EXTRA_AUTOSTART, false)) {
            if (pageReady) js("window.autoStart && window.autoStart()") else pendingAutostart = true
        }
    }

    override fun onResume() {
        super.onResume()
        RutinaWidget.refreshAll(this)
        if (pageReady) js("window.refreshStats && window.refreshStats()")
    }

    override fun onDestroy() {
        tts?.shutdown()
        web.destroy()
        super.onDestroy()
    }

    private fun js(code: String) {
        web.evaluateJavascript(code, null)
    }

    inner class Bridge {
        @JavascriptInterface
        fun speak(text: String) {
            runOnUiThread { tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "rutina") }
        }

        @JavascriptInterface
        fun vibrate() {
            val v = getSystemService(Vibrator::class.java) ?: return
            v.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 300, 150, 300, 150, 600), -1))
        }

        @JavascriptInterface
        fun markDone(rounds: Int) {
            Store.markDone(this@MainActivity, rounds)
            runOnUiThread { RutinaWidget.refreshAll(this@MainActivity) }
        }

        @JavascriptInterface
        fun stats(): String {
            val c = this@MainActivity
            return "{\"today\":${Store.doneToday(c)},\"streak\":${Store.streak(c)},\"total\":${Store.total(c)}}"
        }
    }
}
