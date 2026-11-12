package com.vignasi.rutinacore

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** Importar una copia: se combina con lo que hay sin perder nada. */
class BackupMergeTest {

    private fun session(id: String, start: Long) = JSONObject()
        .put("id", id).put("start", start).put("end", start + 600_000)
        .put("sets", JSONArray().put(JSONObject().put("k", "puente").put("reps", 15)))

    private fun snap(
        history: List<JSONObject> = emptyList(), days: List<String> = emptyList(), lastDay: String = "",
        sessions: Int = 0, config: JSONObject? = null, weights: JSONObject = JSONObject(), free: JSONObject = JSONObject()
    ) = JSONObject().put("app", "rutina-core").put("v", 1)
        .put("history", JSONArray(history)).put("days", JSONArray(days)).put("lastDay", lastDay).put("lastRounds", 3)
        .put("sessions", sessions).put("config", config ?: JSONObject().put("rounds", 3))
        .put("weights", weights).put("free", free)

    private fun ids(o: JSONObject) = o.getJSONArray("history").let { a -> (0 until a.length()).map { a.getJSONObject(it).getString("id") } }

    @Test fun movilVacioRecuperaTodo() {
        val copy = snap(
            history = listOf(session("b", 2000), session("a", 1000)), days = listOf("2026-11-09", "2026-11-10"), lastDay = "A",
            sessions = 7, config = JSONObject().put("rounds", 4), weights = JSONObject().put("curl", 5.0),
            free = JSONObject().put("favs", JSONArray().put(JSONObject().put("name", "Brazos")))
                .put("bands", JSONArray().put("Roja")).put("bandUse", JSONObject().put("remo", "Roja"))
        )
        val m = Backup.merge(snap(), copy)
        assertEquals(listOf("a", "b"), ids(m))
        assertEquals(2, m.getJSONArray("days").length())
        assertEquals("A", m.getString("lastDay"))
        assertEquals(7, m.getInt("sessions"))
        assertEquals(4, m.getJSONObject("config").getInt("rounds"))
        assertEquals(5.0, m.getJSONObject("weights").getDouble("curl"), 0.0)
        assertEquals("Brazos", m.getJSONObject("free").getJSONArray("favs").getJSONObject(0).getString("name"))
        assertEquals("Roja", m.getJSONObject("free").getJSONObject("bandUse").getString("remo"))
    }

    @Test fun copiaViejaNoBorraNadaNiDuplica() {
        val local = snap(
            history = listOf(session("a", 1000), session("c", 3000)), days = listOf("2026-11-10", "2026-11-11"), lastDay = "B",
            sessions = 9, weights = JSONObject().put("curl", 6.0).put("press", 8.0),
            free = JSONObject().put("favs", JSONArray().put(JSONObject().put("name", "Nueva")))
        )
        val copy = snap(
            history = listOf(session("a", 1000), session("b", 2000)), days = listOf("2026-11-01", "2026-11-10"), lastDay = "A",
            sessions = 5, weights = JSONObject().put("curl", 5.0),
            free = JSONObject().put("favs", JSONArray().put(JSONObject().put("name", "Vieja")))
        )
        val m = Backup.merge(local, copy)
        assertEquals(listOf("a", "b", "c"), ids(m))
        assertEquals(3, m.getJSONArray("days").length())
        assertEquals("B", m.getString("lastDay")) // el móvil tiene el día más reciente
        assertEquals(9, m.getInt("sessions"))
        assertEquals(5.0, m.getJSONObject("weights").getDouble("curl"), 0.0) // pesos: manda la copia
        assertEquals(8.0, m.getJSONObject("weights").getDouble("press"), 0.0) // y no se pierden los del móvil
        val favs = m.getJSONObject("free").getJSONArray("favs")
        assertEquals(2, favs.length())
    }

    @Test fun importarDosVecesEsIgual() {
        val copy = snap(history = listOf(session("a", 1000)), days = listOf("2026-11-10"))
        val once = Backup.merge(snap(), copy)
        val twice = Backup.merge(once, copy)
        assertEquals(once.toString(), twice.toString())
    }

    @Test fun rechazaArchivosQueNoSonCopias() {
        for (bad in listOf("hola", "{}", "{\"app\":\"otra\"}", "{\"app\":\"rutina-core\",\"v\":99}")) {
            val r = runCatching { Backup.read(bad) }
            assertTrue(bad, r.isFailure)
            assertFalse(r.exceptionOrNull()?.message.isNullOrEmpty())
        }
        Backup.read("{\"app\":\"rutina-core\",\"v\":1}")
    }
}
