# Figura del ejercicio · notas de D1

Archivos:
- `figura.js`: dibuja la figura. Lo usarán la app nueva (C1) y el prototipo (D2).
- `index.html`: página para elegir el estilo y la figura (hombre o mujer). Tiene el movimiento en grande y todas las miniaturas.
- `galeria.html`: revisión con capturas. Ejemplos: `?s=palos|redondo|persona&g=m|f&size=big|mini&theme=dark&ex=a,b&mid`.

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
  - Para la app haría falta un hombre y una mujer con ropa de deporte. Opciones:
    - MakeHuman: gratis, lo exportado es CC0. Hay que crearlos en su programa de escritorio.
    - Mixamo: gratis con cuenta de Adobe; puede ir dentro de la app, pero no en un repo público.
    - Comprar un modelo con licencia comercial.
  - El widget de Android no puede usar 3D: necesitaría imágenes renderizadas antes.
  - Faltan por hacer en 3D el material (bandas, mancuernas, silla) y las etiquetas.
- Claude no genera imágenes ni vídeo por sí mismo: cualquiera de estas opciones necesita una cuenta en el servicio externo.

## Idea para más adelante: que cada persona personalice su figura (solo con 3D)
Se podrían cambiar la complexión, lo marcado del músculo y del abdomen, el color de piel, el pelo y la ropa.
- **Cómo:** con *morph targets* (deformaciones guardadas en el modelo) y deslizadores; color de piel y ropa cambiando el material; pelo cambiando una pieza por otra.
- **Peso:** cada deformación ocupa poco (del orden de 100 KB) [estimado].
- **Condición que hay que fijar ya, al elegir el modelo de D:** que sea un modelo con deformaciones exportables, como MakeHuman o MPFB en Blender. Con un modelo cerrado (Mixamo) esta idea no se puede hacer.
- **Riesgo técnico:** la ropa tiene que deformarse igual que el cuerpo, si no lo atraviesa.
- **Widget:** se haría guardando imágenes de la figura personalizada al cambiarla.
- **Textos:** neutros y sin juicio («complexión», no «gordito»). Es opcional y no está ligado al peso real salvo que la persona lo pida.
