package com.vignasi.rutinacore

import org.json.JSONArray
import org.json.JSONObject

/* Modelo de assets/rutina.json, la misma fuente que usa la página web. */

class Mark(val at: List<String>, val off: FloatArray, val lab: FloatArray?, val text: String?)

/** Material dibujado: caja (sofá, silla, pared), correa desde arriba, mancuerna o toalla. */
class Equip(val t: String, val at: String?, val to: String?, val from: FloatArray?, val r: FloatArray?, val label: String?)

class Phase(
    val pose: Int,
    val move: Float,
    val hold: Float,
    val cap: String,
    val sq: List<String>,
    val arrow: FloatArray?,
    val stretch: Boolean,
    /** 1 = sube/empuja (tono agudo), -1 = baja/vuelve (tono grave), 0 = sin tono */
    val tone: Int
)

class Exercise(
    val key: String,
    val name: String,
    val poses: List<Map<String, FloatArray>>,
    val phases: List<Phase>,
    val marks: Map<String, Mark>,
    val stretchSegs: List<List<String>>,
    val stretchLab: FloatArray?,
    val hold: Boolean,
    val rep: Float,
    val unit: String,
    val front: Boolean,
    val equip: List<Equip>
) {
    val cycle: Float = phases.fold(0f) { acc, p -> acc + p.move + p.hold }

    /** Fase del ejercicio en el segundo [t]. Si [clamp], se queda en la última (ejercicios de mantener). */
    fun phaseAt(t: Float, clamp: Boolean): Int {
        var tt = if (clamp && t >= cycle) cycle - 0.001f else ((t % cycle) + cycle) % cycle
        var i = 0
        while (i < phases.size - 1 && tt >= phases[i].move + phases[i].hold) {
            tt -= phases[i].move + phases[i].hold
            i++
        }
        return i
    }

    /** Número de fase contando desde el inicio (cambia en cada fase: sirve para lanzar el tono). */
    fun phaseCount(t: Float): Int {
        val c = Math.floor((t / cycle).toDouble()).toInt()
        return c * phases.size + phaseAt(t - c * cycle, false)
    }
}

class Dose(val ex: String?, val reps: Int, val secs: Int, val note: String?, val kg: DoubleArray?)

class Variant(
    val ex: String,
    val needs: String?,
    val dose: Dose?,
    val byInt: Map<String, Dose>,
    val sides: List<String>?,
    val note: String?,
    val say: List<String>?
)

class Slot(val variants: List<Variant>)

class Module(val key: String, val name: String, val day: String, val rotate: Boolean, val slots: List<Slot>)

class Rutina(
    val prep: Int,
    val rest: Int,
    val taper: DoubleArray,
    val numbers: List<String>,
    val markText: Map<String, String>,
    val exercises: Map<String, Exercise>,
    val base: List<Slot>,
    val modules: List<Module>,
    val close: List<Slot>
) {
    fun ex(key: String): Exercise = exercises.getValue(key)

    companion object {
        @Volatile private var cached: Rutina? = null

        fun get(ctx: android.content.Context): Rutina =
            cached ?: synchronized(this) {
                cached ?: parse(text(ctx)).also { cached = it }
            }

        fun text(ctx: android.content.Context): String =
            ctx.assets.open("rutina.json").bufferedReader(Charsets.UTF_8).use { it.readText() }

        fun parse(text: String): Rutina {
            val o = JSONObject(text)
            val exs = LinkedHashMap<String, Exercise>()
            val eo = o.getJSONObject("exercises")
            for (k in eo.keys()) exs[k] = parseExercise(k, eo.getJSONObject(k))
            val mt = HashMap<String, String>()
            val mo = o.getJSONObject("marks")
            for (k in mo.keys()) mt[k] = mo.getString(k)
            return Rutina(
                prep = o.getInt("prep"),
                rest = o.getInt("rest"),
                taper = o.getJSONArray("taper").let { a -> DoubleArray(a.length()) { a.getDouble(it) } },
                numbers = strings(o.getJSONArray("numbers")),
                markText = mt,
                exercises = exs,
                base = objs(o.getJSONArray("base")).map(::parseSlot),
                modules = objs(o.getJSONArray("modules")).map { m ->
                    Module(
                        m.getString("key"), m.getString("name"), m.getString("day"),
                        m.optBoolean("rotate", false), objs(m.getJSONArray("slots")).map(::parseSlot)
                    )
                },
                close = objs(o.getJSONArray("close")).map(::parseSlot)
            )
        }

        private fun objs(a: JSONArray): List<JSONObject> = List(a.length()) { a.getJSONObject(it) }
        private fun strings(a: JSONArray): List<String> = List(a.length()) { a.getString(it) }
        private fun floats(a: JSONArray): FloatArray = FloatArray(a.length()) { a.getDouble(it).toFloat() }
        private fun optFloats(o: JSONObject, k: String): FloatArray? = o.optJSONArray(k)?.let(::floats)
        private fun optStr(o: JSONObject, k: String): String? = if (o.has(k) && !o.isNull(k)) o.getString(k) else null

        private fun parseExercise(key: String, o: JSONObject): Exercise {
            val poses = objs(o.getJSONArray("poses")).map { p ->
                val m = LinkedHashMap<String, FloatArray>()
                for (j in p.keys()) m[j] = floats(p.getJSONArray(j))
                m as Map<String, FloatArray>
            }
            val phases = objs(o.getJSONArray("phases")).map { p ->
                Phase(
                    pose = p.getInt("pose"),
                    move = p.getDouble("move").toFloat(),
                    hold = p.getDouble("hold").toFloat(),
                    cap = p.getString("cap"),
                    sq = p.optJSONArray("sq")?.let(::strings) ?: emptyList(),
                    arrow = optFloats(p, "arrow"),
                    stretch = p.optBoolean("stretch", false),
                    tone = when (optStr(p, "tone")) { "up" -> 1; "down" -> -1; else -> 0 }
                )
            }
            val marks = HashMap<String, Mark>()
            o.optJSONObject("marks")?.let { mo ->
                for (k in mo.keys()) {
                    val m = mo.getJSONObject(k)
                    marks[k] = Mark(strings(m.getJSONArray("at")), floats(m.getJSONArray("off")), optFloats(m, "lab"), optStr(m, "text"))
                }
            }
            val st = o.optJSONObject("stretch")
            val equip = o.optJSONArray("equip")?.let { a ->
                objs(a).map { q -> Equip(q.getString("t"), optStr(q, "at"), optStr(q, "to"), optFloats(q, "from"), optFloats(q, "r"), optStr(q, "label")) }
            } ?: emptyList()
            return Exercise(
                key = key,
                name = o.getString("name"),
                poses = poses,
                phases = phases,
                marks = marks,
                stretchSegs = st?.getJSONArray("segs")?.let { a -> List(a.length()) { strings(a.getJSONArray(it)) } } ?: emptyList(),
                stretchLab = st?.let { optFloats(it, "lab") },
                hold = o.optBoolean("hold", false),
                rep = o.optDouble("rep", 0.0).toFloat(),
                unit = o.optString("unit", ""),
                front = o.optBoolean("front", false),
                equip = equip
            )
        }

        private fun parseDose(o: JSONObject): Dose = Dose(
            ex = optStr(o, "ex"),
            reps = o.optInt("reps", 0),
            secs = o.optInt("secs", 0),
            note = optStr(o, "note"),
            kg = o.optJSONArray("kg")?.let { a -> DoubleArray(a.length()) { a.getDouble(it) } }
        )

        private fun parseVariant(o: JSONObject): Variant {
            val by = HashMap<String, Dose>()
            for (i in listOf("S", "N", "F")) o.optJSONObject(i)?.let { by[i] = parseDose(it) }
            val say = when (val s = o.opt("say")) {
                is JSONArray -> strings(s)
                is String -> listOf(s)
                else -> null
            }
            return Variant(
                ex = o.getString("ex"),
                needs = optStr(o, "needs"),
                dose = o.optJSONObject("dose")?.let(::parseDose),
                byInt = by,
                sides = o.optJSONArray("sides")?.let(::strings),
                note = optStr(o, "note"),
                say = say
            )
        }

        private fun parseSlot(o: JSONObject): Slot =
            Slot(o.optJSONArray("variants")?.let { a -> objs(a).map(::parseVariant) } ?: listOf(parseVariant(o)))
    }
}
