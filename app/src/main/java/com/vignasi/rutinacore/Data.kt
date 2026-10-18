package com.vignasi.rutinacore

// Generado a partir de la rutina web (assets/index.html). No editar a mano.

val EXERCISES: Map<String, Exercise> = linkedMapOf(
    "psoas" to Exercise(
        key = "psoas",
        name = "Estiramiento de psoas",
        poses = listOf(
            mapOf("h" to floatArrayOf(95f, 14f), "s" to floatArrayOf(95f, 27f), "p" to floatArrayOf(95f, 62f), "k1" to floatArrayOf(85f, 98f), "a1" to floatArrayOf(55f, 100f), "k2" to floatArrayOf(128f, 70f), "a2" to floatArrayOf(128f, 100f), "e1" to floatArrayOf(86f, 44f), "w1" to floatArrayOf(93f, 60f), "e2" to floatArrayOf(88f, 44f), "w2" to floatArrayOf(95f, 60f)),
            mapOf("h" to floatArrayOf(96f, 14f), "s" to floatArrayOf(96f, 27f), "p" to floatArrayOf(97f, 63f), "k1" to floatArrayOf(85f, 98f), "a1" to floatArrayOf(55f, 100f), "k2" to floatArrayOf(130f, 70f), "a2" to floatArrayOf(128f, 100f), "e1" to floatArrayOf(87f, 44f), "w1" to floatArrayOf(95f, 60f), "e2" to floatArrayOf(89f, 44f), "w2" to floatArrayOf(97f, 60f)),
            mapOf("h" to floatArrayOf(106f, 15f), "s" to floatArrayOf(106f, 28f), "p" to floatArrayOf(108f, 64f), "k1" to floatArrayOf(85f, 98f), "a1" to floatArrayOf(55f, 100f), "k2" to floatArrayOf(139f, 73f), "a2" to floatArrayOf(128f, 100f), "e1" to floatArrayOf(97f, 45f), "w1" to floatArrayOf(105f, 61f), "e2" to floatArrayOf(99f, 45f), "w2" to floatArrayOf(107f, 61f))
        ),
        phases = listOf(
            Phase(0, 1f, 1.4f, "Postura: rodilla de atrás en el suelo, tronco recto", listOf(), null, false),
            Phase(1, 0.6f, 1.8f, "Paso 1 · Aprieta fuerte el culo y mete el coxis hacia abajo", listOf("gl"), floatArrayOf(74f, 42f, 80f, 60f), false),
            Phase(2, 1.8f, 2.6f, "Paso 2 · Sin soltar el culo, lleva la cadera adelante unos cm", listOf("gl"), floatArrayOf(112f, 38f, 136f, 38f), true)
        ),
        gl = floatArrayOf(-8f, 3f),
        ab = floatArrayOf(8f, 0f),
        lab = mapOf("gl" to floatArrayOf(38f, 20f), "st" to floatArrayOf(34f, 62f)),
        stretchSeg = listOf("p", "k1"),
        hold = true,
        rep = 0f,
        reps = 0,
        unit = ""
    ),
    "puente" to Exercise(
        key = "puente",
        name = "Puente de glúteo",
        poses = listOf(
            mapOf("h" to floatArrayOf(26f, 94f), "s" to floatArrayOf(40f, 97f), "p" to floatArrayOf(90f, 98f), "k1" to floatArrayOf(120f, 74f), "a1" to floatArrayOf(135f, 100f), "k2" to floatArrayOf(118f, 75f), "a2" to floatArrayOf(133f, 100f), "e1" to floatArrayOf(60f, 100f), "w1" to floatArrayOf(78f, 100f), "e2" to floatArrayOf(60f, 100f), "w2" to floatArrayOf(78f, 100f)),
            mapOf("h" to floatArrayOf(28f, 93f), "s" to floatArrayOf(46f, 95f), "p" to floatArrayOf(95f, 72f), "k1" to floatArrayOf(126f, 67f), "a1" to floatArrayOf(135f, 100f), "k2" to floatArrayOf(124f, 68f), "a2" to floatArrayOf(133f, 100f), "e1" to floatArrayOf(64f, 100f), "w1" to floatArrayOf(82f, 100f), "e2" to floatArrayOf(64f, 100f), "w2" to floatArrayOf(82f, 100f))
        ),
        phases = listOf(
            Phase(1, 1f, 1f, "Sube en 1 s apretando el culo y aguanta 1 s arriba", listOf("gl"), floatArrayOf(108f, 96f, 108f, 70f), false),
            Phase(0, 1.5f, 0.5f, "Baja despacio (2 s) con el ombligo dentro", listOf("ab"), null, false)
        ),
        gl = floatArrayOf(-2f, 5f),
        ab = floatArrayOf(0f, -7f),
        lab = mapOf("gl" to floatArrayOf(135f, 28f), "ab" to floatArrayOf(40f, 62f)),
        stretchSeg = null,
        hold = false,
        rep = 4f,
        reps = 15,
        unit = "Repetición"
    ),
    "deadbug" to Exercise(
        key = "deadbug",
        name = "Dead bug",
        poses = listOf(
            mapOf("h" to floatArrayOf(30f, 92f), "s" to floatArrayOf(44f, 95f), "p" to floatArrayOf(95f, 96f), "k1" to floatArrayOf(95f, 64f), "a1" to floatArrayOf(125f, 64f), "k2" to floatArrayOf(97f, 64f), "a2" to floatArrayOf(127f, 64f), "e1" to floatArrayOf(44f, 77f), "w1" to floatArrayOf(44f, 59f), "e2" to floatArrayOf(46f, 77f), "w2" to floatArrayOf(46f, 59f)),
            mapOf("h" to floatArrayOf(30f, 92f), "s" to floatArrayOf(44f, 95f), "p" to floatArrayOf(95f, 96f), "k1" to floatArrayOf(95f, 64f), "a1" to floatArrayOf(125f, 64f), "k2" to floatArrayOf(127f, 80f), "a2" to floatArrayOf(158f, 90f), "e1" to floatArrayOf(27f, 86f), "w1" to floatArrayOf(10f, 92f), "e2" to floatArrayOf(46f, 77f), "w2" to floatArrayOf(46f, 59f)),
            mapOf("h" to floatArrayOf(30f, 92f), "s" to floatArrayOf(44f, 95f), "p" to floatArrayOf(95f, 96f), "k1" to floatArrayOf(127f, 80f), "a1" to floatArrayOf(158f, 90f), "k2" to floatArrayOf(97f, 64f), "a2" to floatArrayOf(127f, 64f), "e1" to floatArrayOf(44f, 77f), "w1" to floatArrayOf(44f, 59f), "e2" to floatArrayOf(29f, 86f), "w2" to floatArrayOf(12f, 92f))
        ),
        phases = listOf(
            Phase(1, 1.5f, 0.5f, "Estira un brazo atrás y la pierna contraria adelante (2 s)", listOf("ab"), floatArrayOf(150f, 62f, 165f, 80f), false),
            Phase(0, 1.5f, 0.5f, "Vuelve al centro (2 s), lumbar pegada al suelo", listOf("ab"), null, false),
            Phase(2, 1.5f, 0.5f, "Ahora el otro brazo y la otra pierna (2 s)", listOf("ab"), floatArrayOf(150f, 62f, 165f, 80f), false),
            Phase(0, 1.5f, 0.5f, "Vuelve al centro (2 s)", listOf("ab"), null, false)
        ),
        gl = null,
        ab = floatArrayOf(0f, -7f),
        lab = mapOf("ab" to floatArrayOf(80f, 18f)),
        stretchSeg = null,
        hold = false,
        rep = 4f,
        reps = 16,
        unit = "Repetición"
    ),
    "plancha" to Exercise(
        key = "plancha",
        name = "Plancha con retroversión",
        poses = listOf(
            mapOf("h" to floatArrayOf(28f, 68f), "s" to floatArrayOf(42f, 73f), "c" to floatArrayOf(71f, 86f), "p" to floatArrayOf(100f, 83f), "k1" to floatArrayOf(128f, 92f), "a1" to floatArrayOf(156f, 100f), "k2" to floatArrayOf(129f, 93f), "a2" to floatArrayOf(157f, 100f), "e1" to floatArrayOf(42f, 100f), "w1" to floatArrayOf(22f, 100f), "e2" to floatArrayOf(44f, 100f), "w2" to floatArrayOf(24f, 100f)),
            mapOf("h" to floatArrayOf(28f, 68f), "s" to floatArrayOf(42f, 73f), "c" to floatArrayOf(71f, 73f), "p" to floatArrayOf(100f, 74f), "k1" to floatArrayOf(128f, 88f), "a1" to floatArrayOf(156f, 100f), "k2" to floatArrayOf(129f, 89f), "a2" to floatArrayOf(157f, 100f), "e1" to floatArrayOf(42f, 100f), "w1" to floatArrayOf(22f, 100f), "e2" to floatArrayOf(44f, 100f), "w2" to floatArrayOf(24f, 100f))
        ),
        phases = listOf(
            Phase(0, 1f, 1.4f, "Así NO: la lumbar se hunde", listOf(), null, false),
            Phase(1, 1f, 2.6f, "Aprieta el culo y mete el ombligo: el cuerpo queda recto", listOf("gl", "ab"), floatArrayOf(88f, 100f, 88f, 84f), false)
        ),
        gl = floatArrayOf(2f, -7f),
        ab = floatArrayOf(0f, 7f),
        lab = mapOf("gl" to floatArrayOf(135f, 40f), "ab" to floatArrayOf(36f, 40f)),
        stretchSeg = null,
        hold = true,
        rep = 0f,
        reps = 0,
        unit = ""
    ),
    "gato" to Exercise(
        key = "gato",
        name = "Gato-camello",
        poses = listOf(
            mapOf("h" to floatArrayOf(42f, 52f), "s" to floatArrayOf(55f, 62f), "c" to floatArrayOf(85f, 77f), "p" to floatArrayOf(115f, 62f), "k1" to floatArrayOf(115f, 100f), "a1" to floatArrayOf(150f, 100f), "k2" to floatArrayOf(117f, 100f), "a2" to floatArrayOf(152f, 100f), "e1" to floatArrayOf(55f, 81f), "w1" to floatArrayOf(55f, 100f), "e2" to floatArrayOf(57f, 81f), "w2" to floatArrayOf(57f, 100f)),
            mapOf("h" to floatArrayOf(46f, 79f), "s" to floatArrayOf(55f, 62f), "c" to floatArrayOf(85f, 40f), "p" to floatArrayOf(115f, 62f), "k1" to floatArrayOf(115f, 100f), "a1" to floatArrayOf(150f, 100f), "k2" to floatArrayOf(117f, 100f), "a2" to floatArrayOf(152f, 100f), "e1" to floatArrayOf(55f, 81f), "w1" to floatArrayOf(55f, 100f), "e2" to floatArrayOf(57f, 81f), "w2" to floatArrayOf(57f, 100f))
        ),
        phases = listOf(
            Phase(0, 3f, 0.5f, "Coge aire: deja caer la barriga y mira al frente", listOf(), floatArrayOf(85f, 62f, 85f, 78f), false),
            Phase(1, 3f, 0.5f, "Suelta el aire: redondea la espalda y mete el ombligo", listOf("ab"), floatArrayOf(85f, 50f, 85f, 32f), false)
        ),
        gl = floatArrayOf(7f, -2f),
        ab = floatArrayOf(0f, 8f),
        lab = mapOf("ab" to floatArrayOf(135f, 22f)),
        stretchSeg = null,
        hold = false,
        rep = 7f,
        reps = 6,
        unit = "Respiración"
    )
)

val ROUND: List<RoundStep> = listOf(
    RoundStep("psoas", "Rodilla izquierda en el suelo · quieto", 30, "Rodilla izquierda en el suelo"),
    RoundStep("psoas", "Rodilla derecha en el suelo · quieto", 30, "Ahora rodilla derecha en el suelo"),
    RoundStep("puente", "Sigue el ritmo del dibujo", 60, "Puente de glúteo, quince repeticiones"),
    RoundStep("deadbug", "Sigue el ritmo del dibujo", 64, "Dead bug, ocho por lado"),
    RoundStep("plancha", "Mantén quieto con la pelvis metida", 30, "Plancha, treinta segundos"),
    RoundStep("gato", "Respira al ritmo del dibujo", 42, "Gato camello, seis respiraciones")
)
