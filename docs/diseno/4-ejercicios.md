# Rediseño · 4. Cómo se hace un ejercicio

Cada ejercicio, los 30 que hay y los que se creen después (también los que proponga Claude), pasa por tres pasos en orden.
Cada paso lee lo anterior y **no se da por bueno hasta pasar sus comprobaciones**. Solo un ejercicio **publicado**
sale en la app y lo puede elegir Claude.

Por qué así: hasta ahora el texto, las claves y la figura se hacían por separado y nada comprobaba que dijeran lo mismo.
Ejemplo real: la almeja dice «pies juntos, rodillas dobladas, cabeza apoyada en el brazo» y la figura 3D tiene las piernas
casi rectas, separa los pies al abrir y el tronco no toca el suelo. La causa es doble: las posturas son un dibujo 2D
y la almeja gira la pierna fuera de ese plano; y nadie comprobaba la figura contra el texto.

Dónde vive: en Supabase, tabla `exercise_catalog` (una fila por ejercicio, compartida por todas las cuentas).
La copia de trabajo está en el repo, en `ejercicios/` (de ahí sale el SQL). `rutina.json` sigue dentro de la app como
copia sin conexión hasta que la app lea el catálogo de la nube.

## Estados
`borrador` → `ficha` (paso 1 comprobado) → `tecnica` (paso 2 comprobado) → `figura` (paso 3 comprobado)
→ `publicado` (tu visto bueno con las capturas). Un ejercicio que se cambia vuelve al estado del paso que se cambia.

## Paso 1 · Ficha: qué es y para qué sirve
Lo que Claude usa para elegir. Archivo `ejercicios/fichas.json`, campo `ficha` en la tabla.

| Campo | Qué es | Valores |
|---|---|---|
| `nombre` | Como sale en la app | texto |
| `para_que` | Una frase: qué trabaja y para qué se usa | texto |
| `patron` | Patrón de movimiento | ver «Vocabulario» |
| `musculos` | `principales` y `secundarios` | ver «Vocabulario» |
| `posicion` | Postura de partida | ver «Vocabulario» |
| `tipo` | `reps` (repeticiones) o `isometrico` (mantener) | |
| `lados` | `bilateral`, `por_lado` (una serie por lado) o `alterno` (los dos lados en la misma serie) | |
| `material` | Lo que hace falta (vacío = nada). Material que se tiene: `gomas`, `banda`, `mancuernas`; de casa: `silla`, `sofa`, `pared`, `toalla` | lista |
| `nivel` | 1 fácil · 2 medio · 3 difícil, para alguien que empieza | 1–3 |
| `regresion` / `progresion` | El ejercicio más fácil / más difícil de la misma familia (o `null`) | clave |
| `sustitutos` | Con los que se puede cambiar si falta material o molesta algo | claves |
| `carga` | Cuánto carga cada zona: `lumbar`, `rodilla`, `hombro`, `muneca`, `cuello` | 0 poca · 1 media · 2 mucha |
| `evitar_si` | Cuándo no hacerlo o con cuidado | texto |
| `usos` | Para qué sesiones sirve: `core`, `fuerza`, `movilidad`, `calentar`, `recuperar` | lista |
| `dosis` | `base` (lo de hoy en el catálogo) y `rango` (mínimo y máximo razonables) en reps o segundos; `tempo_s` = segundos por repetición | |
| `apuntes` | Lo que se ha visto mal al hacer la ficha y hay que arreglar en los pasos 2 y 3 | lista |

**Comprobaciones del paso 1** (`node ejercicios/comprobar.js`): todos los campos están y usan el vocabulario;
`regresion`, `progresion` y `sustitutos` apuntan a ejercicios que existen y no a sí mismos; si A tiene progresión B, B tiene
regresión A (o lo justifica en `apuntes`); `tipo`, `lados`, material, zona y dosis base coinciden con `rutina.json`.

## Paso 2 · Técnica: cómo se hace
Campo `tecnica`. Lo que se lee en la ficha y en el reproductor, **y lo que la figura tiene que cumplir**.

| Campo | Qué es |
|---|---|
| `inicio` | Posición inicial, en 1–2 frases |
| `fases` | Una por fase del movimiento: `texto` (lo que sale en el reproductor), `segundos`, `tono` (`up`/`down`) y **`apoyos`** |
| `claves` | 3–4 claves (barriga, culo, espalda…), las que de verdad cambian el ejercicio |
| `errores` | Errores típicos y cómo se nota |
| `respiracion` | Cuándo coger y soltar el aire |
| `lo_notas_en` | Dónde se tiene que notar (y dónde no) |
| `condiciones` | Lo que se cumple todo el ejercicio, escrito con el vocabulario de abajo para que se pueda comprobar |

`apoyos` (por fase): partes del cuerpo que tocan el suelo o un mueble: `cabeza`, `espalda_alta`, `espalda_baja`, `cadera`,
`brazo_abajo`, `antebrazos`, `manos`, `rodillas`, `pies`, `puntas_pies`, `talones`, `lado_cuerpo`. Con mueble: `manos@silla`.

`condiciones` (todo el ejercicio, o por fase con `fase`):
- `juntos: [pie_izq, pie_der]` · `separados: [...]` (distancia máxima o mínima en cm, por defecto 10)
- `angulo: {articulacion: rodilla|cadera|codo|hombro, entre: [min, max]}` (grados)
- `recto: [hombro, cadera, rodilla]` (alineados, ±10°) · `quieto: codo` (no se mueve más de 5 cm)
- `altura: {parte, sobre: suelo|silla, entre: [min, max]}` (cm)

**Comprobaciones del paso 2:** todo lo que dicen `inicio`, `claves` y `fases` sobre apoyos, juntos o ángulos está en
`apoyos` o `condiciones` (se revisa a mano con una lista, frase por frase); el texto de cada fase habla del ejercicio
(no de otro, como pasa hoy en el press con banda); ninguna clave es de dosis ni de nivel.

## Paso 3 · Figura: el muñeco
Campo `figura`: posturas, fases, material y vista. En 2D (lo de hoy) si el movimiento va en el plano del dibujo;
**con giros 3D** cuando no (almeja, y los que se vean al revisar).

**Comprobaciones del paso 3** (sobre el modelo 3D, hombre y mujer, cada fase y a mitad de cada movimiento):
- Cada parte de `apoyos` toca su apoyo (a menos de 2 cm de la superficie del cuerpo, no del hueso) y **nada más flota**:
  si el cuerpo no tiene ningún apoyo, falla.
- Nada atraviesa el suelo ni los muebles.
- Se cumplen todas las `condiciones`.
- Las articulaciones no pasan de su rango normal (rodilla 0–150°, codo 0–150°…).
- Capturas de cada fase, hombre y mujer, claro y oscuro, a tamaño miniatura y reproductor → **tu visto bueno**.

## Ejercicios nuevos (y los que proponga Claude)
1. Claude, en tu conversación, propone el ejercicio y rellena el paso 1 (con el conector, B2, lo deja como `borrador`).
2. Una sesión de Claude Code hace los pasos 2 y 3 con sus comprobaciones.
3. Tú miras las capturas y lo publicas. La app lo baja de la nube sin APK nuevo (cuando la app lea el catálogo de la nube).

## Vocabulario
- `patron`: `puente_cadera`, `bisagra_cadera`, `abduccion_cadera`, `desplazamiento_lateral`, `empuje_horizontal`,
  `tiron_horizontal`, `flexion_codo`, `extension_codo`, `anti_extension`, `anti_flexion_lateral`, `flexion_tronco`,
  `movilidad_columna`, `movilidad_hombro`, `estiramiento_cadera`.
- `musculos`: `gluteo_mayor`, `gluteo_medio`, `isquios`, `cuadriceps`, `psoas`, `recto_abdominal`, `transverso`,
  `oblicuos`, `erectores`, `dorsal`, `escapulares` (romboides y trapecio medio), `deltoides_anterior`, `deltoides_posterior`,
  `pectoral`, `triceps`, `biceps`, `antebrazo`, `serrato`, `manguito_rotador`.
- `posicion`: `boca_arriba`, `boca_abajo`, `de_lado`, `cuadrupedia`, `rodilla_en_suelo`, `sentado_suelo`, `apoyado_silla`,
  `de_pie`, `de_pie_inclinado`, `de_pie_pared`.

## Estado de los 30 ejercicios (14 nov 2026)
Paso 1 hecho y comprobado en los 30 (`node ejercicios/comprobar.js`). Pasos 2 y 3: pendientes en todos.
Lo que ya se ha visto mal al hacer las fichas (pasa a los pasos 2 y 3):

| Ejercicio | Zona · patrón · nivel | Apuntes |
|---|---|---|
| Curl de bíceps con banda (`curl_goma`) | Brazos · flexion codo · 1 | — |
| Curl de bíceps con mancuernas (`curl_db`) | Brazos · flexion codo · 1 | — |
| Curl isométrico con toalla (`curl_toalla`) | Brazos · flexion codo · 1 | — |
| Extensión de tríceps tumbado (`ext_db`) | Brazos · extension codo · 1 | — |
| Fondos en silla (`fondos`) | Brazos · extension codo · 2 | — |
| Flexiones cerradas (`flex_cerr`) | Brazos · empuje horizontal · 3 | La clave «si cuesta, apoya las rodillas» es una variante que no existe como ejercicio |
| Dead bug (`deadbug`) | Core · anti extension · 1 | Comprobar en 3D que la espalda apoya en el suelo (la comprobación 2D no sirve para los tumbados) |
| Plancha con retroversión (`plancha`) | Core · anti extension · 1 | La primera fase enseña el error («Así NO»): en el paso 2 decidir si se queda |
| Plancha lateral con rodillas (`plancha_lat_k`) | Core · anti flexion lateral · 1 | — |
| Crunch inverso (`crunch_inv`) | Core · flexion tronco · 2 | La clave «Las 2–3 últimas tienen que costar» es de dosis, no de técnica |
| Hollow hold (`hollow_k`) | Core · anti extension · 2 | Nombre en inglés y casi igual a los otros dos hollow: el nombre no dice qué cambia (rodillas dobladas) |
| Hollow hold con brazos atrás (`hollow_kb`) | Core · anti extension · 2 | — |
| Plancha lateral (`plancha_lat`) | Core · anti flexion lateral · 2 | La fase dice «estira el brazo de arriba al techo» y ninguna clave lo dice: decidir en el paso 2 |
| Hollow hold con piernas estiradas (`hollow_l`) | Core · anti extension · 3 | La dosis base (40 s) es la mayor de los tres siendo el más difícil: revisar |
| Remo a una mano con mancuerna (`remo_db`) | Espalda · tiron horizontal · 1 | — |
| Remo sentado con banda (`remo_goma`) | Espalda · tiron horizontal · 1 | — |
| Ángel en pared (`angel`) | Espalda · movilidad hombro · 1 | La flecha y la etiqueta están en la esquina del dibujo y no dejan agrandar la figura (D3) |
| Remo inclinado con banda (`remo_incl_banda`) | Espalda · tiron horizontal · 2 | No está en ningún módulo de la rutina de core: solo en sesiones sueltas<br>Las etiquetas están en la esquina y no dejan agrandar la figura (D3) |
| Almeja (`almeja`) | Glúteo · abduccion cadera · 1 | Figura 3D mal: piernas casi rectas en vez de cadera y rodillas dobladas<br>Figura 3D mal: al abrir, el pie de arriba se separa (la clave dice pies juntos)<br>Figura 3D mal: la cabeza no apoya en el brazo y el tronco flota (solo toca el brazo)<br>Causa: la apertura es un giro fuera del plano del dibujo 2D; necesita postura 3D<br>Con mini banda sería la variante natural: no existe |
| Puente de glúteo (`puente`) | Glúteo · puente cadera · 1 | — |
| Puente de glúteo con banda (`puente_banda`) | Glúteo · puente cadera · 1 | — |
| Paso lateral con banda (`paso_lateral`) | Glúteo · desplazamiento lateral · 2 | — |
| Puente con apertura de rodillas (`puente_abd`) | Glúteo · abduccion cadera · 2 | — |
| Estiramiento de psoas (`psoas`) | Movilidad · estiramiento cadera · 1 | — |
| Gato-camello (`gato`) | Movilidad · movilidad columna · 1 | — |
| Flexiones inclinadas (`flex_incl`) | Pecho · empuje horizontal · 1 | Dosis base 8, menor que la de las flexiones normales (10) siendo más fáciles: revisar |
| Press de suelo con banda (`press_goma`) | Pecho · empuje horizontal · 1 | Las fases dicen «Empuja las mancuernas»: copiadas del press con mancuernas<br>La banda va por la espalda: comprobar en la figura que pasa por debajo de los omóplatos |
| Press de suelo con mancuernas (`press_db`) | Pecho · empuje horizontal · 1 | — |
| Flexiones (`flex`) | Pecho · empuje horizontal · 2 | — |
| Flexiones con pies elevados (`flex_pies`) | Pecho · empuje horizontal · 3 | — |

Orden propuesto para los pasos 2 y 3: primero la **almeja** (es el caso que obliga a hacer posturas 3D),
después los tumbados (dead bug, hollow, crunch inverso, press, extensión, puentes: comprobar que la espalda apoya),
luego los de pie y los que usan muebles, y al final los que no tienen apuntes.
