package com.vignasi.rutinacore

/** Estado de la sesión que se está haciendo desde el widget. */
object Workout {
    var steps: List<Step> = emptyList()
    var idx = 0
    var leftMs = 0L
    var running = false
    var active = false
    var done = false
    var rounds = 3
    var day = ""
    var count = true

    fun start(plan: List<Step>, cfg: Config, dayType: String) {
        rounds = cfg.rounds
        count = cfg.count
        day = dayType
        steps = plan
        idx = 0
        leftMs = steps[0].s * 1000L
        running = true
        active = true
        done = false
    }

    fun reset() {
        steps = emptyList(); idx = 0; leftMs = 0; running = false; active = false; done = false
    }

    fun current(): Step? = steps.getOrNull(idx)

    fun leftSec(): Int = ((leftMs + 999) / 1000).toInt()

    fun elapsedInStep(): Float {
        val st = current() ?: return 0f
        return (st.s * 1000L - leftMs) / 1000f
    }

    fun remainingSec(): Int {
        var total = leftSec()
        for (i in idx + 1 until steps.size) total += steps[i].s
        return total
    }

    fun nextExerciseName(): String? =
        steps.drop(idx + 1).firstOrNull { !it.prep && !it.rest }?.name
}
