package com.vignasi.rutinacore

import org.json.JSONObject

/* Plan de la sesión. Misma lógica que buildPlan() en assets/index.html: si cambias una, cambia la otra. */

val INTENSITIES = listOf("S", "N", "F")
val INT_NAME = mapOf("S" to "Suave", "N" to "Normal", "F" to "Fuerte")

class Config(
    val mods: MutableMap<String, Boolean> = linkedMapOf("abdomen" to false, "pecho" to false, "espalda" to false, "brazos" to false, "gluteo" to false),
    var auto: Boolean = false,
    var intensity: String = "S",
    var correas: Boolean = false,
    var mancuernas: Boolean = false,
    var gomas: Boolean = false,
    var banda: Boolean = false,
    var rounds: Int = 3,
    var count: Boolean = true,
    var taper: Boolean = false,
    /** Nivel de cada módulo: sube o baja según cómo te haya ido al terminar. */
    val lv: MutableMap<String, String> = linkedMapOf()
) {
    fun level(mod: String): String = lv[mod]?.takeIf { it in INTENSITIES } ?: intensity

    /** El selector de intensidad iguala todos los módulos. */
    fun setAll(i: String) {
        intensity = i
        for (k in mods.keys) lv[k] = i
    }

    /** Nivel común de [keys], o null si van a niveles distintos. */
    fun commonLevel(keys: List<String>): String? = keys.map { level(it) }.toSet().singleOrNull()

    fun has(needs: String?): Boolean = when (needs) {
        null -> true
        "correas" -> correas
        "mancuernas" -> mancuernas
        "gomas" -> gomas
        "banda" -> banda
        else -> false
    }

    fun toJson(): String {
        val m = JSONObject()
        for ((k, v) in mods) m.put(k, v)
        val l = JSONObject()
        for (k in mods.keys) l.put(k, level(k))
        return JSONObject()
            .put("v", 2).put("mods", m).put("lv", l).put("auto", auto).put("int", intensity)
            .put("correas", correas).put("mancuernas", mancuernas).put("gomas", gomas).put("banda", banda)
            .put("rounds", rounds).put("count", count).put("taper", taper)
            .toString()
    }

    companion object {
        fun fromJson(s: String?, fallbackRounds: Int = 3): Config {
            val c = Config(rounds = fallbackRounds.coerceIn(1, 6))
            if (s.isNullOrBlank()) { c.setAll(c.intensity); return c }
            return try {
                val o = JSONObject(s)
                o.optJSONObject("mods")?.let { m -> for (k in m.keys()) c.mods[k] = m.optBoolean(k, false) }
                c.auto = o.optBoolean("auto", false)
                c.intensity = o.optString("int", "S").takeIf { it in INTENSITIES } ?: "S"
                c.correas = o.optBoolean("correas", false)
                c.mancuernas = o.optBoolean("mancuernas", false)
                c.gomas = o.optBoolean("gomas", false)
                c.banda = o.optBoolean("banda", false)
                c.rounds = o.optInt("rounds", c.rounds).coerceIn(1, 6)
                c.count = o.optBoolean("count", true)
                // Hasta la versión 2 el volumen bajaba en cada ronda por defecto: ahora es opcional
                c.taper = if (o.optInt("v", 1) < 2) false else o.optBoolean("taper", false)
                val l = o.optJSONObject("lv")
                for (k in c.mods.keys) c.lv[k] = l?.optString(k, "")?.takeIf { it in INTENSITIES } ?: c.intensity
                c
            } catch (e: Exception) { c.setAll(c.intensity); c }
        }
    }
}

class Step(
    val k: String,
    val name: String,
    val sub: String,
    val s: Int,
    val r: Int,
    val prep: Boolean,
    val rest: Boolean,
    val say: String,
    val reps: Int = 0,
    val hold: Boolean = false,
    val kg: DoubleArray? = null,
    val mod: String? = null
)

class Resolved(val v: Variant, val d: Dose, val ex: String)

fun resolve(slot: Slot, cfg: Config, level: String = cfg.intensity): Resolved? {
    for (v in slot.variants) {
        if (!cfg.has(v.needs)) continue
        val d = v.dose ?: v.byInt[level] ?: continue
        return Resolved(v, d, d.ex ?: v.ex)
    }
    return null
}

fun activeModules(data: Rutina, cfg: Config, lastDay: String): List<Module> =
    if (cfg.auto) {
        val day = if (lastDay == "A") "B" else "A"
        data.modules.filter { it.day == day }
    } else data.modules.filter { cfg.mods[it.key] == true }

/** "A" o "B" si la sesión es solo de ese día; "" si mezcla o es solo la base. */
fun dayType(mods: List<Module>): String = mods.map { it.day }.toSet().singleOrNull() ?: ""

fun fmtKg(v: Double): String =
    if (v == Math.floor(v)) v.toLong().toString() else v.toString().replace(".", ",")

fun kgRange(kg: DoubleArray): String = "${fmtKg(kg[0])}–${fmtKg(kg[1])} kg por mano"

fun buildSteps(data: Rutina, cfg: Config, lastDay: String, offset: Int): List<Step> {
    val mods = activeModules(data, cfg, lastDay)
    val out = ArrayList<Step>()
    for (r in 1..cfg.rounds) {
        if (r > 1) out.add(Step("gato", "Descanso", "Respira y bebe agua", data.rest, r, prep = false, rest = true, say = "Descanso, ${data.rest} segundos"))
        val f = if (cfg.taper) data.taper[minOf(r, data.taper.size) - 1] else 1.0
        val items = ArrayList<Pair<Resolved, Module?>>()
        data.base.forEach { s -> resolve(s, cfg)?.let { items.add(it to null) } }
        for (m in mods) {
            val res = m.slots.mapNotNull { resolve(it, cfg, cfg.level(m.key)) }
            if (res.isEmpty()) continue
            val pick = if (m.rotate) listOf(res[(r - 1 + offset) % res.size]) else res
            pick.forEach { items.add(it to m) }
        }
        data.close.forEach { s -> resolve(s, cfg)?.let { items.add(it to null) } }
        for ((x, m) in items) expand(data, x, m, f, r, out)
    }
    return out
}

private fun expand(data: Rutina, x: Resolved, mod: Module?, f: Double, r: Int, out: MutableList<Step>) {
    val v = x.v
    val d = x.d
    val ex = data.ex(x.ex)
    var reps = d.reps
    var secs = d.secs
    if (mod != null && f != 1.0) {
        if (reps > 0) reps = maxOf(3, Math.round(reps * f).toInt())
        if (secs > 0) secs = maxOf(5, Math.round(secs * f).toInt())
    }
    val s = if (reps > 0) Math.round(reps * ex.rep.toDouble()).toInt() else secs
    val dose = if (reps > 0) "$reps reps" else "$secs s"
    val sides = v.sides ?: listOf("")
    sides.forEachIndexed { i, side ->
        val sub = listOf(side, if (mod != null) dose else "", d.note ?: v.note ?: "").filter { it.isNotEmpty() }.joinToString(" · ")
        val say = when {
            v.say != null -> if (v.say.size == 1) v.say[0] else v.say[i]
            i > 0 -> "Ahora " + side.lowercase()
            else -> buildString {
                append(ex.name).append(", ").append(if (reps > 0) "$reps repeticiones" else "$secs segundos")
                if (side.isNotEmpty()) append(", ").append(side.lowercase())
                d.kg?.let { append(", de ${fmtKg(it[0])} a ${fmtKg(it[1])} kilos") }
            }
        }
        out.add(Step(x.ex, "Prepárate", ex.name + (if (sub.isNotEmpty()) " · $sub" else ""), data.prep, r,
            prep = true, rest = false, say = "Prepárate. $say", kg = d.kg, mod = mod?.key))
        out.add(Step(x.ex, ex.name, sub, s, r, prep = false, rest = false, say = say,
            reps = reps, hold = ex.hold, kg = d.kg, mod = mod?.key))
    }
}

fun totalSeconds(steps: List<Step>): Int = steps.sumOf { it.s }

fun modsLabel(mods: List<Module>): String =
    if (mods.isEmpty()) "Solo la base" else "Base + " + mods.joinToString(" + ") { it.name }

fun fmt(sec: Int): String {
    val s = if (sec < 0) 0 else sec
    return "${s / 60}:${(s % 60).toString().padStart(2, '0')}"
}
