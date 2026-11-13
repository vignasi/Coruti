package com.vignasi.rutinacore

import org.json.JSONObject

/* Ejercicios sueltos (favoritas) para el widget. Misma lógica que normFree, buildFree y freeExpand en
   assets/app/motor.js (buildFree): si cambias una, cambia la otra (FreePlanTest compara las dos). */

class FreeItem(val k: String, val n: Int)

class FreeSession(val name: String, val sel: List<FreeItem>, val rounds: Int, val rest: Int, val alt: Boolean) {
    /** Superserie (A, B, descanso) solo con dos o más ejercicios. */
    val isAlt: Boolean get() = alt && sel.size > 1

    /** «4 rondas alternadas · 12 reps / 30 s · descanso 75 s», como favSub() en la página. */
    fun summary(data: Rutina): String {
        val kind = if (isAlt) "rondas alternadas" else if (rounds == 1) "serie" else "series"
        val doses = sel.joinToString(" / ") { if (isHold(data, it.k)) "${it.n} s" else "${it.n} reps" }
        return "$rounds $kind · $doses · descanso $rest s"
    }

    companion object {
        /** Normaliza una favorita guardada por la página; null si no le queda ningún ejercicio. */
        fun fromJson(data: Rutina, o: JSONObject?): FreeSession? {
            o ?: return null
            val a = o.optJSONArray("sel") ?: return null
            val sel = ArrayList<FreeItem>()
            for (i in 0 until a.length()) {
                val it = a.optJSONObject(i) ?: continue
                val k = it.optString("k")
                if (!data.exercises.containsKey(k)) continue
                val n = it.optDouble("n", Double.NaN).takeIf { v -> !v.isNaN() && v != 0.0 } ?: defN(data, k).toDouble()
                sel.add(FreeItem(k, clampN(data, k, n)))
            }
            if (sel.isEmpty()) return null
            val rounds = Math.round(o.optDouble("rounds", 4.0)).toInt().let { if (it == 0) 4 else it }.coerceIn(1, 10)
            val restRaw = o.optDouble("rest", 75.0).let { if (it.isNaN() || it == 0.0) 75.0 else it }
            val rest = (Math.round(restRaw / 15).toInt() * 15).coerceIn(15, 180)
            return FreeSession(o.optString("name", ""), sel, rounds, rest, o.optBoolean("alt", true))
        }

        fun isHold(data: Rutina, k: String) = data.ex(k).hold

        fun defN(data: Rutina, k: String): Int {
            val c = data.cat(k)
            return if (isHold(data, k)) (c?.secs?.takeIf { it > 0 } ?: 30) else (c?.reps?.takeIf { it > 0 } ?: 12)
        }

        fun clampN(data: Rutina, k: String, n: Double): Int =
            if (isHold(data, k)) (Math.round(n / 5).toInt() * 5).let { if (it == 0) 5 else it }.coerceIn(5, 180)
            else Math.round(n).toInt().let { if (it == 0) 1 else it }.coerceIn(1, 50)
    }
}

/** Pasos de una sesión de ejercicios sueltos; [bandOf] da la banda grande que usas en cada ejercicio (o null). */
fun buildFree(data: Rutina, f: FreeSession, bandOf: (String) -> String?): List<Step> {
    val out = ArrayList<Step>()
    fun rest(r: Int) = out.add(Step("gato", "Descanso", "Respira y bebe agua", f.rest, r, prep = false, rest = true, say = "Descanso, ${f.rest} segundos"))
    if (f.isAlt) {
        for (r in 1..f.rounds) { if (r > 1) rest(r); f.sel.forEach { freeExpand(data, it, r, out, bandOf) } }
    } else {
        f.sel.forEach { for (r in 1..f.rounds) { if (out.isNotEmpty()) rest(r); freeExpand(data, it, r, out, bandOf) } }
    }
    return out
}

private fun freeExpand(data: Rutina, it: FreeItem, r: Int, out: MutableList<Step>, bandOf: (String) -> String?) {
    val ex = data.ex(it.k)
    val ce = data.cat(it.k)
    val hold = ex.hold
    val reps = if (hold) 0 else it.n
    val secs = if (hold) it.n else 0
    val s = if (reps > 0) Math.round(reps * ex.rep.toDouble()).toInt() else secs
    val dose = if (reps > 0) "$reps reps" else "$secs s"
    val band = if (ce?.needs == "gomas") bandOf(it.k) else null
    (ce?.sides ?: listOf("")).forEachIndexed { i, side ->
        val sub = listOf(side, dose).filter { x -> x.isNotEmpty() }.joinToString(" · ")
        val say = if (i > 0) "Ahora " + side.lowercase() else buildString {
            append(ex.name).append(", ").append(if (reps > 0) "$reps repeticiones" else "$secs segundos")
            if (side.isNotEmpty()) append(", ").append(side.lowercase())
            ce?.kg?.let { kg -> append(", de ${fmtKg(kg[0])} a ${fmtKg(kg[1])} kilos") }
            if (band != null) append(", ").append(band)
        }
        out.add(Step(it.k, "Prepárate", ex.name + " · " + sub, data.prep, r, prep = true, rest = false, say = "Prepárate. $say", kg = ce?.kg))
        out.add(Step(it.k, ex.name, sub, s, r, prep = false, rest = false, say = say, reps = reps, hold = hold, kg = ce?.kg, side = side))
    }
}
