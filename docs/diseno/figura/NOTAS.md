# Figura del ejercicio · notas de D1

Archivos:
- `figura.js`: dibuja la figura. Lo usarán la app nueva (C1) y el prototipo (D2).
- `index.html`: página para elegir el estilo y la figura (hombre o mujer). Tiene el movimiento en grande y todas las miniaturas.
- `galeria.html`: revisión con capturas. Ejemplos: `?s=palos|redondo|persona&g=m|f&size=big|mini&theme=dark&ex=a,b&mid`.
- `figura3d.js`: la figura 3D (opción D). `Figura3D.crear({modelo, gender})` y luego `draw(canvas, ejercicio, t, clamp, opciones)`, igual que `Figura.draw`.
- `elegir.html`: página para elegir en el móvil entre la dibujada y la 3D (o verlas juntas), hombre o mujer.
- `3d.html`: revisión con capturas de la 3D. Ejemplos: `?g=m|f&size=big|mini&theme=dark&ex=a,b&mid&c=2`.
- `three/`: three.js r160 (MIT), solo lo que usa la figura 3D, para que funcione sin conexión. `three/` tiene su propio
  `.gitignore` porque el de la raíz ignora todas las carpetas `build/` (por eso faltaba y `3d.html` no cargaba).
- `widget/`: imágenes de la figura 3D para el widget y cómo se hacen.

## Decisión (noviembre de 2026)
**Figura 3D (opción D), con hombre y mujer**: cada persona elige en Ajustes. La dibujada (`figura.js`) se queda porque la 3D
usa su geometría (`Figura.solve`, etiquetas) y como respaldo si un móvil no tiene WebGL.

## Cómo funciona

`Figura.draw(canvas, ejercicio, t, clamp, {style, gender, key, labels, text, pt, dark, bg})`

1. **Geometría común a los tres estilos.** Primero se interpola la postura de `rutina.json`. Después se decide la vista:
   - Perfil, en casi todos los ejercicios.
   - De frente: paso lateral, ángel en pared, plancha lateral (también con rodillas) y almeja. En estos dos últimos la persona está tumbada de lado y mira a la cámara.

   Luego se colocan pies y manos:
   - **Pies:** su dirección sale de hacia dónde dobla la rodilla. Se elige el giro del tobillo que deja la suela apoyada en el suelo, o en la silla o el sofá, sin atravesarlo. Por ejemplo: planos en el puente, sobre el empeine en gato y psoas, y hacia arriba sentado con la banda.
   - **Plancha y flexiones:** van de puntillas. El tobillo se sube lo justo para que la punta toque el suelo.
   - **Manos:** planas cuando se apoyan en el suelo o en un mueble. Cerradas cuando sujetan banda, mancuerna, toalla o correa.
2. **Pintores.**
   - En `persona`, las piezas del mismo color se pintan juntas: primero todos los contornos y luego todos los rellenos. Por eso no se ven juntas en rodillas, codos, hombros ni cadera; solo los bordes reales de la ropa.
   - En `palos` y `redondo`, un halo del color del fondo separa lo de delante de lo de detrás. Ese halo no aparece en cuello, hombro ni cadera.
   - Lo que toca el suelo se aplasta contra él, sin atravesarlo.
3. **Encuadre.** La figura llena el dibujo. En grande caben además las flechas.
4. **Etiquetas, solo en grande, como en la app actual:**
   - punto ámbar que late en la zona que trabaja;
   - flecha del movimiento;
   - «AQUÍ ESTIRA»;
   - «BANDA», colocada fuera del cuerpo y sin tapar la zona que trabaja.

## Para mover a `rutina.json` cuando se construya C1 (aquí no se toca)
- Añadir `"view":"frente"` en `paso_lateral`, `angel`, `plancha_lat`, `plancha_lat_k` y `almeja`. Hoy esa lista está en `figura.js` (`VIEW`).
- En plancha y flexiones, los tobillos están a la altura del suelo (y = 100). La figura los sube al dibujar para ponerse de puntillas. Sería mejor guardar en los datos la postura con el tobillo unos 5 puntos más alto.
- Quitar los 4 ejercicios con correas TRX (`press_trx`, `remo_trx`, `curl_trx`, `ext_trx`), según lo decidido en funcionalidades. Se dibujan bien, pero en la página llevan la nota «Con correas: se quita».
- Algunas flechas pasan por encima del brazo o la pierna, por ejemplo en flexiones y en el puente con apertura. Se arregla moviendo `arrow` en los datos.
- (D3) En el reproductor el encuadre se agranda hasta que la figura **y sus etiquetas** llenan el ancho. En el remo inclinado
  («JUNTA ESCÁPULAS») y el ángel (flecha) las etiquetas están en la esquina del dibujo y no dejan agrandar a la persona.
  Acercar esas etiquetas al cuerpo en `figura.js` (`labels`) haría que salieran más grandes.

## Límites conocidos (no son fallos del dibujo)
- En miniatura, los ejercicios de pie se ven más pequeños, porque la figura alta cabe a lo alto en un hueco apaisado. Si molesta, D2 puede usar una miniatura vertical para esos ejercicios.
- La figura es 2D sobre poses 2D. Las vistas de frente de los tumbados de lado (almeja) se entienden, pero no son una perspectiva real.

## Investigación: imágenes o vídeos generados con IA (sin decidir)
Resumen de la búsqueda de noviembre de 2026. Los precios salen sobre todo de agregadores: hay que confirmarlos en las páginas oficiales.

| | Imágenes: 2 por ejercicio y sexo | Vídeo en bucle de 4 s por ejercicio y sexo |
|---|---|---|
| Servicios viables | Nano Banana Pro (Gemini 3 Pro Image, ~0,13 $/img, hasta ~14 referencias), FLUX.2 (~0,03 $/MP, 8–10 referencias), GPT Image 2 | Kling 3.0 (~0,08 $/s; licencia amplia a favor de Kling), Veo 3.1 Fast (~0,10 $/s), Runway Gen-4 Turbo (~0,05 $/s) |
| Coste para 34 ejercicios, con reintentos | ~15–60 $ | ~80–100 $ (más las imágenes de inicio y fin) |
| Coste para 100 ejercicios | ~50–180 $ | ~235–280 $ (Veo estándar ~1.100 $) |
| Peso en la APK (estimado) | ~6 MB (34) / ~18 MB (100) en WebP a 720 px | ~17–27 MB (34) / ~50–80 MB (100) en H.264 a 480p |
| Ritmo de la animación | Lo sigue marcando la app (fundido entre las dos imágenes) | Lo impone el vídeo |

- **La misma persona en todos:** se consigue con una ficha del personaje (frente y perfil) como referencia en cada imagen, más un esqueleto dibujado desde las poses de `rutina.json` para fijar la postura (ControlNet OpenPose o imagen de pose). Aun así puede variar, y hay que revisarla una por una.
- **Riesgos:** técnica incorrecta (es un riesgo para quien entrena); manos, pies y bandas deformados; modelos que se retiran a mitad de proyecto (GPT Image 1/1.5, Sora); precios que cambian; protección de derechos de autor incierta para imágenes generadas solo por IA. Midjourney no sirve: no tiene API y prohíbe automatizar.
- **Opciones para decidir contigo:**
  - **A.** Seguir con la figura dibujada por la app (esta). Coste 0, no pesa, funciona sin conexión y es igual en todo.
  - **B.** Dos imágenes generadas por ejercicio y sexo, alternadas con el ritmo actual. Es la opción más barata y ligera de las generadas.
  - **C.** Vídeo en bucle hecho a partir de las imágenes de B. Cuesta y pesa 3–5 veces más, y tiene más riesgo de deformaciones.
  - Probar B o C con 3–5 ejercicios antes de comprometerse.
- **D. Modelo 3D de persona movido por la app.** La prueba está en `3d.html` y usa `Figura.solve`. Los huesos del modelo se colocan con las mismas posturas de `rutina.json`, con los pies y las manos ya resueltos. Funciona con los 34 ejercicios sin tocar los datos. La anatomía es correcta siempre, es la misma persona en todo, la luz y la sombra son reales, y el ritmo lo sigue marcando la app.
  - Coste: three.js pesa ~0,7 MB y cada modelo 1–4 MB (menos comprimido).
  - Los modelos de la prueba (Xbot y Michelle de Mixamo, tomados de los ejemplos de three.js) **no sirven para la app**: el maniquí no es una persona y Michelle es una bailarina de dibujos. Además, Mixamo no deja redistribuir sus modelos sueltos, por eso no están en el repo.
  - Para la app ya están hechos un hombre y una mujer propios (ver «Modelos 3D propios»). Las opciones que había:
    - MakeHuman: gratis, lo exportado es CC0. Hay que crearlos en su programa de escritorio.
    - Mixamo: gratis con cuenta de Adobe; puede ir dentro de la app, pero no en un repo público.
    - Comprar un modelo con licencia comercial.
  - El widget de Android no puede usar 3D: necesitaría imágenes renderizadas antes.
- Claude no genera imágenes ni vídeo por sí mismo: cualquiera de estas opciones necesita una cuenta en el servicio externo.

## Modelos 3D propios (hechos en D1)
- `modelos/persona_m.glb` (1,6 MB) y `modelos/persona_f.glb` (2,0 MB). Salen de MakeHuman (MPFB2, **CC0**: se pueden meter en la app y en un repo público) con `modelos/crear_modelos.py`, que es reproducible: se ejecuta con Blender como módulo de Python, sin pantalla. Cómo, al principio del script.
- Esqueleto con nombres de Mixamo: el mismo código de `3d.html` mueve estos modelos y los de prueba.
- La ropa (camiseta o camiseta de tirantes, pantalón corto o mallas, zapatillas) está **pintada sobre el cuerpo** con algo de volumen. Sigue cualquier deformación y nunca lo atraviesa. Pelo: el cuero cabelludo con volumen y, en ella, una coleta unida a la cabeza.
- Colores en materiales separados (`piel`, `top`, `abajo`, `zapa`, `suela`, `pelo`, `ojos`): se cambian sin tocar la forma.
- Deformaciones ya dentro, aún sin usar: `complexion_mas`, `complexion_menos`, `musculo_mas`, `musculo_menos`. Cada una combina peso y músculo de MakeHuman. La complexión se calcula para que él y ella cambien **lo mismo de cintura** (+13 % / −9 %): MakeHuman reparte el peso distinto y en ella iba casi todo a la barriga. En ella, el pecho cambia un poco con la complexión. Músculo, ampliado ×1,3–1,6. A los brazos les llegan menos (si no, al adelgazar parecen de alambre), y «más delgado» también quita algo de músculo (si no, queda pecho de culturista con cintura fina). Prueba: `3d.html?m=persona_f&morph=complexion_mas:1&piel=%238D5524&pelo=%23111111`.
- `3d.html`, además de las posturas:
  - dobla brazos y piernas lo justo para que manos y pies apoyados lleguen al suelo o a la silla (el cuerpo 3D tiene grosor y el dibujo no);
  - pone las manos planas al apoyarse;
  - dibuja sillas, sofá y pared.
- Bordes de la ropa y del pelo: `modelos/pulir_ropa.py` corta la malla por superficies suaves (escote, mangas, cintura, bajo del
  pantalón, zapatillas, tirantes, nacimiento del pelo, elipse alrededor de la oreja, línea recta de la nuca) y decide cada cara con
  esas mismas superficies. La zona de cada corte se pasa antes a triángulos (el .glb va en triángulos igualmente, no pesa más),
  así ninguna cara queda cruzada sin partir. El volumen de la ropa y del pelo lo pone el pulido; en las esquinas, en proporción.
  `crear_modelos.py` lo llama antes de exportar; también se puede pasar sobre los .glb ya hechos (solo necesita `pip install bpy==5.3.0`).
- **Generados desde cero en noviembre de 2026** con `crear_modelos.py` entero (bpy 5.3.0 y MPFB2 de GitHub, 17 s los dos).
  Comparados con `3d.html` y primeros planos: el cuerpo, igual (menos del 0,3 % de píxeles cambian en miniatura); mejor la cabeza
  (antes media oreja tenía color de pelo, había un parche cuadrado de piel y, en él, la nuca en sierra), sin dientes en el tirante
  de ella ni en el cuello de la camiseta de él, y sin el pico detrás de la oreja. Dos ejecuciones dan la misma forma, pero no el mismo
  archivo byte a byte (el orden de algunos vértices cambia).
- Pesos: `persona_m.glb` 1,6 MB, `persona_f.glb` 2,0 MB (con las 4 deformaciones). three.js r160 con el cargador, ~0,8 MB.

## Imágenes para el widget (D1)
El widget de Android no puede mostrar 3D. Hoy pinta la figura de cada **fase** (`PoseRenderer.render(ex, phaseIdx)`), así que hay
una imagen por fase y no dos por ejercicio: 32 ejercicios de 2 fases, psoas con 3 y dead bug con 4 → **71 por sexo**.
- `widget/{m,f}/{claro,oscuro}/<ejercicio>_<fase>.webp`: la postura al final de cada fase, sin etiquetas, 400 × 249 px (el ancho
  que usa hoy el widget), WebP con fondo transparente. Oscuro lleva la luz de contorno y los muebles oscuros.
- **Peso:** ~6 KB cada una; ~430 KB por sexo y tema; **1,7 MB las 284**. Con un solo tema, 0,9 MB.
- Cómo se hacen (24 s): servir la raíz del repo (`python3 -m http.server 8000`) y `node docs/diseno/figura/widget/hacer_imagenes.js`.
  La página es `widget/hacer.html` (`?g=m|f&theme=dark&w=400&q=0.8&ex=a,b`). Hay que rehacerlas si cambian modelos o posturas.
- **Ojo para D2/C2:** el fondo actual del widget es `#1E6B74`, el mismo color que la camiseta: sobre él, la camiseta de ella
  desaparece. El widget tiene que ir sobre fondo claro u oscuro (los de la app), o cambiar el color de la ropa.
- Si se personaliza la figura (idea de más abajo), el widget necesitaría imágenes de esa figura: hacerlas en el móvil al cambiarla.

## Peso de la figura 3D en la APK
three.js ~0,8 MB + modelos 3,6 MB + imágenes del widget 0,9–1,7 MB ≈ **5,3–6,1 MB** sin comprimir (la APK comprime algo más). [estimado]

## Figura 3D completa (D1)
- **Material:** banda grande como bucle cerrado de la mano al pie (o por debajo de la espalda en el press), mini banda plana
  alrededor de los dos muslos sobre las rodillas, mancuernas con el asa en el plano del dibujo (como la dibujada), toalla retorcida
  bajo el pie, correas (se quitan en C1), y sillas, sofá y pared.
- **Manos:** cerradas alrededor del asa al sujetar; planas al apoyarse.
- **Contactos:** la mano o el pie apoyados llegan a su sitio (con los largos reales de los huesos); antebrazos planos en la plancha;
  cada mueble se coloca respecto a lo que se apoya en él y de fondo centrado en esa mano o pie. En fondos el cuerpo cuelga de las manos:
  la cadera queda a la altura del dibujo respecto a la silla y las piernas se doblan para llegar al suelo.
- **Etiquetas** (solo en grande): las mismas de la dibujada (`Figura.labels`), pegadas a los puntos del cuerpo 3D.
- **Encuadre** fijo por ejercicio (no salta al animar), con el mismo tamaño de figura que la dibujada.
- **Oscuro:** luz de contorno para que la ropa oscura no se pierda en el fondo.
- **Remo a una mano** (también en la dibujada): las rodillas casi rectas y un poco hacia atrás en los datos decidían hacia dónde mira
  la persona y salía boca arriba con los pies al revés. Ahora deciden las manos y la rodilla se dibuja un poco doblada.
  Para C1: en `rutina.json`, poner `k1` y `k2` de `remo_db` unos 4 puntos más adelante (x menor).
- Falta para la app: abdominales marcados (mapa de relieve). Las imágenes del widget ya están (ver «Imágenes para el widget»).

## Idea para más adelante: que cada persona personalice su figura (solo con 3D)
Se podrían cambiar la complexión, lo marcado del músculo y del abdomen, el color de piel, el pelo y la ropa.
- **Cómo:** con *morph targets* (deformaciones guardadas en el modelo) y deslizadores; color de piel y ropa cambiando el material; pelo cambiando una pieza por otra.
- **Peso:** cada deformación ocupa poco (del orden de 100 KB) [estimado].
- **Condición que hay que fijar ya, al elegir el modelo de D:** que sea un modelo con deformaciones exportables, como MakeHuman o MPFB en Blender. Con un modelo cerrado (Mixamo) esta idea no se puede hacer.
- **Riesgo técnico:** la ropa tiene que deformarse igual que el cuerpo, si no lo atraviesa.
- **Widget:** se haría guardando imágenes de la figura personalizada al cambiarla.
- **Textos:** neutros y sin juicio («complexión», no «gordito»). Es opcional y no está ligado al peso real salvo que la persona lo pida.
