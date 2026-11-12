package com.vignasi.rutinacore

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import kotlin.random.Random

/**
 * Favoritas en el widget: Kotlin tiene que montar los mismos pasos que la página.
 * Además de comprobar unos casos, deja en app/build/free-check.json 400 favoritas al azar con sus pasos
 * para compararlas con buildFree() de index.html.
 */
class FreePlanTest {
    private val data = Rutina.parse(File("src/main/assets/rutina.json").readText())
    private val bands = mapOf("press_goma" to "Roja", "curl_goma" to "Azul")
    private fun band(k: String) = bands[k]

    private fun fav(vararg items: Pair<String, Any>, rounds: Any = 4, rest: Any = 75, alt: Boolean = true) =
        JSONObject().put("name", "Prueba").put("rounds", rounds).put("rest", rest).put("alt", alt)
            .put("sel", JSONArray(items.map { JSONObject().put("k", it.first).put("n", it.second) }))

    @Test fun superserieDosEjercicios() {
        val keys = data.catalog.keys.filter { !data.ex(it).hold && data.cat(it)?.sides == null }.take(2)
        val f = FreeSession.fromJson(data, fav(keys[0] to 12, keys[1] to 10, rounds = 3))!!
        val st = buildFree(data, f, ::band)
        // 3 rondas × 2 ejercicios × (prepárate + ejercicio) + 2 descansos
        assertEquals(3 * 2 * 2 + 2, st.size)
        assertEquals(listOf(keys[0], keys[0], keys[1], keys[1], "gato"), st.take(5).map { it.k })
        assertTrue(st[4].rest)
    }

    @Test fun normalizaComoLaPagina() {
        val k = data.catalog.keys.first { data.ex(it).hold }
        val f = FreeSession.fromJson(data, fav(k to 7, "noexiste" to 3, rounds = 99, rest = 10))!!
        assertEquals(1, f.sel.size)
        assertEquals(5, f.sel[0].n) // los de mantener van de 5 en 5
        assertEquals(10, f.rounds)
        assertEquals(15, f.rest)
        assertNull(FreeSession.fromJson(data, fav("noexiste" to 3)))
    }

    @Test fun generaComparacionConLaPagina() {
        val rnd = Random(7)
        val keys = data.catalog.keys.filter { data.exercises.containsKey(it) }
        val out = JSONArray()
        repeat(400) {
            val n = 1 + rnd.nextInt(3)
            val items = (0 until n).map { keys[rnd.nextInt(keys.size)] }.distinct()
                .map { it to listOf(0, 1, 7, 12, 23, 30, 45, 61, 200)[rnd.nextInt(9)] }.toTypedArray()
            val f = fav(*items, rounds = 1 + rnd.nextInt(5), rest = listOf(15, 40, 75, 120, 300)[rnd.nextInt(5)], alt = rnd.nextBoolean())
            val s = FreeSession.fromJson(data, f) ?: return@repeat
            val steps = JSONArray()
            buildFree(data, s, ::band).forEach { st ->
                steps.put(JSONObject().put("k", st.k).put("name", st.name).put("sub", st.sub).put("s", st.s).put("r", st.r)
                    .put("prep", st.prep).put("rest", st.rest).put("say", st.say).put("reps", st.reps).put("hold", st.hold)
                    .put("kg", st.kg?.let { JSONArray(it.toList()) } ?: JSONObject.NULL).put("side", st.side))
            }
            out.put(JSONObject().put("fav", f).put("steps", steps))
        }
        File("build").mkdirs()
        File("build/free-check.json").writeText(out.toString())
        assertTrue(out.length() > 300)
    }
}
