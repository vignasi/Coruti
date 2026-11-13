# Rediseño · 3. Validación del prototipo (D3)

Revisión del prototipo (`docs/diseno/prototipo/`, con la figura 3D de D1) con tres skills de diseño: crítica heurística,
accesibilidad (WCAG 2.2 AA, claro y oscuro) y textos. Además, cuatro pruebas que pediste: el reproductor a 1–2 m,
la figura recortada en los ejercicios de pie, el rendimiento de las miniaturas 3D y el widget con el fondo elegido (**A**).
Fecha: 12 nov 2026. Severidad de 0 (nada) a 4 (impide la tarea). **Queda sin fallos de severidad 3 o 4.**

Parte de la revisión de la rama `claude/vigilant-lovelace-hb4acy` (hecha con la figura en un hueco): sus arreglos ya están
en este prototipo y se resumen al final; lo que aquí sigue se ha comprobado otra vez con la figura 3D.

Cómo se ha probado: Chromium sin pantalla (Playwright) a 360 × 640, 360 × 740 y 412 × 915, con WebGL por software
(SwiftShader). Los scripts están fuera del repo; lo que miden se explica en cada apartado.

## 1. Pruebas que pediste

### 1.1 Reproductor a 1–2 m
Se mide el alto de la mayúscula de cada texto (1 dp ≈ 0,159 mm; mayúscula ≈ 0,7 del tamaño de letra) y el ángulo que ocupa
a 1 y 2 m. Referencia: unos 16′ es lo mínimo para leer sin esfuerzo y 20–22′ lo cómodo (ISO 9241-303). [Probable: el alto de
mayúscula de Atkinson Hyperlegible es aproximado y cada móvil tiene su densidad real]

| Texto | Tamaño | A 1 m | A 2 m | Veredicto |
|---|---|---|---|---|
| Cantidad (`12 reps`, `0:30`) antes | 64–104 (360 × 640: 70) | 27–38′ | **13–19′** | En móviles pequeños, justo o por debajo a 2 m |
| Cantidad después (`p2` 72–120) | 360 × 640: 80 · 360 × 740: 93 · 412 × 915: 107 | 31–41′ | **15–21′** | Se lee a 2 m salvo en pantallas muy bajas (15′, al límite) |
| Nombre del ejercicio (`t4`, 28) | 28 | 11′ | 5′ | No se lee desde el suelo: se lee al acercarte a tocar. De lejos manda la figura |
| Clave, ritmo, «Luego» (`t2`/`t1`) | 14–16 | 5–6′ | 3′ | Solo de cerca; lo de lejos lo dan los tonos y la voz |
| Rayas de progreso | 6 → **8** px | — | 2′ → 3′ | Se ve que avanzan; el número de ronda va además en texto arriba |

Encontrado y arreglado:
- **Sev. 3 · «Prepárate» y descanso no se distinguían de la serie a 2 m.** Solo cambiaba el color de la cifra (de `#13292C` a
  `#1E6B74`: 2,5:1 entre ellos, de lejos parecen iguales) y una palabra de 16 px. Un «5» de «Prepárate» se confundía con «5 reps».
  Ahora **toda la pantalla cambia a `accion-suave`** en descanso y «Prepárate» (texto encima: 5,3:1 en claro, 5,3:1 en oscuro),
  y «PREPÁRATE · 30 S» va en el mismo estilo que «DESCANSO».
- **Sev. 2 · Cantidad pequeña en móviles de 360 dp.** `p2` pasa de 64–104 a **72–120** (`min(26vw, 12,5vh)`). En 360 × 640 la
  figura sigue teniendo ~220 dp de alto y nada se sale de la pantalla.
- **Se queda así, a propósito:** el nombre en 28 sp. Más grande se come la figura, que es lo que se entiende de lejos.
  Para C1: que la voz diga el nombre del ejercicio en «Prepárate» y al empezar cada serie (ya está la voz para contar).

### 1.2 Figura recortada en los ejercicios de pie
D2 recortaba un **15 % fijo por cada lado** a los de pie para que la persona saliera más grande. Se midió fotograma a fotograma
(6 s de bucle, hombre y mujer, 360 × 740 y 412 × 915) qué quedaba fuera: en **7 de los 8** ejercicios de pie se salía algo
(sin contar los 4 de correas, que se quitan; con ellos, 10 de 12).

- **Sev. 4 · Se cortaba la etiqueta de la zona que trabaja**: «JUNTA ESCÁPULAS» en el remo inclinado (desaparecía entera),
  «GLÚTEO DE LADO» en el paso lateral, la flecha del ángel. Es justo lo que el reproductor tiene que enseñar.
- **Arreglo:** el encuadre se calcula por ejercicio. La primera vez que sale, se mide qué parte del ancho ocupan la figura,
  el material y las etiquetas durante todo el bucle, y se agranda hasta que eso llena el ancho (sin pasar del alto).
  Se mide con la figura dibujada (`figura.js`: misma geometría, encuadre y etiquetas que la 3D, pero sin leer de la GPU)
  y a trozos, para no bloquear el toque; el ejercicio siguiente se mide mientras haces el actual.
- **Comprobado con la figura 3D real** (hombre y mujer, 360 × 740, 12 ejercicios, 6 s de bucle): **ninguna etiqueta fuera**.
  Solo asoma la punta de la zapatilla de él en fondos (sev. 1). Cuánto crece la persona respecto a verla entera:

  | Ejercicio | Tamaño | | Ejercicio | Tamaño |
  |---|---|---|---|---|
  | Curl con toalla | ×1,55 | | Remo inclinado | ×1,17 |
  | Fondos | ×1,47 | | Curl con mancuerna | ×1,17 |
  | Ángel en pared | ×1,34 | | Curl y paso lateral con banda | ×1,00 (etiquetas a los dos lados) |
  | Psoas | ×1,27 | | Tumbados (puente, plancha, flexiones) | ×1,00–1,02 (ya llenan el ancho) |

- **Para C1** (en `figura/NOTAS.md`): en el remo y el psoas, las etiquetas están en la esquina del dibujo y no dejan agrandar
  la figura. Mover esas etiquetas hacia el cuerpo en `figura.js` daría más tamaño en el reproductor.

### 1.3 Rendimiento de las miniaturas 3D
**La verdad incómoda: aquí no se puede medir un móvil normal.** El ordenador de pruebas no tiene GPU y dibuja el 3D por
software (SwiftShader): el reproductor va a 3 fps **también con el D2 sin tocar**, así que esas cifras hablan de este ordenador,
no de tu móvil. Lo que sí se puede afirmar:

| Medida (este ordenador) | Resultado | Qué significa |
|---|---|---|
| 30 miniaturas de Ejercicios, CPU normal | 2,4 s desde que abre la página; la primera a los 0,6 s | Se dibujan una a una, cada una en su tarea: la lista se puede mover mientras |
| Lo mismo con la CPU 4 veces más lenta (≈ móvil medio), a densidad 1 y 2,6 | 2,7–2,8 s | La CPU no es el cuello de botella: lo es la GPU |
| Tareas largas al cargar (CPU ÷4) | 7, la mayor de 0,4 s | Leer los dos modelos (1,6 y 2,0 MB); pasa una vez |
| Volver a Ejercicios | Sin dibujar: se copian de la caché | [Seguro: leído en el código] |
| Una miniatura (pantalla «Rendimiento») | 60 ms | Con GPU de verdad debería bajar mucho [Especulando] |
| Un fotograma del reproductor, 536 × 334 px | 71 ms (14 fps) | Ídem. En el móvil el lienzo es mayor (densidad 2,6: ~1040 × 650 px) |
| Memoria JS | 26–47 MB | Normal para una página con dos modelos |

Para medirlo de verdad: **pantalla nueva «Rendimiento en este móvil»** en el prototipo (Pantallas → Referencia). Mide en tu
móvil una miniatura, un fotograma del reproductor y un encuadre, y dice si está bien (miniatura < 60 ms, reproductor ≥ 30 fps).
Si el reproductor no llega a 30 fps, para C1: limitar la densidad del lienzo a 2, quitar el antialias por encima de 2 y
bajar el tamaño del mapa de sombras. No hace falta tocar el diseño.

### 1.4 Widget con el fondo A (elegido)
- Fondo `capa` (blanco / `#16262A`) según el tema del móvil, con las imágenes WebP de D1 de cada tema. La camiseta (`#1E6B74`)
  se ve en los dos: en claro, 6,2:1 sobre blanco; en oscuro la separa la luz de contorno que ya llevan las imágenes de oscuro.
  Comprobado con hombre y mujer en las capturas (la de ella, que con el fondo de hoy desaparecía, se ve entera).
- Textos y botones del widget: los mismos tokens que la app, sin fallos de contraste en los dos temas (axe).
- Pantalla «Fondo del widget»: A marcada como **Elegida** y B como **Descartada**; queda como registro de la decisión.
- Sev. 2 (para C2): la persona de pie sale pequeña en la imagen apaisada; recortar los lados de la imagen en los de pie
  (no llevan etiquetas, así que se puede) o usar un hueco más cuadrado. Las imágenes de B (`prototipo/widget-ropa-coral/`)
  ya no hacen falta para la app; se dejan solo para esa pantalla.

## 2. Crítica heurística (Nielsen y leyes de UX)

Pasada completa de las 36 pantallas con el método de la skill (primer vistazo de 5 s, 10 heurísticas, leyes de UX, exceso de
pasos, arquitectura de la información). Lo de la rama anterior que seguía valiendo ya estaba arreglado; lo nuevo, con la figura 3D:

| # | Fallo | Principio | Sev. | Arreglo |
|---|---|---|---|---|
| 0 | **La copia publicada de D2 nunca cargaba la figura 3D**: enseñaba siempre la dibujada (la ruta del módulo `figura/figura3d.js` no valía para `import()`). Lo que viste en el móvil en D2 no era la 3D | Visibilidad (H1) | 4 | Ruta completa; comprobado sirviendo la copia publicable: carga los modelos glTF y dibuja en 3D |
| 1 | El recorte fijo de los de pie cortaba la etiqueta de la zona que trabaja (ver 1.2) | Visibilidad (H1) | 4 | Encuadre medido por ejercicio |
| 2 | Descanso y «Prepárate» iguales que la serie vistos a 2 m (ver 1.1) | Visibilidad (H1), Von Restorff | 3 | Fondo `accion-suave` en toda la pantalla |
| 3 | Cantidad por debajo de 16′ a 2 m en móviles de 360 dp | Fitts / distancia de uso | 2 | `p2` 72–120 |
| 4 | Mientras carga el 3D, la ficha y el reproductor enseñan la figura dibujada y luego cambian a la 3D | Coherencia (H4) | 2 | Se queda en el prototipo (carga de red). En C1 los modelos van dentro del APK: medir allí y, si se nota, enseñar «Cargando la figura…» hasta que esté la 3D |
| 5 | En el reproductor la figura cambia de tamaño entre ejercicios (cada uno con su encuadre) | Coherencia (H4) | 1 | A propósito: la alternativa era cortar etiquetas o verla pequeña siempre |
| 6 | Widget: la persona de pie sale pequeña en la imagen apaisada (≈100 dp de alto en el grande) | Jerarquía | 2 | Para C2: en los de pie, recortar los lados de la imagen (las del widget no llevan etiquetas, se puede) o hueco más cuadrado |
| 7 | El widget en marcha enseña la cantidad en 28 sp: no se lee desde el suelo | Distancia de uso | 1 | El widget se usa con el móvil en la mano o cerca; para lejos está la app. Se apunta, no se cambia |

Revisado y bien: una acción principal por pantalla (Empezar, Guardar y volver, Crear plan); tocar en cualquier sitio = hecho
cumple Fitts a 1–2 m; deshacer con deslizar a la derecha; parar detrás de pausa y confirmación (H5); rayas como progreso
(gradiente de meta); pantallas vacías con siguiente paso; cuatro pestañas (Hick); «Tú» junta lo que se toca una vez.

## 3. Accesibilidad (WCAG 2.2 AA, claro y oscuro)

Herramienta: **axe-core 4.10** (reglas WCAG 2.0/2.1/2.2 A y AA) sobre las 36 pantallas más 7 estados (reproductor en
«Prepárate» y en descanso, hojas de pausa, parar, banda, personas y peso): **43 casos × 2 temas = 0 fallos.**
Más revisión a mano:

| # | Comprobado | Criterio | Resultado |
|---|---|---|---|
| 1 | Fondo de descanso y «Prepárate» (`accion-suave`): texto encima | 1.4.3 | 5,3:1 (claro: `#4A5F61` sobre `#D5E6E6`; oscuro: `#9DB3B1` sobre `#173D42`); cifra en `accion` 4,8:1 / 4,9:1 |
| 2 | Miniaturas dentro de un botón anunciaban el nombre dos veces | 1.1.1 | Arreglado: la figura pequeña es decorativa (`aria-hidden`); la grande sigue con «Movimiento de …» |
| 3 | Rayas pendientes en `linea` sobre blanco (1,5:1) | 1.4.11 | Se queda: el progreso va además en texto («Ronda 1 de 3 · ejercicio 1 de 6») y las rayas son decorativas (`aria-hidden`) |
| 4 | Cambio de fase anunciado | 4.1.3 | «Prepárate» y «Descanso» con `aria-live` |
| 5 | Reproductor con teclado y lector | 2.1.1 | Botón real «Hecho: pasar al siguiente», flechas izquierda/derecha; pausa de 48 dp |
| 6 | Movimiento | 2.3.3 | Con «reducir movimiento», la figura queda quieta en la postura clave y el widget no alterna |
| 7 | Tocables | 2.5.8 | Todo ≥ 24 px; lo de la app ≥ 48 dp salvo el pulso del reproductor (40 dp, se puede tocar pero no hace falta) |

Pendiente para C1 (no se puede comprobar en un prototipo web): TalkBack en un móvil de verdad y letra del sistema al 130 % y
200 % (por eso los tamaños van en sp), sobre todo que el reproductor siga cabiendo con letra grande.

## 4. Textos

Pasada con la skill de textos (útil, conciso, conversacional, claro; errores con causa y salida; mismo nombre para lo mismo):

| Antes | Después | Por qué |
|---|---|---|
| «Prepárate · 30 s» en letra pequeña gris | «PREPÁRATE · 30 S» como «DESCANSO» | Mismo aviso de fase para lo mismo |
| Polar: «Sin conectar · pulso en directo disponible» | «Sin conectar · el pulso en directo funciona sin cuenta» | Parecía que hacía falta conectarlo para el pulso |
| Lector de pantalla en las miniaturas: «Figura de Dead bug, Dead bug, 16 reps» | «Dead bug, 16 reps» | El nombre salía dos veces |
| Widget: «fondo propuesto (opción A…)» / «Propuesta» | «fondo elegido (A…)» / «Elegida»; B «Descartada» | Ya está decidido |

Revisado y bien: botones con verbo (Empezar, Guardar y volver, Enviar a Strava, Crear plan); errores de Strava con qué pasó y qué
hacer; confirmación de parar con su consecuencia («Se guarda como incompleta… No cuenta para la racha»); pantallas vacías con
el siguiente paso; peso sin juicios («−1,2 kg en 8 semanas»); personalización con «complexión», nunca «gordito».

Se queda así: «reps» y «dead bug» (es como se dice en el gimnasio y en Freeletics); «Z3» junto al pulso (zona, se explica en
«Probar pulso»).

## Lo que venía de la revisión anterior (rama `claude/vigilant-lovelace-hb4acy`)
Ya estaba arreglado en el prototipo y se ha vuelto a ver con la figura 3D: favorita del widget con ★, hoja de cada día del plan,
estados de Strava con qué pasó y qué hacer, pantallas vacías, «Sin señal» del pulso, carreras que abren Strava, «Ver la sesión»
visible en la tarjeta Hoy, Atrás en Entrar, misma duración en Hoy y al terminar, verde «bien» `#276B43`, bordes de interruptor y
días en `tinta-2`, hojas como diálogo con Escape y foco dentro, `lang=es`. Reproductor: tocar = siguiente, deslizar a la derecha =
anterior, sin botones de parar ni saltar a la vista.

## Lo que falta (tu visto bueno en el móvil)
En el enlace de siempre (https://claude.ai/artifact/SozxjV2P1cQ8F2uUFU8rpL):
1. **Reproductor desde el suelo a 1–2 m**: ¿lees la cantidad? ¿Distingues descanso y «Prepárate» por el fondo? ¿Te basta con
   la figura para saber qué ejercicio es (el nombre no se lee de lejos)?
2. **Los de pie** (remo inclinado, curl, paso lateral, ángel, fondos): ¿la persona sale bastante grande? En curl y paso lateral
   no crece porque sus etiquetas ocupan todo el ancho.
3. **Pantallas → Rendimiento → Medir** en tu móvil, y mándame las cifras con el modelo del móvil.
4. **Widget** (Pantallas → Widget grande y pequeño), en claro y en oscuro, hombre y mujer.
5. Si las cuatro pestañas y lo que hay en «Tú» te encajan.

Si todo va bien, D3 queda cerrado y empieza C1.
