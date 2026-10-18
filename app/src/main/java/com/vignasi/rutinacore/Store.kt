package com.vignasi.rutinacore

import android.content.Context
import java.time.LocalDate

/** Guarda en el móvil qué días se ha hecho la rutina y cuántas rondas se usan. */
object Store {
    private const val PREFS = "rutina"
    private const val DAYS = "days"

    private fun prefs(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun days(c: Context): Set<String> = prefs(c).getStringSet(DAYS, emptySet()) ?: emptySet()

    fun markDone(c: Context, rounds: Int) {
        val set = HashSet(days(c))
        set.add(LocalDate.now().toString())
        prefs(c).edit().putStringSet(DAYS, set).putInt("lastRounds", rounds).apply()
    }

    fun doneToday(c: Context): Boolean = days(c).contains(LocalDate.now().toString())

    /** Días seguidos hasta hoy (o hasta ayer si hoy aún no está hecha). */
    fun streak(c: Context): Int {
        val d = days(c)
        var day = LocalDate.now()
        if (!d.contains(day.toString())) day = day.minusDays(1)
        var n = 0
        while (d.contains(day.toString())) {
            n++
            day = day.minusDays(1)
        }
        return n
    }

    fun total(c: Context): Int = days(c).size

    fun rounds(c: Context): Int = prefs(c).getInt("rounds", 3).coerceIn(1, 6)

    fun setRounds(c: Context, r: Int) {
        prefs(c).edit().putInt("rounds", r.coerceIn(1, 6)).apply()
    }
}
