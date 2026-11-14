package com.vignasi.rutinacore

/* Textos y figura del widget (C2), sin nada de Android para poder probarlos (WidgetTextosTest).
   Dicen lo mismo que el reproductor de la app (posDe, cantidadDe y luegoDe en assets/app/app.js). */

/** «19 min», como minTxt() en motor.js. */
fun minTxt(sec: Int): String = "${maxOf(1, Math.round(sec / 60.0).toInt())} min"

/** Series de ejercicio (sin «Prepárate» ni descansos) de la primera ronda: «6 ejercicios». */
fun ejerciciosTxt(steps: List<Step>): String {
    val n = steps.count { it.r == 1 && !it.prep && !it.rest }
    return if (n == 1) "1 ejercicio" else "$n ejercicios"
}

/** «Ronda 2 de 3 · 1 de 6»; en el descanso solo la ronda. [palabra] es «Ronda» o «Serie». */
fun posTxt(steps: List<Step>, idx: Int, palabra: String): String {
    val s = steps.getOrNull(idx) ?: return ""
    val total = steps.maxOfOrNull { it.r } ?: 1
    val base = "$palabra ${s.r} de $total"
    if (s.rest) return base
    val ej = steps.filter { it.r == s.r && !it.prep && !it.rest }
    val k = steps.take(idx + 1).count { it.r == s.r && !it.prep && !it.rest } + (if (s.prep) 1 else 0)
    return "$base · ${maxOf(1, k)} de ${ej.size}"
}

/** La cantidad grande y la línea de debajo: reps («12 reps» · «Ritmo 5 de 12»), tiempo («0:25» · «de 0:30»),
 *  descanso y «Prepárate» con su cuenta atrás. [corta]: para el pequeño, solo la cifra. */
fun cantidadTxt(s: Step, transcurrido: Float, quedanSeg: Int, segPorRep: Float, corta: Boolean = false): Pair<String, String> = when {
    s.rest -> fmt(quedanSeg) to "Descanso"
    s.prep -> "$quedanSeg" to "Prepárate"
    s.reps > 0 -> {
        val ritmo = minOf(s.reps, (transcurrido / segPorRep).toInt() + 1)
        (if (corta) "${s.reps}" else "${s.reps} reps") to "Ritmo $ritmo de ${s.reps}"
    }
    else -> fmt(quedanSeg) to ("de ${fmt(s.s)}" + if (s.side.isNotEmpty()) " · ${s.side.lowercase()}" else "")
}

/** Lo que viene: «Luego: press de suelo», «Luego: descanso de 60 s», «Empiezas con: …» o «Es el último». */
fun luegoTxt(steps: List<Step>, idx: Int): String {
    val s = steps.getOrNull(idx) ?: return ""
    val resto = steps.drop(idx + 1)
    val nx = resto.firstOrNull { !it.prep } ?: return "Es el último"
    if (s.rest) return "Empiezas con: ${nx.name.lowercase()}"
    if (nx.rest && !s.prep) return "Luego: descanso de ${nx.s} s"
    val desde = if (s.prep) 1 else 0
    val e = resto.drop(desde).firstOrNull { !it.prep && !it.rest } ?: return "Es el último"
    return "Luego: ${e.name.lowercase()}"
}

/** Ejercicio que dibuja el widget: en el descanso, el siguiente (como la app); parado, el primero de la sesión. */
fun ejercicioFigura(steps: List<Step>, idx: Int): String? {
    val s = steps.getOrNull(idx) ?: return steps.firstOrNull { !it.rest }?.k
    if (!s.rest) return s.k
    return steps.drop(idx + 1).firstOrNull { !it.rest && !it.prep }?.k ?: s.k
}

/** Nombre del recurso de una fase: fig_m_remo_incl_banda_0 (app/build.gradle.kts los copia de docs/diseno/figura/widget/). */
fun recursoFigura(genero: String, k: String, fase: Int): String = "fig_${if (genero == "f") "f" else "m"}_${k}_$fase"
