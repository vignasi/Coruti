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
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import java.util.Locale

class MainActivity : Activity() {

    companion object {
        const val EXTRA_AUTOSTART = "autostart"
        /** Los assets se sirven con esta dirección (no file://): los módulos de three.js y los modelos .glb no cargan desde file://. */
        const val HOST = "appassets.androidplatform.net"
        private val MIME = mapOf("html" to "text/html", "js" to "text/javascript", "mjs" to "text/javascript", "css" to "text/css",
            "json" to "application/json", "glb" to "model/gltf-binary", "woff2" to "font/woff2", "webp" to "image/webp",
            "png" to "image/png", "svg" to "image/svg+xml", "txt" to "text/plain")
        private const val REQ_EXPORT = 11
        private const val REQ_IMPORT = 12
    }

    private lateinit var web: WebView
    private var tts: TextToSpeech? = null
    private var pageReady = false
    private var pendingAutostart = false
    private var pendingConnMsg: org.json.JSONObject? = null

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
        // La letra del sistema la aplica la página (--escala, con tope en los textos grandes): así el reproductor sigue cabiendo
        web.settings.textZoom = 100
        web.settings.allowFileAccess = false
        web.addJavascriptInterface(Bridge(), "Android")
        web.webViewClient = object : WebViewClient() {
            /** https://appassets.androidplatform.net/<ruta> → assets/<ruta>. El resto de la red no pasa por aquí. */
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                val url = request.url
                if (url.host != HOST) return null
                val path = (url.path ?: "/").trimStart('/').ifEmpty { "index.html" }
                if (path.contains("..")) return WebResourceResponse("text/plain", "utf-8", 404, "No", emptyMap(), null)
                val ext = path.substringAfterLast('.', "").lowercase()
                return try {
                    val r = WebResourceResponse(MIME[ext] ?: "application/octet-stream", if (ext in setOf("html", "js", "css", "json", "txt")) "utf-8" else null, assets.open(path))
                    r.responseHeaders = mapOf("Access-Control-Allow-Origin" to "*", "Cache-Control" to "no-cache")
                    r
                } catch (e: Exception) {
                    WebResourceResponse("text/plain", "utf-8", 404, "No encontrado", emptyMap(), null)
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                if (url.host == HOST) return false
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
                flushConnMsg()
            }
        }
        setContentView(web)

        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }

        pendingAutostart = intent?.getBooleanExtra(EXTRA_AUTOSTART, false) == true
        handleConnReturn(intent)
        // La nube avisa al terminar de sincronizar; si han llegado datos, la página los vuelve a leer
        Cloud.listener = { changed -> cloudChanged(changed) }
        web.loadUrl("https://$HOST/index.html?escala=" + resources.configuration.fontScale)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleConnReturn(intent)
        if (intent.getBooleanExtra(EXTRA_AUTOSTART, false)) {
            if (pageReady) js("window.autoStart && window.autoStart()") else pendingAutostart = true
        }
    }

    override fun onResume() {
        super.onResume()
        WidgetUpdater.refresh(this, force = true)
        if (pageReady) js("window.reloadConfig && window.reloadConfig(); window.refreshStats && window.refreshStats()")
        Cloud.syncSoon(this, 1)
    }

    /** Atrás: primero lo resuelve la página (cerrar una hoja, volver de una subpantalla, pausar la sesión). */
    @Deprecated("Activity sin AndroidX: Atrás llega aquí")
    override fun onBackPressed() {
        if (!pageReady) { @Suppress("DEPRECATION") super.onBackPressed(); return }
        web.evaluateJavascript("window.atras ? window.atras() : false") { r ->
            if (r != "true") { @Suppress("DEPRECATION") super.onBackPressed() }
        }
    }

    override fun onDestroy() {
        Cloud.listener = null
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
                if (requestCode == REQ_IMPORT && ok) { WidgetUpdater.refresh(this, force = true); Cloud.syncSoon(this) }
                backupDone(msg, ok, imported = requestCode == REQ_IMPORT && ok)
            }
        }.start()
    }

    private fun backupDone(msg: String, ok: Boolean, imported: Boolean = false) {
        if (pageReady) js("window.onBackup && window.onBackup(${org.json.JSONObject.quote(msg)}, $ok, $imported)")
    }

    private fun connMsg(msg: String, ok: Boolean) {
        if (pageReady) js("window.onConnMsg && window.onConnMsg(${org.json.JSONObject.quote(msg)}, $ok)")
    }

    /** Vuelta de Strava o Polar tras dar (o no) permiso: rutinacore://conexion?p=strava&ok=1&msg=… */
    private fun handleConnReturn(intent: Intent?) {
        val u = intent?.data ?: return
        if (u.scheme != "rutinacore" || u.host != "conexion") return
        intent?.data = null
        val ok = u.getQueryParameter("ok") == "1"
        val msg = u.getQueryParameter("msg").orEmpty().ifEmpty { if (ok) "Conectado." else "No se pudo conectar." }
        pendingConnMsg = org.json.JSONObject().put("msg", msg).put("ok", ok)
        if (pageReady) flushConnMsg()
        Cloud.syncNow(this)
    }

    private fun flushConnMsg() {
        val m = pendingConnMsg ?: return
        pendingConnMsg = null
        js("window.irConexiones && irConexiones(); window.onConnMsg && window.onConnMsg(${org.json.JSONObject.quote(m.getString("msg"))}, ${m.getBoolean("ok")})")
    }

    private fun cloudChanged(changed: Boolean) {
        if (pageReady) js("window.onCloud && window.onCloud(${org.json.JSONObject.quote(Cloud.stateJson(this))}, $changed)")
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
        fun setFree(key: String, value: String) {
            Store.setFree(this@MainActivity, key, value)
            // Lo que muestra el widget depende de la favorita marcada, de sus rondas y de las bandas
            if (key != "free.last") runOnUiThread { WidgetUpdater.refresh(this@MainActivity, force = true) }
        }

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

        /* ---------- Cuenta y nube (pantalla provisional en Historial) ---------- */
        @JavascriptInterface
        fun cloudState(): String = Cloud.stateJson(this@MainActivity)

        @JavascriptInterface
        fun cloudSendCode(email: String) = Cloud.sendCode(this@MainActivity, email) { msg, ok ->
            if (pageReady) js("window.onCloudMsg && window.onCloudMsg(${org.json.JSONObject.quote(msg)}, $ok, 'code')")
        }

        @JavascriptInterface
        fun cloudVerify(email: String, code: String) = Cloud.verify(this@MainActivity, email, code) { msg, ok ->
            if (pageReady) js("window.onCloudMsg && window.onCloudMsg(${org.json.JSONObject.quote(msg)}, $ok, 'verify')")
        }

        @JavascriptInterface
        fun cloudSignIn(email: String, password: String) = Cloud.signIn(this@MainActivity, email, password) { msg, ok ->
            if (pageReady) js("window.onCloudMsg && window.onCloudMsg(${org.json.JSONObject.quote(msg)}, $ok, 'verify')")
        }

        @JavascriptInterface
        fun cloudChangePassword(password: String) = Cloud.changePassword(this@MainActivity, password) { msg, ok ->
            if (pageReady) js("window.onCloudMsg && window.onCloudMsg(${org.json.JSONObject.quote(msg)}, $ok, 'clave')")
        }

        @JavascriptInterface
        fun cloudSync() = Cloud.syncNow(this@MainActivity)

        @JavascriptInterface
        fun cloudSignOut() = Cloud.signOut(this@MainActivity) { cloudChanged(false) }

        /* ---------- Strava y Polar (S1) ---------- */
        @JavascriptInterface
        fun setSessionFields(id: String, json: String) {
            try { History.setFields(this@MainActivity, id, org.json.JSONObject(json)) } catch (e: Exception) { }
        }

        /** Abre en el navegador la página de Strava o Polar para dar permiso; al terminar vuelve con rutinacore://conexion. */
        @JavascriptInterface
        fun connConnect(provider: String) = Cloud.connect(this@MainActivity, provider) { res, ok ->
            if (ok) {
                try { startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(res))) }
                catch (e: Exception) { connMsg("No hay navegador para abrir la página de conectar.", false) }
            } else connMsg(res, false)
        }

        @JavascriptInterface
        fun connDisconnect(provider: String) = Cloud.disconnect(this@MainActivity, provider) { msg, ok -> connMsg(msg, ok) }

        @JavascriptInterface
        fun connForward(on: Boolean) = Cloud.setForward(this@MainActivity, on) { msg, ok -> connMsg(msg, ok) }

        @JavascriptInterface
        fun stravaSend(id: String) = Cloud.sendToStrava(this@MainActivity, id) { msg, ok ->
            if (pageReady) js("window.onStravaSent && window.onStravaSent(${org.json.JSONObject.quote(id)}, ${org.json.JSONObject.quote(msg)}, $ok)")
        }

        /** Días hechos (fechas «2026-11-11»), para la semana de Entrenar. */
        @JavascriptInterface
        fun days(): String = org.json.JSONArray(Store.allDays(this@MainActivity).sorted()).toString()

        @JavascriptInterface
        fun stats(): String {
            val c = this@MainActivity
            return "{\"today\":${Store.doneToday(c)},\"streak\":${Store.streak(c)},\"total\":${Store.total(c)}}"
        }
    }
}
