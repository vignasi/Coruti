package com.vignasi.rutinacore

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Historial de sesiones: un archivo history.json en la memoria interna de la app, con una sesión por elemento.
 *
 * Cada sesión: id, v, type ("rutina" | "sueltos"), src ("app" | "widget"), title, day ("A" | "B" | ""),
 * rounds, complete, start y end (milisegundos desde 1970, UTC), tz (minutos de diferencia con UTC al empezar),
 * fb (opcional: cómo te ha ido cada módulo, "up" | "ok" | "down") y sets: una por serie hecha, con
 * k (clave del ejercicio), name, r (ronda), side, start, end, reps y planReps (0 en los de mantener),
 * secs y planSecs (0 en los de repeticiones), kg, band, mod y skipped (si se saltó antes de acabar).
 * La misma forma la escriben la página (assets/app/app.js) y el servicio del widget (SessionRecorder).
 */
object History {
    private const val FILE = "history.json"
    private val lock = Any()

    private fun file(c: Context) = File(c.filesDir, FILE)

    fun all(c: Context): JSONArray = synchronized(lock) {
        try {
            val f = file(c)
            if (f.exists()) JSONArray(f.readText()) else JSONArray()
        } catch (e: Exception) { JSONArray() }
    }

    fun text(c: Context): String = all(c).toString()

    private fun write(c: Context, a: JSONArray) {
        val f = file(c)
        val tmp = File(c.filesDir, "$FILE.tmp")
        tmp.writeText(a.toString())
        if (!tmp.renameTo(f)) { f.writeText(a.toString()); tmp.delete() }
    }

    /** Añade la sesión (o la sustituye si ya hay una con el mismo id). Sin series hechas no se guarda nada. */
    fun add(c: Context, s: JSONObject): Boolean = synchronized(lock) {
        val sets = s.optJSONArray("sets")
        if (s.optString("id").isEmpty() || sets == null || sets.length() == 0) return false
        val a = all(c)
        val out = JSONArray()
        for (i in 0 until a.length()) {
            val o = a.optJSONObject(i) ?: continue
            if (o.optString("id") != s.optString("id")) out.put(o)
        }
        out.put(s)
        write(c, sorted(out))
        Cloud.syncSoon(c)
        true
    }

    /** Guarda cómo te ha ido cada módulo en una sesión ya guardada. */
    fun setFeedback(c: Context, id: String, fb: JSONObject) = synchronized(lock) {
        val a = all(c)
        for (i in 0 until a.length()) {
            val o = a.optJSONObject(i) ?: continue
            if (o.optString("id") == id) { o.put("fb", fb); write(c, a); Cloud.syncSoon(c); return@synchronized }
        }
    }

    /** Cambia el historial de una vez, sin que se cuele una sesión guardada a la vez (lo usa la nube al bajar sesiones). */
    fun update(c: Context, f: (JSONArray) -> JSONArray) = synchronized(lock) { write(c, sorted(f(all(c)))) }

    /** Sustituye todo el historial (lo usa la copia de seguridad, que antes lo ha combinado). */
    fun replaceAll(c: Context, a: JSONArray) = synchronized(lock) { write(c, sorted(a)) }

    private fun sorted(a: JSONArray): JSONArray {
        val l = (0 until a.length()).mapNotNull { a.optJSONObject(it) }.sortedBy { it.optLong("start") }
        return JSONArray().apply { l.forEach { put(it) } }
    }
}
