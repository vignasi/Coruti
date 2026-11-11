# Rutina core

App Android personal con la rutina diaria de core y pelvis neutra y un widget para la pantalla de inicio.

- **Base (siempre):** psoas, puente de glúteo, dead bug, plancha con retroversión y gato-camello.
- **Módulos opcionales de fuerza suave:** Abdomen, Pecho, Espalda, Brazos y Glúteo, sin banco. Se activan antes de empezar, en la app o en el widget grande. Con «Alternar automáticamente», un día toca A (Abdomen + Pecho) y el siguiente B (Espalda + Brazos + Glúteo).
- **Intensidad** Suave / Normal / Fuerte por módulo: al terminar dices si te ha ido fácil, justo o demasiado y el módulo sube o baja de nivel la próxima vez.
- **Material:** mancuernas, gomas elásticas con asas, banda de glúteo y correas tipo TRX. Cada ejercicio usa la variante del material que tengas. De 1 a 6 **rondas**, todas iguales. Antes de empezar se ve la duración total.
- **Sin mirar el móvil:** tono agudo al subir o empujar y grave al bajar o volver en cada repetición, cuenta en voz alta opcional, «mitad» y pitidos finales en los ejercicios de mantener. Funciona igual en la app y desde el widget.
- Peso orientativo por rango y el último peso usado de cada ejercicio con mancuernas.
- **Ejercicios sueltos:** además de la rutina completa, eliges uno o varios ejercicios del catálogo (filtrables por zona y material), con repeticiones por ejercicio, rondas y descanso (4 × 12 reps y 75 s por defecto). Con «Alternar» se hacen en superserie (A, B, descanso); con uno solo, series normales. Las combinaciones se guardan como **favoritas** y empiezan con un toque. Cuenta para la racha sin cambiar la alternancia A/B.
- **Bandas elásticas sin asas:** remo inclinado y curl de bíceps con banda. Pones nombre a tus bandas (color o dureza) y la app recuerda cuál usas en cada ejercicio; si se queda floja o dura, la cambias durante la sesión y la próxima vez sale esa.

## Datos

Todos los ejercicios (dibujo por fases, textos, tiempos, variantes y módulos) están en
[`app/src/main/assets/rutina.json`](app/src/main/assets/rutina.json). Lo leen la página (`index.html`) y el código Kotlin
del widget y del servicio (`Rutina.kt`). El plan de la sesión se calcula igual en `index.html` (`buildPlan`) y en `Plan.kt`.
El bloque `catalog` de `rutina.json` da la zona, el material, las repeticiones o segundos por defecto y los lados de cada
ejercicio; lo usa solo la pantalla de ejercicios sueltos (`buildFree` en `index.html`), que se hace desde la app, no desde el widget.

## Descargar

Última versión: [rutina-core.apk](../../releases/latest/download/rutina-core.apk)

Cada cambio que se sube a `main` compila un APK nuevo y lo publica en *Releases*. Se instala encima del anterior sin perder la racha.
