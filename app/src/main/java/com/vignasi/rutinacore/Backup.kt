package com.vignasi.rutinacore

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Copia de seguridad: todo lo de la app en un solo JSON (historial, días de la racha, configuración,
 * pesos, favoritas, bandas y la última sesión de ejercicios sueltos).
 * Al importar se combina con lo que hay (ver [merge]): no se pierde nada aunque la copia sea vieja.
 */
object Backup {
    const val APP = "rutina-core"
    const val VERSION = 1
    private val FREE = listOf("last" to "free.last", "favs" to "free.favs", "bands" to "free.bands", "bandUse" to "free.bandUse")

    /** Todo lo guardado en el móvil, con la forma del archivo de copia. */
    fun snapshot(c: Context): JSONObject {
        val p = Store.prefs(c)
        val free = JSONObject()
        for ((k, pref) in FREE) parse(p.getString(pref, null))?.let { free.put(k, it) }
        return JSONObject()
            .put("app", APP).put("v", VERSION).put("exportedAt", System.currentTimeMillis())
            .put("history", History.all(c))
            .put("days", JSONArray(Store.allDays(c).sorted()))
            .put("lastDay", Store.lastDay(c))
            .put("lastRounds", p.getInt("lastRounds", 0))
            .put("sessions", Store.sessions(c))
            .put("config", JSONObject(Store.configJson(c)))
            .put("weights", parse(Store.weightsJson(c)) as? JSONObject ?: JSONObject())
            .put("free", free)
    }

    /** Lee un archivo de copia; lanza un error con un mensaje para ti si no es una copia de esta app. */
    fun read(text: String): JSONObject {
        val o = try { JSONObject(text) } catch (e: Exception) { throw IllegalArgumentException("El archivo no es una copia de Rutina core.") }
        if (o.optString("app") != APP) throw IllegalArgumentException("El archivo no es una copia de Rutina core.")
        if (o.optInt("v", 0) > VERSION) throw IllegalArgumentException("La copia es de una versión más nueva de la app: actualízala primero.")
        return o
    }

    /**
     * Combina lo del móvil ([local]) con una copia ([copy]):
     * historial unido sin duplicar (mismo id: se queda la del móvil); días de la racha sumados;
     * configuración, última sesión de sueltos y bandas de la copia; pesos y banda de cada ejercicio de la copia
     * encima de los del móvil; favoritas de la copia y las del móvil que no estén en ella;
     * la alternancia A/B (último día) del que tenga el día hecho más reciente; el contador de sesiones, el mayor.
     */
    fun merge(local: JSONObject, copy: JSONObject): JSONObject {
        val hist = LinkedHashMap<String, JSONObject>()
        for (src in listOf(local, copy)) {
            val a = src.optJSONArray("history") ?: continue
            for (i in 0 until a.length()) {
                val s = a.optJSONObject(i) ?: continue
                val id = s.optString("id")
                if (id.isEmpty() || s.optJSONArray("sets") == null || hist.containsKey(id)) continue
                hist[id] = s
            }
        }
        val history = JSONArray().apply { hist.values.sortedBy { it.optLong("start") }.forEach { put(it) } }

        val localDays = strings(local.optJSONArray("days"))
        val copyDays = strings(copy.optJSONArray("days"))
        val days = (localDays + copyDays).toSortedSet()
        val copyNewer = (copyDays.maxOrNull() ?: "") > (localDays.maxOrNull() ?: "")
        val ab = if (copyNewer) copy else local

        val lf = local.optJSONObject("free") ?: JSONObject()
        val cf = copy.optJSONObject("free") ?: JSONObject()
        val free = JSONObject()
        (cf.opt("last") ?: lf.opt("last"))?.let { free.put("last", it) }
        val favs = JSONArray()
        val names = HashSet<String>()
        for (a in listOf(cf.optJSONArray("favs"), lf.optJSONArray("favs"))) {
            if (a == null) continue
            for (i in 0 until a.length()) {
                val f = a.optJSONObject(i) ?: continue
                if (favs.length() < 20 && names.add(f.optString("name"))) favs.put(f)
            }
        }
        if (favs.length() > 0) free.put("favs", favs)
        val bands = cf.optJSONArray("bands")?.takeIf { it.length() > 0 } ?: lf.optJSONArray("bands")
        bands?.let { free.put("bands", it) }
        free.put("bandUse", overlay(lf.optJSONObject("bandUse"), cf.optJSONObject("bandUse")))

        return JSONObject()
            .put("app", APP).put("v", VERSION)
            .put("history", history)
            .put("days", JSONArray(days.toList()))
            .put("lastDay", ab.optString("lastDay", ""))
            .put("lastRounds", ab.optInt("lastRounds", 0))
            .put("sessions", maxOf(local.optInt("sessions", 0), copy.optInt("sessions", 0)))
            .put("config", copy.optJSONObject("config") ?: local.optJSONObject("config") ?: JSONObject())
            .put("weights", overlay(local.optJSONObject("weights"), copy.optJSONObject("weights")))
            .put("free", free)
    }

    /** Guarda en el móvil un estado completo (el resultado de [merge]). */
    fun apply(c: Context, s: JSONObject) {
        val e = Store.prefs(c).edit()
            .putStringSet("days", strings(s.optJSONArray("days")).toHashSet())
            .putString("lastDay", s.optString("lastDay", ""))
            .putInt("lastRounds", s.optInt("lastRounds", 0))
            .putInt("sessions", s.optInt("sessions", 0))
            .putString("weights", (s.optJSONObject("weights") ?: JSONObject()).toString())
        val free = s.optJSONObject("free") ?: JSONObject()
        for ((k, pref) in FREE) free.opt(k)?.let { e.putString(pref, it.toString()) }
        e.apply()
        s.optJSONObject("config")?.let { Store.setConfigJson(c, it.toString()) }
        History.replaceAll(c, s.optJSONArray("history") ?: JSONArray())
    }

    /** Importa [text] y devuelve un resumen para mostrar. */
    fun import(c: Context, text: String): String {
        val copy = read(text)
        val local = snapshot(c)
        val merged = merge(local, copy)
        apply(c, merged)
        val added = merged.getJSONArray("history").length() - local.getJSONArray("history").length()
        val days = merged.getJSONArray("days").length() - local.getJSONArray("days").length()
        return "Copia importada: " + plural(added, "sesión nueva", "sesiones nuevas") + " en el historial y " +
            plural(days, "día más", "días más") + " en la racha. Favoritas, bandas, pesos y ajustes recuperados."
    }

    private fun plural(n: Int, one: String, many: String) = if (n == 1) "1 $one" else "$n $many"

    private fun strings(a: JSONArray?): List<String> =
        if (a == null) emptyList() else (0 until a.length()).map { a.optString(it) }.filter { it.isNotEmpty() }

    private fun overlay(base: JSONObject?, top: JSONObject?): JSONObject {
        val o = JSONObject()
        for (src in listOf(base, top)) src?.let { s -> s.keys().forEach { k -> o.put(k, s.get(k)) } }
        return o
    }

    private fun parse(s: String?): Any? {
        if (s.isNullOrBlank()) return null
        return try {
            if (s.trimStart().startsWith("[")) JSONArray(s) else JSONObject(s)
        } catch (e: Exception) { null }
    }
}
