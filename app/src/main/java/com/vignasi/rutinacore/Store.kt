package com.vignasi.rutinacore

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate

/** Guarda en el móvil los días hechos, la configuración de la sesión (compartida app/widget) y los pesos usados. */
object Store {
    private const val PREFS = "rutina"
    private const val DAYS = "days"

    internal fun prefs(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun days(c: Context): Set<String> = prefs(c).getStringSet(DAYS, emptySet()) ?: emptySet()

    /** Días hechos (fechas «2026-11-11»): para la copia de seguridad. */
    fun allDays(c: Context): Set<String> = HashSet(days(c))

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

    /** Sesión de ejercicios sueltos: cuenta para la racha, pero no cambia la alternancia A/B ni la rotación del abdomen. */
    fun markDay(c: Context) {
        val set = HashSet(days(c))
        set.add(LocalDate.now().toString())
        prefs(c).edit().putStringSet(DAYS, set).apply()
    }

    /** Datos de los ejercicios sueltos (última sesión, favoritas, bandas), guardados como JSON tal cual los manda la página. */
    private val FREE_KEYS = setOf("free.last", "free.favs", "free.bands", "free.bandUse", "free.widgetFav")

    fun getFree(c: Context, key: String): String =
        if (key in FREE_KEYS) prefs(c).getString(key, "") ?: "" else ""

    fun setFree(c: Context, key: String, value: String) {
        if (key !in FREE_KEYS) return
        val e = prefs(c).edit().putString(key, value)
        // Al marcar una favorita para el widget, el widget pasa a mostrarla; al desmarcarla, vuelve a la rutina
        if (key == "free.widgetFav") e.putString(WIDGET_SRC, if (value.isEmpty()) SRC_RUTINA else SRC_FAV)
        e.apply()
    }

    /* ---------- Favorita del widget ---------- */
    const val SRC_RUTINA = "rutina"
    const val SRC_FAV = "fav"
    private const val WIDGET_SRC = "widgetSrc"

    /** Nombre de la favorita marcada para el widget ("" si ninguna). */
    fun widgetFavName(c: Context): String = prefs(c).getString("free.widgetFav", "") ?: ""

    private fun favsArray(c: Context): JSONArray =
        try { JSONArray(prefs(c).getString("free.favs", "[]") ?: "[]") } catch (e: Exception) { JSONArray() }

    /** La favorita marcada para el widget, si sigue existiendo y tiene ejercicios. */
    fun widgetFav(c: Context): FreeSession? {
        val name = widgetFavName(c).ifEmpty { return null }
        val a = favsArray(c)
        for (i in 0 until a.length()) {
            val o = a.optJSONObject(i) ?: continue
            if (o.optString("name") == name) return FreeSession.fromJson(Rutina.get(c), o)
        }
        return null
    }

    /** Qué hace el widget: la rutina completa o la favorita marcada (si no hay favorita, siempre la rutina). */
    fun widgetSource(c: Context): String =
        if (widgetFav(c) != null && prefs(c).getString(WIDGET_SRC, SRC_FAV) == SRC_FAV) SRC_FAV else SRC_RUTINA

    fun setWidgetSource(c: Context, src: String) {
        prefs(c).edit().putString(WIDGET_SRC, src).apply()
    }

    /** Cambia las rondas de la favorita del widget (de 1 a 10), igual que los botones − / + de la app. */
    fun addWidgetFavRounds(c: Context, delta: Int) {
        val name = widgetFavName(c)
        val a = favsArray(c)
        for (i in 0 until a.length()) {
            val o = a.optJSONObject(i) ?: continue
            if (o.optString("name") != name) continue
            o.put("rounds", (o.optInt("rounds", 4) + delta).coerceIn(1, 10))
            prefs(c).edit().putString("free.favs", a.toString()).apply()
            return
        }
    }

    /** La banda grande que usas en un ejercicio (como bandOf() en la página), o null. */
    fun bandOf(c: Context, k: String): String? = try {
        val use = JSONObject(prefs(c).getString("free.bandUse", null).takeUnless { it.isNullOrBlank() } ?: "{}")
        val saved = try { JSONArray(prefs(c).getString("free.bands", "[]")) } catch (e: Exception) { JSONArray() }
        val bands = (0 until saved.length()).map { saved.optString(it) }.filter { it.isNotBlank() }.take(8)
            .ifEmpty { listOf("Banda 1", "Banda 2", "Banda 3", "Banda 4") }
        use.optString(k, "").takeIf { it.isNotEmpty() && it in bands }
    } catch (e: Exception) { null }

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
