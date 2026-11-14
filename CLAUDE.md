# Rutina core · instrucciones para Claude

Claude lee este archivo al empezar cada conversación en este repositorio, en la nube o en local.
Así basta con decir «haz B2» y no hace falta repetir el contexto.

## Qué es
App Android personal de entrenamiento (rutina de core, ejercicios sueltos, favoritas, widget, historial),
con cuenta en Supabase y subida a Strava con ejercicios y pulso del reloj Polar Vantage V3.
La usan Ignasi y su mujer, cada uno con su cuenta. Todo en **español** (código, comentarios, commits, textos).

## Cómo trabajamos
- El plan está en `ROADMAP.md`, por bloques (D diseño, B base técnica, C app, S Strava, P después).
  Una fase por conversación. Lo primero: leer `ROADMAP.md` y lo que toque de `docs/`.
- **Antes de tocar código:** investigar, preguntar lo que haga falta y proponer el plan. Decidir los caminos con el usuario.
- **Commits pequeños y separados**, en la rama que diga la sesión. Nunca romper: las rutinas, el widget,
  Strava y la compilación del APK en GitHub Actions. Compilar y pasar las pruebas antes de subir.
- **Al acabar:** marcar lo hecho en `ROADMAP.md` (con lo que falta que haga el usuario como «**Tú:**»),
  explicar cómo probarlo e instalar el APK, y dar el prompt de la fase siguiente.
- **Subir a GitHub una vez al final**, no después de cada commit.
- **GitHub Actions solo cuando es imprescindible:** para que el usuario tenga un APK que instalar. Claude compila y prueba
  en local (`gradle …`), nunca con Actions. Las ramas no compilan solas: si el usuario necesita el APK de una rama,
  se lanza «Compilar APK» a mano en esa rama, una sola vez. En `main` compila al fusionar si cambia algo del APK.
- **Entorno «Coruti»:** las conversaciones de este repo se abren en el entorno «Coruti», no en «Predeterminado». Solo ese tiene
  el token de Supabase (para aplicar migraciones, desplegar funciones y cambiar ajustes por `api.supabase.com`) y deja bajar
  el SDK de Android (`dl.google.com`) para compilar. Si una conversación está en otro, se cambia a «Coruti» antes de empezar.
- **Plan por olas** (`ROADMAP.md`): cada prompt dice su ola y qué zonas no puede tocar, porque van otras conversaciones a la vez.
- **Estado de las fases (lanzada / terminada):** está en la base de datos de la página del plan por olas,
  https://claude.ai/artifact/LtU45Cz1hmWwYEux1kRRix, no en el repo. Se lee con la herramienta `ArtifactData`
  (`action: list`, `collection: fases`; cada documento es una fase, p. ej. `B3`, con `lanzado` y `terminado`). Al empezar,
  mirar ahí en qué ola estamos. Al acabar una fase (pull request abierto y pruebas pasadas), marcarla `terminado: true` con
  `update` y el `if_version` leído. El usuario también la marca con los botones de la página, desde el móvil o el ordenador.
- Antes de empezar, mirar si `main` ha cambiado (otras fases se hacen a la vez en otras ramas) y fusionarlo si hace falta.
- El usuario prefiere respuestas directas: la verdad incómoda primero, nivel de confianza en las afirmaciones clave,
  sin elogios de relleno.

## Dónde está cada cosa
- `app/src/main/assets/`: la interfaz (WebView). `index.html` carga `app/motor.js` (datos, planes, historial),
  `app/app.js` (pantallas y acciones, con el diseño de D2) y `app/fig.js` (figura 3D). Catálogo y rutina: `rutina.json`.
- `app/src/main/java/com/vignasi/rutinacore/`: Android en Kotlin, sin librerías extra.
  `MainActivity` (WebView y puente `Android.*`), `Store` (ajustes y racha), `History` (historial; la forma de cada sesión
  está en su comentario), `Backup` (copia JSON), `Cloud` + `SyncLogic` (Supabase), `Widgets`, `WorkoutService`,
  `SessionRecorder`, `Plan`, `Free` (el widget monta las sesiones igual que la página).
- `app/src/test/`: pruebas de Kotlin (`gradle testReleaseUnitTest`).
- `supabase/migrations/`: esquema con RLS por persona. `supabase/functions/`: Edge Functions de Strava y Polar
  (`docs/strava.md`). Proyecto `jlyqtxihsorqczlxvbly`.
- `docs/supabase.md` (cuentas y nube), `docs/strava.md` (Strava y Polar), `docs/diseno/` (funcionalidades, sistema de
  diseño, validación, prototipo y figura 3D; la figura se copia al APK al compilar).
- `ejercicios/`: cómo se hace cada ejercicio (bloque E, `docs/diseno/4-ejercicios.md`): `fichas.json` (paso 1),
  `tecnicas.json` (paso 2; `a_rutina.js` pasa claves y textos de fase a `rutina.json`), `comprobar.js` (pasos 1 y 2) y
  `comprobar3d.js` + `reglas3d.js` (paso 3, figura 3D con Playwright): los dos tienen que dar 0 fallos.
  `a_sql.js` genera el SQL del catálogo `exercise_catalog`; `pose.js` y `ver.js` ayudan a ajustar posturas.
- `.github/workflows/build.yml`: en `main` (al fusionar cambios del APK) publica el APK en Releases; en una rama, solo a mano, lo deja como artefacto.

## Comandos
- Compilar y probar: `gradle assembleRelease testReleaseUnitTest` (necesita el SDK de Android 34 en `local.properties`).
- Ejercicios: `node ejercicios/comprobar.js`, `node ejercicios/comprobar3d.js` y `node --test ejercicios/reglas3d.test.js`.
- Pruebas del servidor: `node --experimental-strip-types --test supabase/functions/_shared/logica.test.ts`.
- Desplegar funciones: `npx supabase functions deploy conexiones polar-aviso --use-api --project-ref jlyqtxihsorqczlxvbly`.

## Reglas que no se rompen
- **Ningún secreto en el APK ni en el repo** (el APK es público en Releases). Las claves van en los secretos de Supabase;
  los tokens, en `connection_secrets`. En la app solo va la clave pública de Supabase.
- Sin cuenta, la app funciona igual, solo en el móvil.
- Polar Flow tiene que seguir recibiendo todas las sesiones del reloj.
- Un ejercicio nuevo o cambiado pasa por los tres pasos de `docs/diseno/4-ejercicios.md` (ficha, técnica, figura) y sus
  comprobaciones; sin el visto bueno del usuario no se publica.
- Si se añade un ejercicio a `rutina.json`, añadirlo también en `EJERCICIO_STRAVA` (`supabase/functions/_shared/logica.ts`).
- Las sesiones las escriben igual la página y el widget (misma forma de `history.json`).
