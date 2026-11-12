package com.vignasi.rutinacore

import android.content.Context
import android.os.Handler
import android.os.Looper
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

/**
 * Cuenta y datos en la nube (Supabase). Sin cuenta la app funciona igual que siempre, solo en el móvil.
 *
 * Entrar: te llega un código por email y lo escribes (no hay contraseñas). Al entrar por primera vez se sube
 * lo que hay en el móvil; después se sincroniza al terminar cada sesión y al abrir la app.
 * Si entra otra cuenta en este móvil, lo del móvil se cambia por lo de esa cuenta (solo si no queda nada sin subir).
 *
 * La clave que va aquí es la pública: sin entrar no deja leer ni escribir nada (RLS, ver supabase/migrations).
 */
object Cloud {
    private const val URL_BASE = "https://jlyqtxihsorqczlxvbly.supabase.co"
    private const val KEY = "sb_publishable_f2Z1xuqDy0reZeLvTEVMaA_IlDu_Vw5"
    private const val PREFS = "cloud"

    /** Avisa a la pantalla (MainActivity) cuando cambia algo: dataChanged = han llegado datos de la nube. */
    @Volatile var listener: ((dataChanged: Boolean) -> Unit)? = null

    private val exec = Executors.newSingleThreadScheduledExecutor()
    private var scheduled: ScheduledFuture<*>? = null
    @Volatile private var busy = false

    class CloudError(msg: String) : Exception(msg)

    private fun prefs(c: Context) = c.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun signedIn(c: Context) = prefs(c).getString("rt", "").orEmpty().isNotEmpty()

    /** Lo que enseña la pantalla de la cuenta. */
    fun stateJson(c: Context): String {
        val p = prefs(c)
        val pending = try { SyncLogic.pendingSessions(History.all(c), uploaded(c)).size } catch (e: Exception) { 0 }
        return JSONObject()
            .put("signedIn", signedIn(c))
            .put("email", p.getString("email", ""))
            .put("busy", busy)
            .put("pending", pending)
            .put("lastSync", p.getLong("lastSync", 0))
            .put("msg", p.getString("msg", ""))
            .put("ok", p.getBoolean("msgOk", true))
            .toString()
    }

    private fun setMsg(c: Context, msg: String, ok: Boolean) {
        prefs(c).edit().putString("msg", msg).putBoolean("msgOk", ok).apply()
    }

    private fun notifyUi(dataChanged: Boolean) {
        Handler(Looper.getMainLooper()).post { listener?.invoke(dataChanged) }
    }

    /* ---------------- Red ---------------- */

    private class Resp(val code: Int, val body: String)

    private fun http(method: String, path: String, body: String?, token: String?, extra: Map<String, String> = emptyMap()): Resp {
        val conn = URL(URL_BASE + path).openConnection() as HttpURLConnection
        try {
            conn.requestMethod = method
            conn.connectTimeout = 15000
            conn.readTimeout = 30000
            conn.setRequestProperty("apikey", KEY)
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Accept", "application/json")
            if (token != null) conn.setRequestProperty("Authorization", "Bearer $token")
            extra.forEach { (k, v) -> conn.setRequestProperty(k, v) }
            if (body != null) {
                conn.doOutput = true
                conn.outputStream.use { it.write(body.toByteArray()) }
            }
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val text = stream?.use { it.readBytes().toString(Charsets.UTF_8) } ?: ""
            return Resp(code, text)
        } finally {
            conn.disconnect()
        }
    }

    private fun errorText(r: Resp): String {
        val o = try { JSONObject(r.body) } catch (e: Exception) { null }
        val m = o?.optString("msg").orEmpty().ifEmpty { o?.optString("error_description").orEmpty() }
            .ifEmpty { o?.optString("message").orEmpty() }
        return when {
            r.code == 429 -> "Demasiados intentos. Espera unos minutos y vuelve a probar."
            m.contains("expired", true) || m.contains("invalid", true) -> "El código no es correcto o ha caducado. Pide otro."
            m.isNotEmpty() -> "Error de la nube (${r.code}): $m"
            else -> "Error de la nube (${r.code})."
        }
    }

    /* ---------------- Entrar y salir ---------------- */

    /** Pide el código. Si el email no tiene cuenta, se crea. */
    fun sendCode(c: Context, email: String, done: (String, Boolean) -> Unit) = exec.execute {
        val (msg, ok) = try {
            val r = http("POST", "/auth/v1/otp", JSONObject().put("email", email.trim()).put("create_user", true).toString(), null)
            if (r.code in 200..299) "Te hemos enviado un código a ${email.trim()}. Mira también en spam." to true
            else errorText(r) to false
        } catch (e: IOException) { "Sin conexión. Prueba otra vez cuando tengas internet." to false }
        Handler(Looper.getMainLooper()).post { done(msg, ok) }
    }

    /** Comprueba el código; si es correcto, guarda la sesión y sincroniza. */
    fun verify(c: Context, email: String, code: String, done: (String, Boolean) -> Unit) = exec.execute {
        val (msg, ok) = try {
            val r = http("POST", "/auth/v1/verify",
                JSONObject().put("type", "email").put("email", email.trim()).put("token", code.trim()).toString(), null)
            if (r.code !in 200..299) errorText(r) to false else {
                val o = JSONObject(r.body)
                val user = o.optJSONObject("user") ?: JSONObject()
                val uid = user.optString("id")
                val at = o.optString("access_token")
                val p = prefs(c)
                val last = p.getString("lastUid", "").orEmpty()
                if (last.isNotEmpty() && last != uid && hasUnsynced(c)) {
                    try { http("POST", "/auth/v1/logout", null, at) } catch (e: Exception) { }
                    ("En este móvil hay datos de otra cuenta que aún no se han subido. Entra con esa cuenta, " +
                        "espera a que se sincronice y luego cambia de cuenta.") to false
                } else {
                    if (last.isNotEmpty() && last != uid) wipeLocal(c)
                    saveTokens(c, o)
                    p.edit().putString("uid", uid).putString("lastUid", uid)
                        .putString("email", user.optString("email", email.trim())).apply()
                    "Has entrado como ${user.optString("email", email.trim())}." to true
                }
            }
        } catch (e: IOException) { "Sin conexión. Prueba otra vez cuando tengas internet." to false }
        catch (e: Exception) { "No se pudo entrar: ${e.message}" to false }
        Handler(Looper.getMainLooper()).post { done(msg, ok) }
        if (ok) { setMsg(c, msg, true); syncNow(c) }
    }

    /** Sale de la cuenta. Los datos se quedan en el móvil. */
    fun signOut(c: Context, done: () -> Unit) = exec.execute {
        val at = prefs(c).getString("at", null)
        try { if (at != null) http("POST", "/auth/v1/logout", null, at) } catch (e: Exception) { }
        prefs(c).edit().remove("at").remove("rt").remove("exp").remove("uid").remove("email").apply()
        setMsg(c, "Has salido de la cuenta. Tus datos siguen en el móvil.", true)
        Handler(Looper.getMainLooper()).post { done() }
    }

    private fun saveTokens(c: Context, o: JSONObject) {
        prefs(c).edit()
            .putString("at", o.optString("access_token"))
            .putString("rt", o.optString("refresh_token"))
            .putLong("exp", System.currentTimeMillis() + o.optLong("expires_in", 3600) * 1000)
            .apply()
    }

    /** Un token válido; lo renueva si va a caducar. */
    private fun token(c: Context): String {
        val p = prefs(c)
        val rt = p.getString("rt", "").orEmpty()
        if (rt.isEmpty()) throw CloudError("Sin cuenta")
        val at = p.getString("at", "").orEmpty()
        if (at.isNotEmpty() && p.getLong("exp", 0) > System.currentTimeMillis() + 60_000) return at
        val r = http("POST", "/auth/v1/token?grant_type=refresh_token", JSONObject().put("refresh_token", rt).toString(), null)
        if (r.code in 400..499) {
            p.edit().remove("at").remove("rt").remove("exp").apply()
            throw CloudError("La sesión de tu cuenta ha caducado. Vuelve a entrar con tu email.")
        }
        if (r.code !in 200..299) throw CloudError(errorText(r))
        val o = JSONObject(r.body)
        saveTokens(c, o)
        return o.optString("access_token")
    }

    private fun uploaded(c: Context): JSONObject =
        try { JSONObject(prefs(c).getString("up", "{}") ?: "{}") } catch (e: Exception) { JSONObject() }

    /** ¿Queda algo del móvil sin subir? (sesiones o cambios de ajustes, favoritas, bandas…) */
    private fun hasUnsynced(c: Context): Boolean {
        if (SyncLogic.pendingSessions(History.all(c), uploaded(c)).isNotEmpty()) return true
        val lastL = prefs(c).getString("lastL", null)
        val hasState = History.all(c).length() > 0 || Store.allDays(c).isNotEmpty()
        return if (lastL == null) hasState else SyncLogic.hash(SyncLogic.stateOf(Backup.snapshot(c))) != lastL
    }

    /** Cambio de cuenta: el móvil se queda en blanco y luego se baja lo de la cuenta nueva. */
    private fun wipeLocal(c: Context) {
        Store.prefs(c).edit().clear().commit()
        History.replaceAll(c, JSONArray())
        prefs(c).edit().remove("up").remove("lastL").remove("lastR").remove("pullAt").remove("pullId").apply()
    }

    /* ---------------- Sincronizar ---------------- */

    /** Sincroniza dentro de unos segundos (se juntan varios avisos seguidos, p. ej. guardar sesión y «cómo te ha ido»). */
    fun syncSoon(c: Context, delaySec: Long = 4) {
        val app = c.applicationContext
        if (!signedIn(app)) return
        synchronized(this) {
            scheduled?.cancel(false)
            scheduled = exec.schedule({ runSync(app) }, delaySec, TimeUnit.SECONDS)
        }
    }

    fun syncNow(c: Context) {
        val app = c.applicationContext
        if (!signedIn(app)) return
        exec.execute { runSync(app) }
    }

    private fun runSync(c: Context) {
        if (!signedIn(c)) return
        busy = true
        notifyUi(false)
        var changed = false
        try {
            changed = sync(c)
            prefs(c).edit().putLong("lastSync", System.currentTimeMillis()).apply()
            setMsg(c, "", true)
        } catch (e: CloudError) {
            setMsg(c, e.message ?: "No se pudo sincronizar.", false)
        } catch (e: IOException) {
            setMsg(c, "Sin conexión: se sincronizará más tarde.", false)
        } catch (e: Exception) {
            setMsg(c, "No se pudo sincronizar: ${e.message}", false)
        } finally {
            busy = false
            if (changed) Handler(Looper.getMainLooper()).post { WidgetUpdater.refresh(c, force = true) }
            notifyUi(changed)
        }
    }

    private fun rpc(c: Context, fn: String, body: JSONObject): String {
        val r = http("POST", "/rest/v1/rpc/$fn", body.toString(), token(c))
        if (r.code !in 200..299) throw CloudError(errorText(r))
        return r.body
    }

    /** Una vuelta completa: bajar sesiones, subir las pendientes y poner de acuerdo el resto del estado. Devuelve si cambió algo en el móvil. */
    private fun sync(c: Context): Boolean {
        val p = prefs(c)
        val uid = p.getString("uid", "").orEmpty()
        var changed = false

        // 1. Bajar las sesiones cambiadas desde la última vez (de 200 en 200)
        val up = uploaded(c)
        var afterAt = p.getString("pullAt", "-infinity")!!
        var afterId = p.getString("pullId", "")!!
        while (true) {
            val page = JSONArray(rpc(c, "pull_sessions", JSONObject().put("after_at", afterAt).put("after_id", afterId).put("max_rows", 200)))
            if (page.length() == 0) break
            val list = (0 until page.length()).map { page.getJSONObject(it) }
            afterAt = list.last().getString("_u"); afterId = list.last().getString("_id")
            var n = 0
            History.update(c) { local ->
                val (merged, k) = SyncLogic.mergeRemoteSessions(local, list.map { SyncLogic.cleanRemote(it) }, up)
                n = k; merged
            }
            if (n > 0) changed = true
            p.edit().putString("up", up.toString()).putString("pullAt", afterAt).putString("pullId", afterId).apply()
            if (page.length() < 200) break
        }

        // 2. Subir las sesiones pendientes (de 50 en 50)
        SyncLogic.pendingSessions(History.all(c), up).chunked(50).forEach { batch ->
            rpc(c, "push_sessions", JSONObject().put("sessions", JSONArray(batch)))
            batch.forEach { up.put(it.optString("id"), SyncLogic.sessionHash(it)) }
            p.edit().putString("up", up.toString()).apply()
        }

        // 3. Ajustes, pesos, bandas, favoritas y racha. Mientras el widget hace una sesión no se toca nada
        if (Workout.active) return changed
        val remote = fetchRemoteState(c)
        val local = SyncLogic.stateOf(Backup.snapshot(c))
        val lHash = SyncLogic.hash(local)
        val rHash = remote?.let { SyncLogic.hash(it) }
        val action = SyncLogic.decide(lHash, rHash, p.getString("lastL", null), p.getString("lastR", null))
        var newLocal = local
        when (action) {
            SyncLogic.Action.NONE -> {}
            SyncLogic.Action.PUSH -> pushState(c, uid, local)
            SyncLogic.Action.PULL -> { Backup.apply(c, remote!!, withHistory = false); changed = true }
            SyncLogic.Action.MERGE -> {
                val merged = SyncLogic.mergeStates(remote!!, local)
                Backup.apply(c, merged, withHistory = false)
                changed = true
                pushState(c, uid, merged)
            }
        }
        if (action != SyncLogic.Action.NONE) {
            newLocal = SyncLogic.stateOf(Backup.snapshot(c))
            val after = if (action == SyncLogic.Action.PULL) remote else fetchRemoteState(c)
            p.edit().putString("lastL", SyncLogic.hash(newLocal)).putString("lastR", SyncLogic.hash(after)).apply()
        }
        return changed
    }

    /** El estado de la nube con la forma del móvil, o null si esta cuenta aún no ha subido nada. */
    private fun fetchRemoteState(c: Context): JSONObject? {
        val t = token(c)
        val r = http("GET", "/rest/v1/app_state?select=data", null, t)
        if (r.code !in 200..299) throw CloudError(errorText(r))
        val rows = JSONArray(r.body)
        if (rows.length() == 0) return null
        val f = http("GET", "/rest/v1/favorites?select=data&order=position.asc", null, t)
        if (f.code !in 200..299) throw CloudError(errorText(f))
        val favRows = JSONArray(f.body)
        val favs = JSONArray().apply { for (i in 0 until favRows.length()) favRows.getJSONObject(i).optJSONObject("data")?.let { put(it) } }
        return SyncLogic.remoteState(rows.getJSONObject(0).optJSONObject("data"), favs)
    }

    private fun pushState(c: Context, uid: String, state: JSONObject) {
        val r = http("POST", "/rest/v1/app_state?on_conflict=user_id",
            JSONArray().put(JSONObject().put("user_id", uid).put("data", SyncLogic.appStateData(state))).toString(),
            token(c), mapOf("Prefer" to "resolution=merge-duplicates,return=minimal"))
        if (r.code !in 200..299) throw CloudError(errorText(r))
        rpc(c, "replace_favorites", JSONObject().put("favs", SyncLogic.favsOf(state)))
    }
}
