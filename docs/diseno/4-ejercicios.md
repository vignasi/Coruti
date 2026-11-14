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

`apoyos` (por fase): partes del cuerpo que tocan el suelo o un mueble. En plural, los dos lados; en singular, uno.
`cabeza`, `espalda_alta`, `espalda_baja`, `cadera`, `lado_cuerpo` (tumbado de lado: tronco, cadera y muslo de abajo),
`brazo_abajo`, `pierna_abajo` (la de abajo, tumbado de lado), `brazos`, `antebrazos`/`antebrazo`, `codos`, `manos`/`mano`,
`rodillas`/`rodilla`, `espinillas`, `pies`/`pie`, `puntas_pies`, `talones`. Con mueble: `manos@silla`, `mano@silla`,
`manos@sofa`, `puntas_pies@silla`, `espalda_alta@pared`. Sobre otra parte del cuerpo: `cabeza@brazo_abajo`.
A mitad de un movimiento se piden los apoyos que están en la fase de antes y en la de después.

`condiciones` (todo el ejercicio, o por fase con `fase`, número o lista, empezando en 0):
- `juntos: [pie_izq, pie_der]` (superficie con superficie a 3 cm como mucho) · `separados: {partes: [...], cm: 15}` (como
  mínimo; por defecto 10). Partes: `pie`, `rodilla`, `mano`, `codo`, `brazo`, `muslo`, `tobillo` con `_izq`/`_der`, y `cabeza`.
- `angulo: {articulacion: rodilla|cadera|codo|hombro, entre: [min, max], lado: izq|der|alguno}` (grados; 0 = recto o
  brazo pegado al cuerpo; sin `lado`, los dos). Cadera: entre tronco y muslo, negativa si el muslo va por detrás.
- `recto: {puntos: [hombro, cadera, tobillo], tol: 12}` (alineados; por defecto ±10°) · `quieto: codo` o
  `{parte: tobillo, cm: 5}` (no se mueve más de 5 cm en todo el ejercicio)
- `inclinacion: {parte: tronco, entre: [min, max]}` (grados respecto a la vertical: 0 de pie, 90 horizontal)
- `altura: {parte, sobre: suelo|silla, entre: [min, max]}` (cm)

`no_medible`: frases del texto que no se pueden comprobar en 3D, con el porqué (p. ej. «palmas hacia los pies»).

**Comprobaciones del paso 2** (`node ejercicios/comprobar.js`, junto con las del paso 1): todos los campos están; las fases
coinciden con `rutina.json` en número, segundos, tono y texto, y las claves también (`node ejercicios/a_rutina.js` las pasa a
`rutina.json`, que es lo que lee la app); apoyos y condiciones usan el vocabulario y los muebles están en el material;
**frase por frase**, lo que dicen `inicio`, `claves` y `fases` sobre juntos, separados, ángulos, rectitud o quietud tiene
su condición (o está en `no_medible`); ninguna clave es de dosis ni de nivel; si el texto nombra mancuernas, banda o
toalla, el ejercicio las usa (así se habría visto el «Empuja las mancuernas» del press con banda).

## Paso 3 · Figura: el muñeco
Campo `figura`: lo que hay en `rutina.json` para ese ejercicio (posturas, fases, material, vista y cómo se apoya).
- Los puntos son `[x, y]` en el plano del dibujo o **`[x, y, z]`** con un giro fuera de él (z hacia la cámara): la almeja,
  las rodillas que se abren del puente, los pies juntos del hollow, las manos juntas de las flexiones cerradas, las
  rodillas hacia delante del paso lateral, las espinillas y el antebrazo de las planchas laterales. La figura dibujada
  (respaldo sin WebGL) no usa z.
- `"apoya"` (en el ejercicio o en una postura): con qué toca el suelo el cuerpo, que el dibujo no dice porque no tiene
  grosor: `tronco` (tumbado), `lado` (de lado sobre el antebrazo), `rodillas`, `pies`. La figura 3D apoya esa parte por
  la piel, y además: con el tronco en el suelo inclina el cuerpo para apoyar espalda alta y pelvis y gira el cuello para
  apoyar la cabeza; a cuatro patas gira sobre las rodillas para que los brazos rectos lleguen; las manos y los pies
  apoyados tocan con la palma y la suela; brazos y piernas rectos en el dibujo siguen rectos; con las dos manos apoyadas,
  el codo toma el ángulo del dibujo.
- `"retro"`: grados de retroversión de la pelvis (tumbados con la lumbar pegada al suelo).

**Comprobaciones del paso 3** (`node ejercicios/comprobar3d.js [ejercicios]`; mide sobre la piel deformada del modelo 3D de
la app, hombre y mujer, al final de cada fase y a mitad de cada movimiento; las reglas están en `ejercicios/reglas3d.js` y
se prueban con `node --test ejercicios/reglas3d.test.js`):
- Cada apoyo toca su superficie (a menos de 2 cm) y si no hay apoyos, el cuerpo flota y falla.
- Ninguna otra parte toca el suelo ni un mueble (a menos de 1 cm), salvo las vecinas de un apoyo (el cuello con la cabeza,
  la mano con el antebrazo…).
- Nada atraviesa el suelo, los muebles ni la pared más de 1,5 cm (3 cm en las partes blandas que se aplastan: culo,
  muslo, barriga, pecho, lumbar).
- Se cumplen todas las `condiciones`.
- Las articulaciones no pasan de su rango (rodilla −5–150°, codo −5–155°, cadera −35–150°, hombro 0–185°); una rodilla
  doblada al revés sale negativa.
- Capturas de cada fase y de cada mitad, hombre y mujer, claro y oscuro, grande y miniatura → **visto bueno**
  (`docs/diseno/figura/3d.html?ex=…&g=m|f&theme=dark&mid&size=mini`).

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

## Estado de los 30 ejercicios (13 nov 2026)
**Publicados los 30.** Paso 1 (14 nov, E1), paso 2 y paso 3 (E2 y E3) comprobados: `node ejercicios/comprobar.js` y
`node ejercicios/comprobar3d.js` dan 0 fallos. Visto bueno: Claude, revisando las capturas, por encargo de Ignasi.

Qué se hizo con los apuntes del paso 1:
- Almeja: posturas 3D (cadera a 45°, rodillas a 90°, pies juntos al abrir, cabeza sobre el brazo, tronco apoyado).
- Tumbados (dead bug, hollow, crunch inverso, press, extensión, puentes): la espalda alta, la lumbar y la cabeza apoyan
  en hombre y mujer (antes flotaban 3–8 cm o se hundía la cadera).
- Plancha: la fase «Así NO» pasa a ser la postura de inicio correcta; el error queda en `errores`.
- Plancha lateral: «brazo de arriba al techo» pasa a clave; el antebrazo apunta hacia delante.
- Crunch inverso, flexiones cerradas, curl y press con banda: fuera las claves de dosis o nivel.
- Press con banda: las fases dicen «manos», no «mancuernas»; la banda pasa por debajo de la espalda.
- Fondos, flexiones inclinadas y remo con mancuerna: las manos llegan al mueble (antes no) y el brazo de apoyo no se dobla.
- Sin hacer (son del paso 1, no de técnica ni figura): renombrar los hollow, la dosis de `hollow_l` y `flex_incl`,
  la variante de almeja con mini banda, las etiquetas de la esquina en ángel y remo inclinado (D3).
- Límite que queda: abrir las rodillas en el puente es un giro 3D correcto, pero de perfil apenas se ve.

Apuntes del paso 1 (para la historia):

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
