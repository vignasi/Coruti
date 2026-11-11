package com.vignasi.rutinacore

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Build
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
        private const val REQ_EXPORT = 11
        private const val REQ_IMPORT = 12
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

        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }

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
        WidgetUpdater.refresh(this, force = true)
        if (pageReady) js("window.reloadConfig && window.reloadConfig(); window.refreshStats && window.refreshStats()")
    }

    override fun onDestroy() {
        tts?.shutdown()
        web.destroy()
        super.onDestroy()
    }

    /** Resultado del selector de archivos de Android: guarda la copia o la importa y avisa a la página. */
    @Deprecated("Activity sin AndroidX: el selector de archivos devuelve aquí el resultado")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQ_EXPORT && requestCode != REQ_IMPORT) return
        val uri = data?.data
        if (resultCode != RESULT_OK || uri == null) { backupDone("", true); return }
        Thread {
            var ok = true
            val msg = try {
                if (requestCode == REQ_EXPORT) {
                    val s = Backup.snapshot(this)
                    contentResolver.openOutputStream(uri, "wt")!!.use { it.write(s.toString(1).toByteArray()) }
                    "Copia guardada: ${s.getJSONArray("history").length()} sesiones, favoritas, bandas, pesos, ajustes y racha."
                } else {
                    val text = contentResolver.openInputStream(uri)!!.use { it.readBytes().toString(Charsets.UTF_8) }
                    Backup.import(this, text)
                }
            } catch (e: IllegalArgumentException) {
                ok = false; e.message ?: "No se pudo leer la copia."
            } catch (e: Exception) {
                ok = false; if (requestCode == REQ_EXPORT) "No se pudo guardar la copia." else "No se pudo leer la copia."
            }
            runOnUiThread {
                if (requestCode == REQ_IMPORT && ok) WidgetUpdater.refresh(this, force = true)
                backupDone(msg, ok, imported = requestCode == REQ_IMPORT && ok)
            }
        }.start()
    }

    private fun backupDone(msg: String, ok: Boolean, imported: Boolean = false) {
        if (pageReady) js("window.onBackup && window.onBackup(${org.json.JSONObject.quote(msg)}, $ok, $imported)")
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
        fun markDone(rounds: Int, day: String) {
            Store.markDone(this@MainActivity, rounds, day)
            runOnUiThread { WidgetUpdater.refresh(this@MainActivity, force = true) }
        }

        @JavascriptInterface
        fun markDay() {
            Store.markDay(this@MainActivity)
            runOnUiThread { WidgetUpdater.refresh(this@MainActivity, force = true) }
        }

        @JavascriptInterface
        fun getFree(key: String): String = Store.getFree(this@MainActivity, key)

        @JavascriptInterface
        fun setFree(key: String, value: String) = Store.setFree(this@MainActivity, key, value)

        /** El contenido de assets/rutina.json: la página y el widget usan los mismos datos. */
        @JavascriptInterface
        fun rutina(): String = Rutina.text(this@MainActivity)

        @JavascriptInterface
        fun getConfig(): String = Store.configJson(this@MainActivity)

        @JavascriptInterface
        fun setConfig(json: String) {
            Store.setConfigJson(this@MainActivity, json)
            runOnUiThread { WidgetUpdater.refresh(this@MainActivity, force = true) }
        }

        @JavascriptInterface
        fun getWeights(): String = Store.weightsJson(this@MainActivity)

        @JavascriptInterface
        fun setWeight(key: String, kg: Double) = Store.setWeight(this@MainActivity, key, kg)

        @JavascriptInterface
        fun lastDay(): String = Store.lastDay(this@MainActivity)

        @JavascriptInterface
        fun sessions(): Int = Store.sessions(this@MainActivity)

        /** Historial: la página manda cada sesión al terminarla (o al pararla a mitad) y lo lee para la pantalla «Historial». */
        @JavascriptInterface
        fun saveSession(json: String): Boolean =
            try { History.add(this@MainActivity, org.json.JSONObject(json)) } catch (e: Exception) { false }

        @JavascriptInterface
        fun history(): String = History.text(this@MainActivity)

        @JavascriptInterface
        fun setSessionFeedback(id: String, json: String) {
            try { History.setFeedback(this@MainActivity, id, org.json.JSONObject(json)) } catch (e: Exception) { }
        }

        /** Copia de seguridad: abre «Guardar como» de Android (Drive, Descargas…) con todo en un archivo JSON. */
        @JavascriptInterface
        fun exportData() = runOnUiThread {
            val name = "rutina-core-" + java.time.LocalDate.now() + ".json"
            val i = Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                .setType("application/json").putExtra(Intent.EXTRA_TITLE, name)
            try { @Suppress("DEPRECATION") startActivityForResult(i, REQ_EXPORT) } catch (e: Exception) { backupDone("No hay ninguna app para guardar archivos.", false) }
        }

        /** Elige un archivo de copia y lo combina con lo que hay en el móvil. */
        @JavascriptInterface
        fun importData() = runOnUiThread {
            val i = Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
            try { @Suppress("DEPRECATION") startActivityForResult(i, REQ_IMPORT) } catch (e: Exception) { backupDone("No hay ninguna app para abrir archivos.", false) }
        }

        @JavascriptInterface
        fun stats(): String {
            val c = this@MainActivity
            return "{\"today\":${Store.doneToday(c)},\"streak\":${Store.streak(c)},\"total\":${Store.total(c)}}"
        }
    }
}
