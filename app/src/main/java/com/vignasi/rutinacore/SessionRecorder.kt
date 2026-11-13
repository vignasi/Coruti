package com.vignasi.rutinacore

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.TimeZone

/**
 * Apunta la sesión hecha desde el widget con la misma forma que recStart/recClose/recSave en assets/app/app.js:
 * cada serie con su hora de inicio y fin, lo hecho si se saltó, los kilos y la banda.
 */
class SessionRecorder(private val type: String, private val title: String, private val day: String, private val rounds: Int) {
    private val start = System.currentTimeMillis()
    private val id = start.toString(36) + "-" + (Math.random() * Int.MAX_VALUE).toLong().toString(36).take(6)
    private val sets = JSONArray()
    private var curIdx = -1
    private var curStart = 0L

    private fun isEx(st: Step?) = st != null && !st.prep && !st.rest

    /** Abre la serie cuando de verdad empieza a correr el tiempo del ejercicio. */
    fun track() {
        if (Workout.running && isEx(Workout.current()) && curIdx != Workout.idx) {
            curIdx = Workout.idx
            curStart = System.currentTimeMillis()
        }
    }

    /** Cierra la serie en curso; si no llegó a 1 s no se apunta. */
    fun close(c: Context) {
        if (curIdx < 0) return
        val i = curIdx
        curIdx = -1
        val st = Workout.steps.getOrNull(i) ?: return
        val left = if (Workout.idx == i) Workout.leftMs / 1000f else 0f
        val el = (st.s - left).coerceIn(0f, st.s.toFloat())
        if (el < 1f) return
        val skipped = st.s - el > 0.5f
        val ex = Rutina.get(c).ex(st.k)
        val hold = st.reps == 0
        val kg = st.kg?.let { Store.weight(c, st.k) ?: it[0] }
        sets.put(JSONObject()
            .put("k", st.k).put("name", ex.name).put("r", st.r).put("side", st.side)
            .put("start", curStart).put("end", System.currentTimeMillis())
            .put("reps", if (hold) 0 else if (skipped) minOf(st.reps, (el / ex.rep).toInt()) else st.reps)
            .put("planReps", st.reps)
            .put("secs", if (!hold) 0 else if (skipped) Math.round(el) else st.s)
            .put("planSecs", if (hold) st.s else 0)
            .put("kg", kg ?: JSONObject.NULL)
            .put("band", (if (Rutina.get(c).cat(st.k)?.needs == "gomas") Store.bandOf(c, st.k) else null) ?: JSONObject.NULL)
            .put("mod", st.mod ?: JSONObject.NULL)
            .put("skipped", skipped))
    }

    /** Guarda la sesión: terminada, o a medias si se hizo al menos una serie. */
    fun save(c: Context, complete: Boolean) {
        close(c)
        if (sets.length() == 0) return
        val end = System.currentTimeMillis()
        History.add(c, JSONObject()
            .put("id", id).put("v", 1).put("type", type).put("src", "widget")
            .put("title", title).put("day", day).put("rounds", rounds)
            .put("start", start).put("end", end)
            .put("tz", TimeZone.getDefault().getOffset(start) / 60000)
            .put("sets", sets).put("complete", complete))
    }
}
