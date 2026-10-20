package com.vignasi.rutinacore

import android.content.Context
import org.json.JSONObject
import java.time.LocalDate

/** Guarda en el móvil los días hechos, la configuración de la sesión (compartida app/widget) y los pesos usados. */
object Store {
    private const val PREFS = "rutina"
    private const val DAYS = "days"

    private fun prefs(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun days(c: Context): Set<String> = prefs(c).getStringSet(DAYS, emptySet()) ?: emptySet()

    fun markDone(c: Context, rounds: Int, day: String) {
        val p = prefs(c)
        val set = HashSet(days(c))
        set.add(LocalDate.now().toString())
        p.edit()
            .putStringSet(DAYS, set)
            .putInt("lastRounds", rounds)
            .putString("lastDay", day)
            .putInt("sessions", p.getInt("sessions", 0) + 1)
            .apply()
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

    /** Tipo de la última sesión completada: "A", "B" o "" (para alternar automáticamente). */
    fun lastDay(c: Context): String = prefs(c).getString("lastDay", "") ?: ""

    /** Sesiones completadas: sirve para rotar los ejercicios de abdomen de un día a otro. */
    fun sessions(c: Context): Int = prefs(c).getInt("sessions", 0)

    /** Configuración de la sesión. Las versiones antiguas solo guardaban las rondas: se respetan. */
    fun config(c: Context): Config = Config.fromJson(prefs(c).getString("config", null), prefs(c).getInt("rounds", 3))

    fun setConfig(c: Context, cfg: Config) {
        prefs(c).edit().putString("config", cfg.toJson()).putInt("rounds", cfg.rounds).apply()
    }

    fun configJson(c: Context): String = config(c).toJson()

    fun setConfigJson(c: Context, s: String) = setConfig(c, Config.fromJson(s, config(c).rounds))

    fun weightsJson(c: Context): String = prefs(c).getString("weights", "{}") ?: "{}"

    fun weight(c: Context, key: String): Double? =
        try { JSONObject(weightsJson(c)).let { if (it.has(key)) it.getDouble(key) else null } } catch (e: Exception) { null }

    fun setWeight(c: Context, key: String, kg: Double) {
        val o = try { JSONObject(weightsJson(c)) } catch (e: Exception) { JSONObject() }
        o.put(key, kg)
        prefs(c).edit().putString("weights", o.toString()).apply()
    }

    fun plan(c: Context, cfg: Config = config(c)): List<Step> =
        buildSteps(Rutina.get(c), cfg, lastDay(c), sessions(c))
}
