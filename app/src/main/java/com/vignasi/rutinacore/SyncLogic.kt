package com.vignasi.rutinacore

import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest

/**
 * La parte de la sincronización que no toca ni el móvil ni la red (se prueba en SyncLogicTest).
 *
 * Sesiones: se comparan por contenido. Cada sesión subida o bajada guarda la huella de lo que hay en la nube;
 * si la del móvil ya no coincide (sesión nueva, «cómo te ha ido», copia importada), está pendiente de subir.
 *
 * Estado (ajustes, pesos, bandas, favoritas, racha): se guarda la huella de cómo quedó en el móvil y en la nube
 * tras la última sincronización. Si solo cambió un lado, gana ese; si cambiaron los dos (o es la primera vez),
 * se combinan como al importar una copia (Backup.merge) con el móvil por encima.
 */
object SyncLogic {

    /** JSON con las claves ordenadas, para que la misma información dé siempre la misma huella. */
    fun canonical(v: Any?): String = when (v) {
        null, JSONObject.NULL -> "null"
        is JSONObject -> v.keys().asSequence().toList().sorted()
            .joinToString(",", "{", "}") { JSONObject.quote(it) + ":" + canonical(v.opt(it)) }
        is JSONArray -> (0 until v.length()).joinToString(",", "[", "]") { canonical(v.opt(it)) }
        is String -> JSONObject.quote(v)
        is Boolean -> v.toString()
        is Number -> num(v)
        else -> JSONObject.quote(v.toString())
    }

    /** 7.5, 7.50 y 7.5000 son el mismo número; 12 y 12.0 también. */
    private fun num(n: Number): String {
        val d = n.toDouble()
        if (d.isNaN() || d.isInfinite()) return "null"
        if (d == Math.rint(d) && Math.abs(d) < 1e15) return d.toLong().toString()
        return java.math.BigDecimal(n.toString()).stripTrailingZeros().toPlainString()
    }

    fun hash(v: Any?): String {
        val md = MessageDigest.getInstance("SHA-256").digest(canonical(v).toByteArray())
        return md.take(12).joinToString("") { "%02x".format(it) }
    }

    /** Huella de una sesión del historial. Se ignoran los nulos para que la del móvil y la de la nube coincidan. */
    fun sessionHash(s: JSONObject): String = hash(dropNulls(s))

    private fun dropNulls(v: Any?): Any? = when (v) {
        is JSONObject -> JSONObject().also { o -> v.keys().forEach { k -> val x = v.opt(k); if (x != null && x != JSONObject.NULL) o.put(k, dropNulls(x)) } }
        is JSONArray -> JSONArray().also { a -> (0 until v.length()).forEach { a.put(dropNulls(v.opt(it))) } }
        else -> v
    }

    /** Sesiones del móvil que hay que subir: las que no están en la nube o han cambiado desde que se subieron. */
    fun pendingSessions(local: JSONArray, uploaded: JSONObject): List<JSONObject> =
        (0 until local.length()).mapNotNull { local.optJSONObject(it) }
            .filter { it.optString("id").isNotEmpty() && uploaded.optString(it.optString("id")) != sessionHash(it) }

    /**
     * Une al historial del móvil las sesiones bajadas de la nube. Una sesión del móvil pendiente de subir
     * no se pisa (se subirá después); las demás se sustituyen por la de la nube.
     * Devuelve el historial nuevo y cuántas sesiones han cambiado.
     */
    fun mergeRemoteSessions(local: JSONArray, remote: List<JSONObject>, uploaded: JSONObject): Pair<JSONArray, Int> {
        val byId = LinkedHashMap<String, JSONObject>()
        for (i in 0 until local.length()) local.optJSONObject(i)?.let { byId[it.optString("id")] = it }
        var changed = 0
        for (r in remote) {
            val id = r.optString("id")
            if (id.isEmpty()) continue
            val mine = byId[id]
            val rh = sessionHash(r)
            val minePending = mine != null && sessionHash(mine) != uploaded.optString(id)
            uploaded.put(id, rh)
            if (mine != null && sessionHash(mine) == rh) continue
            if (minePending) continue
            byId[id] = r
            changed++
        }
        val out = JSONArray()
        byId.values.sortedBy { it.optLong("start") }.forEach { out.put(it) }
        return out to changed
    }

    /** Quita de una sesión bajada los campos de paginación de pull_sessions. */
    fun cleanRemote(o: JSONObject): JSONObject = JSONObject(o.toString()).apply { remove("_u"); remove("_id") }

    /** El estado del móvil sin historial ni datos de la copia (lo que se compara y se sube). */
    fun stateOf(snapshot: JSONObject): JSONObject = JSONObject(snapshot.toString()).apply {
        remove("history"); remove("app"); remove("v"); remove("exportedAt")
    }

    /** Lo que va a la tabla app_state: el estado sin las favoritas (esas van a su tabla). */
    fun appStateData(state: JSONObject): JSONObject = JSONObject(state.toString()).apply {
        optJSONObject("free")?.remove("favs")
    }

    fun favsOf(state: JSONObject): JSONArray = state.optJSONObject("free")?.optJSONArray("favs") ?: JSONArray()

    /** El estado de la nube con la forma del móvil: app_state.data con las favoritas (en su orden) dentro de «free». */
    fun remoteState(data: JSONObject?, favs: JSONArray): JSONObject {
        val s = JSONObject((data ?: JSONObject()).toString())
        val free = s.optJSONObject("free") ?: JSONObject().also { s.put("free", it) }
        free.put("favs", favs)  // siempre, para que al bajarla se borren en el móvil las que se quitaron en otro sitio
        return s
    }

    enum class Action { NONE, PUSH, PULL, MERGE }

    /**
     * Qué hacer con el estado. [lastLocal] y [lastRemote] son las huellas de la última sincronización
     * (null si nunca se ha sincronizado con esta cuenta en este móvil). [localBlank]: el móvil no tiene nada tuyo
     * (recién instalado o tras cambiar de cuenta), así que sus ajustes por defecto no deben pisar los de la nube.
     */
    fun decide(local: String, remote: String?, lastLocal: String?, lastRemote: String?, localBlank: Boolean = false): Action = when {
        remote == null -> Action.PUSH                         // la cuenta aún no tiene nada en la nube
        (lastLocal == null || lastRemote == null) && localBlank -> Action.PULL  // móvil nuevo: se baja todo
        lastLocal == null || lastRemote == null -> Action.MERGE  // primera vez en este móvil, con datos en los dos lados
        local == lastLocal && remote == lastRemote -> Action.NONE
        remote == lastRemote -> Action.PUSH
        local == lastLocal -> Action.PULL
        else -> Action.MERGE
    }

    /** ¿El móvil no tiene nada tuyo? Sin historial, días de racha, pesos, favoritas ni bandas (los ajustes por defecto no cuentan). */
    fun isBlank(state: JSONObject, historyCount: Int): Boolean {
        val free = state.optJSONObject("free")
        return historyCount == 0 && (state.optJSONArray("days")?.length() ?: 0) == 0 &&
            (state.optJSONObject("weights")?.length() ?: 0) == 0 &&
            (free?.optJSONArray("favs")?.length() ?: 0) == 0 && (free?.optJSONArray("bands")?.length() ?: 0) == 0
    }

    /** Combina el estado de la nube con el del móvil; el móvil va por encima (como una copia importada). */
    fun mergeStates(remote: JSONObject, local: JSONObject): JSONObject =
        stateOf(Backup.merge(remote, local))
}
