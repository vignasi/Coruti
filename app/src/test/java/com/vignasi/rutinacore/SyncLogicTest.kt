package com.vignasi.rutinacore

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SyncLogicTest {

    private val local = JSONObject("""{"id":"s9","v":1,"type":"sueltos","src":"widget","title":"Brazos","day":"","rounds":2,
        "start":1762930000123,"end":1762930600456,"tz":60,"complete":false,"fb":{"brazos":"ok"},
        "sets":[{"k":"curl","name":"Curl","r":1,"side":"","start":1762930000123,"end":1762930040000,"reps":12,"planReps":12,
                 "secs":0,"planSecs":0,"kg":7.5,"band":null,"mod":null,"skipped":false}]}""")

    /** Lo que devuelve pull_sessions para esa misma sesión (copiado de la prueba en Postgres): otro orden, 7.50 y campos de página. */
    private val pulled = JSONObject("""{"v": 1, "_u": "2026-11-12T14:06:47.976312+00:00", "_id": "s9", "fb": {"brazos": "ok"},
        "id": "s9", "tz": 60, "day": "", "end": 1762930600456, "src": "widget",
        "sets": [{"k": "curl", "r": 1, "kg": 7.50, "end": 1762930040000, "mod": null, "band": null, "name": "Curl", "reps": 12,
                  "secs": 0, "side": "", "start": 1762930000123, "skipped": false, "planReps": 12, "planSecs": 0}],
        "type": "sueltos", "start": 1762930000123, "title": "Brazos", "rounds": 2, "complete": false}""")

    @Test fun laMismaSesionDaLaMismaHuellaEnElMovilYEnLaNube() {
        assertEquals(SyncLogic.sessionHash(local), SyncLogic.sessionHash(SyncLogic.cleanRemote(pulled)))
        val other = JSONObject(local.toString()).put("fb", JSONObject().put("brazos", "up"))
        assertNotEquals(SyncLogic.sessionHash(local), SyncLogic.sessionHash(other))
    }

    @Test fun pendientesLasNuevasYLasCambiadas() {
        val up = JSONObject()
        val hist = JSONArray().put(local)
        assertEquals(1, SyncLogic.pendingSessions(hist, up).size)
        up.put("s9", SyncLogic.sessionHash(local))
        assertEquals(0, SyncLogic.pendingSessions(hist, up).size)
        local.put("fb", JSONObject().put("brazos", "down"))   // «cómo te ha ido» después de subirla
        assertEquals(1, SyncLogic.pendingSessions(hist, up).size)
    }

    @Test fun alBajarNoSePisaLoPendienteDelMovil() {
        val mine = JSONObject(local.toString()).put("title", "Cambiada en el móvil")
        val up = JSONObject().put("s9", SyncLogic.sessionHash(local))  // se subió la versión anterior
        val newRemote = JSONObject(local.toString()).put("start", 1762930000000L).put("id", "s10")
        val (out, n) = SyncLogic.mergeRemoteSessions(JSONArray().put(mine), listOf(SyncLogic.cleanRemote(pulled), newRemote), up)
        assertEquals(1, n)  // solo entra la nueva
        assertEquals(2, out.length())
        assertEquals("s10", out.getJSONObject(0).getString("id"))  // ordenadas por hora
        assertEquals("Cambiada en el móvil", out.getJSONObject(1).getString("title"))
        assertEquals(1, SyncLogic.pendingSessions(out, up).size)  // y sigue pendiente de subir
    }

    @Test fun alBajarSeSustituyeLoQueYaEstabaSubido() {
        val up = JSONObject().put("s9", SyncLogic.sessionHash(local))
        val remote = JSONObject(local.toString()).put("title", "Cambiada por Claude")
        val (out, n) = SyncLogic.mergeRemoteSessions(JSONArray().put(local), listOf(remote), up)
        assertEquals(1, n)
        assertEquals("Cambiada por Claude", out.getJSONObject(0).getString("title"))
        assertEquals(0, SyncLogic.pendingSessions(out, up).size)
    }

    @Test fun quienGanaConElEstado() {
        assertEquals(SyncLogic.Action.PUSH, SyncLogic.decide("L", null, null, null))
        assertEquals(SyncLogic.Action.MERGE, SyncLogic.decide("L", "R", null, null))
        assertEquals(SyncLogic.Action.NONE, SyncLogic.decide("L", "R", "L", "R"))
        assertEquals(SyncLogic.Action.PUSH, SyncLogic.decide("L2", "R", "L", "R"))
        assertEquals(SyncLogic.Action.PULL, SyncLogic.decide("L", "R2", "L", "R"))
        assertEquals(SyncLogic.Action.MERGE, SyncLogic.decide("L2", "R2", "L", "R"))
        // Móvil recién instalado: se baja todo, sus ajustes por defecto no pisan los de la nube
        assertEquals(SyncLogic.Action.PULL, SyncLogic.decide("L", "R", null, null, localBlank = true))
        assertEquals(SyncLogic.Action.PUSH, SyncLogic.decide("L", null, null, null, localBlank = true))
        // Ya sincronizado: estar vacío no cambia nada (p. ej. si borraste las favoritas)
        assertEquals(SyncLogic.Action.PUSH, SyncLogic.decide("L2", "R", "L", "R", localBlank = true))
    }

    @Test fun movilEnBlanco() {
        assertTrue(SyncLogic.isBlank(JSONObject("""{"days":[],"config":{"rounds":3},"weights":{},"free":{"widgetFav":""}}"""), 0))
        assertFalse(SyncLogic.isBlank(JSONObject("""{"days":["2026-11-11"]}"""), 0))
        assertFalse(SyncLogic.isBlank(JSONObject("""{"free":{"favs":[{"name":"A"}]}}"""), 0))
        assertFalse(SyncLogic.isBlank(JSONObject("{}"), 1))
    }

    @Test fun lasFavoritasVanASuTablaYVuelven() {
        val state = JSONObject("""{"days":["2026-11-11"],"config":{"rounds":3},"weights":{"curl":7.5},
            "free":{"bands":["Roja"],"widgetFav":"Brazos","favs":[{"name":"Brazos","rounds":4},{"name":"Piernas"}]}}""")
        val data = SyncLogic.appStateData(state)
        assertFalse(data.getJSONObject("free").has("favs"))
        assertTrue(state.getJSONObject("free").has("favs"))  // no cambia el original
        val back = SyncLogic.remoteState(data, SyncLogic.favsOf(state))
        assertEquals(SyncLogic.hash(state), SyncLogic.hash(back))
        // Sin favoritas en la nube: llega la lista vacía, para que se borren también en el móvil
        assertEquals(0, SyncLogic.remoteState(data, JSONArray()).getJSONObject("free").getJSONArray("favs").length())
    }

    @Test fun laPrimeraVezSeCombinaYGanaElMovil() {
        val remote = JSONObject("""{"days":["2026-11-01"],"lastDay":"A","config":{"rounds":2},"weights":{"curl":5,"remo":10},
            "free":{"favs":[{"name":"Nube"}],"bands":["Azul"]}}""")
        val local = JSONObject("""{"days":["2026-11-11"],"lastDay":"B","config":{"rounds":4},"weights":{"curl":7.5},
            "free":{"favs":[{"name":"Móvil"}],"bands":["Roja"]}}""")
        val m = SyncLogic.mergeStates(remote, local)
        assertEquals(2, m.getJSONArray("days").length())
        assertEquals("B", m.getString("lastDay"))
        assertEquals(4, m.getJSONObject("config").getInt("rounds"))
        assertEquals(7.5, m.getJSONObject("weights").getDouble("curl"), 0.0)
        assertEquals(10.0, m.getJSONObject("weights").getDouble("remo"), 0.0)
        assertEquals(2, m.getJSONObject("free").getJSONArray("favs").length())
        assertEquals("Roja", m.getJSONObject("free").getJSONArray("bands").getString(0))
        assertFalse(m.has("history"))
    }

    @Test fun huellaIgualConOtroOrdenYNumerosEquivalentes() {
        val a = JSONObject("""{"b":1,"a":{"y":2.50,"x":[1,2]}}""")
        val b = JSONObject("""{"a":{"x":[1.0,2],"y":2.5},"b":1}""")
        assertEquals(SyncLogic.hash(a), SyncLogic.hash(b))
        assertNotEquals(SyncLogic.hash(a), SyncLogic.hash(JSONObject("""{"a":{"x":[2,1],"y":2.5},"b":1}""")))
    }
}
