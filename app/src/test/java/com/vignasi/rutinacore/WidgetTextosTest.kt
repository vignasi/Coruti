package com.vignasi.rutinacore

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/** Textos y figura del widget (C2): lo mismo que dice el reproductor de la app, y una imagen para cada fase. */
class WidgetTextosTest {
    private val data = Rutina.parse(File("src/main/assets/rutina.json").readText())

    private fun ej(k: String, r: Int, reps: Int = 0, s: Int = 30, side: String = "") =
        Step(k, data.ex(k).name, "", s, r, prep = false, rest = false, say = "", reps = reps, side = side)
    private fun prep(k: String, r: Int) = Step(k, "Prepárate", "", 5, r, prep = true, rest = false, say = "")
    private fun desc(r: Int) = Step("gato", "Descanso", "", 60, r, prep = false, rest = true, say = "")

    // 2 rondas de: puente (reps) y plancha (tiempo), con descanso entre rondas
    private val pasos = listOf(
        prep("puente", 1), ej("puente", 1, reps = 12, s = 36), prep("plancha", 1), ej("plancha", 1, s = 30),
        desc(2), prep("puente", 2), ej("puente", 2, reps = 12, s = 36), prep("plancha", 2), ej("plancha", 2, s = 30)
    )

    @Test fun posicionComoLaApp() {
        assertEquals("Ronda 1 de 2 · 1 de 2", posTxt(pasos, 0, "Ronda")) // «Prepárate» cuenta ya el que viene
        assertEquals("Ronda 1 de 2 · 1 de 2", posTxt(pasos, 1, "Ronda"))
        assertEquals("Ronda 1 de 2 · 2 de 2", posTxt(pasos, 3, "Ronda"))
        assertEquals("Ronda 2 de 2", posTxt(pasos, 4, "Ronda"))
        assertEquals("Serie 2 de 2 · 2 de 2", posTxt(pasos, 8, "Serie"))
    }

    @Test fun cantidad() {
        assertEquals("12 reps" to "Ritmo 1 de 12", cantidadTxt(pasos[1], 0f, 36, 3f))
        assertEquals("12 reps" to "Ritmo 5 de 12", cantidadTxt(pasos[1], 12.5f, 24, 3f))
        assertEquals("12 reps" to "Ritmo 12 de 12", cantidadTxt(pasos[1], 40f, 0, 3f)) // no pasa del total
        assertEquals("12", cantidadTxt(pasos[1], 0f, 36, 3f, corta = true).first)
        assertEquals("0:25" to "de 0:30", cantidadTxt(pasos[3], 5f, 25, 1f))
        assertEquals("0:25" to "de 0:30 · lado derecho", cantidadTxt(ej("plancha", 1, side = "Lado derecho"), 5f, 25, 1f))
        assertEquals("1:00" to "Descanso", cantidadTxt(pasos[4], 0f, 60, 1f))
        assertEquals("3" to "Prepárate", cantidadTxt(pasos[0], 2f, 3, 1f))
    }

    @Test fun luego() {
        val puente = data.ex("puente").name.lowercase()
        val plancha = data.ex("plancha").name.lowercase()
        assertEquals("Luego: $plancha", luegoTxt(pasos, 0))
        assertEquals("Luego: $plancha", luegoTxt(pasos, 1))
        assertEquals("Luego: descanso de 60 s", luegoTxt(pasos, 3))
        assertEquals("Empiezas con: $puente", luegoTxt(pasos, 4))
        assertEquals("Es el último", luegoTxt(pasos, 8))
    }

    @Test fun resumen() {
        assertEquals("2 ejercicios", ejerciciosTxt(pasos))
        assertEquals("1 min", minTxt(20))
        assertEquals("19 min", minTxt(19 * 60 + 10))
    }

    @Test fun figuraDelDescansoEsLaSiguiente() {
        assertEquals("puente", ejercicioFigura(pasos, -1)) // parado: el primero
        assertEquals("plancha", ejercicioFigura(pasos, 3))
        assertEquals("puente", ejercicioFigura(pasos, 4))
        assertEquals("fig_f_remo_incl_banda_1", recursoFigura("f", "remo_incl_banda", 1))
        assertEquals("fig_m_puente_0", recursoFigura("x", "puente", 0))
    }

    /** Cada fase de cada ejercicio de rutina.json tiene su imagen, de hombre y mujer, en claro y oscuro
     *  (app/build.gradle.kts las copia como recursos). Si falla: rehacerlas (docs/diseno/figura/NOTAS.md → widget). */
    @Test fun hayImagenParaCadaFase() {
        val faltan = ArrayList<String>()
        for ((k, ex) in data.exercises) for (i in ex.phases.indices) for (g in listOf("m", "f")) for (t in listOf("claro", "oscuro")) {
            val f = File("../docs/diseno/figura/widget/$g/$t/${k}_$i.webp")
            if (!f.isFile) faltan.add(f.path)
        }
        assertTrue("Faltan imágenes del widget: $faltan", faltan.isEmpty())
    }
}
