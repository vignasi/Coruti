package com.vignasi.rutinacore

class Phase(
    val pose: Int,
    val move: Float,
    val hold: Float,
    val cap: String,
    val sq: List<String>,
    val arrow: FloatArray?,
    val stretch: Boolean
)

class Exercise(
    val key: String,
    val name: String,
    val poses: List<Map<String, FloatArray>>,
    val phases: List<Phase>,
    val gl: FloatArray?,
    val ab: FloatArray?,
    val lab: Map<String, FloatArray>,
    val stretchSeg: List<String>?,
    val hold: Boolean,
    val rep: Float,
    val reps: Int,
    val unit: String
) {
    private val total: Float = phases.fold(0f) { acc, p -> acc + p.move + p.hold }

    /** Fase del ejercicio en el segundo [t]. Si [clamp], se queda en la última (ejercicios de mantener). */
    fun phaseAt(t: Float, clamp: Boolean): Int {
        var tt = if (clamp && t >= total) total - 0.001f else ((t % total) + total) % total
        var i = 0
        while (i < phases.size - 1 && tt >= phases[i].move + phases[i].hold) {
            tt -= phases[i].move + phases[i].hold
            i++
        }
        return i
    }
}

class RoundStep(val k: String, val sub: String, val s: Int, val say: String)

class Step(
    val k: String,
    val name: String,
    val sub: String,
    val s: Int,
    val r: Int,
    val prep: Boolean,
    val rest: Boolean,
    val say: String
)

const val PREP_S = 8
const val REST_S = 20

fun buildSteps(rounds: Int): List<Step> {
    val out = ArrayList<Step>()
    for (r in 1..rounds) {
        if (r > 1) out.add(Step("gato", "Descanso", "Respira y bebe agua", REST_S, r, prep = false, rest = true, say = "Descanso, veinte segundos"))
        for (x in ROUND) {
            val ex = EXERCISES.getValue(x.k)
            out.add(Step(x.k, "Prepárate", ex.name + " · " + x.sub, PREP_S, r, prep = true, rest = false, say = "Prepárate. " + x.say))
            out.add(Step(x.k, ex.name, x.sub, x.s, r, prep = false, rest = false, say = x.say))
        }
    }
    return out
}

fun totalSeconds(rounds: Int): Int = buildSteps(rounds).sumOf { it.s }

fun fmt(sec: Int): String {
    val s = if (sec < 0) 0 else sec
    return "${s / 60}:${(s % 60).toString().padStart(2, '0')}"
}
