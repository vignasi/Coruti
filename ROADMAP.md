# Plan del proyecto · Rutina core

Una fase por conversación. Cada conversación empieza con el prompt de la fase,
pregunta lo que haga falta antes de tocar código, trabaja en commits pequeños,
marca aquí lo hecho y termina dando el prompt de la fase siguiente.

Cada conversación nueva parte de `main`; si no se fusiona, empieza sin los cambios anteriores.
Qué se puede hacer a la vez y en qué orden: ver «Plan a partir de aquí».

## Estado (13 nov 2026)

**Dónde estamos:** todo lo construido está en `main` (APK 1.0.31 en Releases); falta que lo pruebes en el móvil
y que pongas en marcha Supabase, Strava y Polar. Lo siguiente que se programa es B2 y C2, a la vez.

**Hecho y en `main`:** Fases 0, 1 y 1b · D1, D2, D3 · B1 (cuentas y nube) · C1 (app nueva) · S1 (Strava y Polar; servidor desplegado
y migraciones aplicadas) · CLAUDE.md y Actions solo cuando hace falta un APK. Pull requests #1–#6 fusionados; último APK: 1.0.31.

**Hecho pero sin fusionar:** nada. Las ramas que quedan con commits fuera de `main` son trabajo viejo ya superado
(`claude/elegant-bardeen-9nk8c1` y `claude/vigilant-lovelace-hb4acy`: D1 y D2 rehechos después;
`claude/affectionate-shannon-9oa7zz`: plan de producto de octubre, sustituido por este ROADMAP). Se pueden borrar.

**Tú, en este orden:**
1. Plantillas de email de Supabase para que llegue el código: `docs/supabase.md`, apartado 2. Sin esto no puedes entrar en la cuenta.
2. Instalar el APK 1.0.31 de Releases (es el de `main`; donde `docs/strava.md` dice «el APK de la rama», usa este).
3. Probar en el móvil la app nueva: lo de siempre (rutina, sueltos, favorita en el widget, historial, exportar e importar),
   TalkBack y la fluidez del reproductor 3D (C1, Fases 1 y 1b más abajo).
4. Entrar con tu cuenta; luego reinstalar u otro móvil y comprobar que aparece todo; tu mujer con su cuenta ve solo lo suyo (B1).
5. Registrar la app en Strava y en Polar AccessLink y poner las 4 claves en Supabase: `docs/strava.md`, pasos 1–3.
6. Conectar Strava y Polar en Tú → Conexiones: `docs/strava.md`, paso 4.
7. Polar Flow → Strava solo carreras (o quitarlo y marcar «Reenviar también carreras y paseos»): `docs/strava.md`, paso 5; y el reloj, paso 6.
8. Comprobar con una sesión real: en Polar Flow como siempre y en Strava con ejercicios y pulso; una carrera sigue llegando (S1).
9. Para tu mujer en Strava: pedir más plazas de atletas en strava.com/settings/api (la app nueva solo admite 1).
- Sin confirmar: el visto bueno de D3 en el móvil (C1 se construyó encima, así que se dio por bueno; dime si lo hiciste).

10. Catálogo de ejercicios en Supabase (bloque E): pegar en SQL Editor `supabase/migrations/20261114000000_catalogo_ejercicios.sql`
   y después `20261114000100_catalogo_ejercicios_datos.sql` (`docs/supabase.md`, apartado 1).

**Siguiente fase:** E (revisar los 30 ejercicios: pasos 2 y 3), antes de B2, que necesita sus metadatos para elegir.
C2 (widget con el diseño nuevo) puede ir a la vez.
Después, el bloque P. Casi todo el bloque P toca `app/app.js`, igual que B2 (que añade «Plan de Claude» en Entrenar):
mejor empezarlo cuando B2 esté fusionado.

## Decisiones tomadas

- **Requisitos:** Strava tiene que mostrar los ejercicios (series, repeticiones, kilos), no una descripción,
  y **Polar Flow tiene que seguir teniendo todas las sesiones** (carga semanal y avisos del reloj).
- Lo que se sabe: Strava solo acepta los ejercicios al **subir** la actividad (archivo FIT con series o su JSON de fuerza);
  no se pueden añadir a la que ya subió Polar, y la API no deja borrarla. Polar → Strava no envía ejercicios.
- **Camino elegido en S1** (la API no deja añadir ejercicios a una actividad existente): el reloj graba como siempre (Polar Flow lo tiene todo),
  pero se **desactiva la sincronización automática Polar Flow → Strava**. La app descarga de Polar (API AccessLink)
  el archivo de cada sesión con el pulso, le añade las series si es una sesión de la app o de Freeletics, y lo sube a Strava.
  Las carreras y lo demás se reenvían tal cual. Riesgo: si la app falla, no llega nada a Strava hasta reintentar.
- **Dato clave:** la lista de ejercicios de la actividad del 9 de noviembre la añadiste a mano en Strava sobre la actividad
  que subió Polar. O sea, Strava **sí deja añadir ejercicios a una actividad que ya existe**, al menos desde su app.
  Investigado en S1: la API **no** lo permite (solo la app de Strava), así que se sigue el camino de arriba.
- Descartado: el modo sensor de FC (el reloj no graba) porque la sesión no llegaría a Polar Flow.
- Freeletics no está conectado ni a Polar ni a Strava, así que no hay duplicados por su parte.
- **Material real:** bandas elásticas grandes (bucles largos y cerrados, sin asas) y una mini banda de glúteo.
  En los datos, las grandes usan la clave interna `gomas`.
- **Reloj:** Polar Vantage V3. Según la documentación de Polar puede emitir el pulso por Bluetooth **mientras graba**
  («Compartir FC con otros dispositivos» → «visible para todos», en el pre-entreno o en el perfil de deporte de Polar Flow).
  Desde el firmware 4.1.5 viene desactivado por defecto, y deja de emitir al parar la grabación o salir del pre-entreno.
- **Claves secretas** (Strava, IA): nunca dentro del APK, que es público en Releases. Van en Supabase (Edge Functions).
- Las carreras se graban con el Polar; la app las **importa** de Strava, no graba GPS.

## Fases

### Fase 0 · Ejercicios sueltos, favoritas y bandas ✅
- [x] Remo inclinado y curl de bíceps con banda; catálogo con zona, material y repeticiones
- [x] Pantalla «Ejercicios sueltos», modo alternado (superserie) y favoritas
- [x] Nombre de cada banda y banda recordada por ejercicio
- [x] Solo dos materiales de banda: bandas grandes y mini banda
- [x] **Tú:** fusionar la rama `ccr-ca344ef2-pok0db` en `main` y comprobar que «Compilar APK» acaba en verde (versión 1.0.8)

### Fase 1 · Historial de sesiones y copia de seguridad ✅ (fusionada, versión 1.0.9; falta probar en el móvil)
Base de todo lo demás (Strava, nube, planes). Cada serie se guarda con su hora de inicio y fin, para poder subirla a Strava.
- [x] Guardar cada sesión terminada (rutina o sueltos, desde la app o el widget): fecha y hora de inicio y fin, tipo, y por cada serie
  el ejercicio, el lado, la ronda, las repeticiones o segundos (lo hecho y lo previsto), la banda y los kilos.
  Archivo `history.json` en el móvil (`History.kt`); la forma de cada sesión está explicada al principio de ese archivo
- [x] Las sesiones paradas a mitad (Reiniciar o Parar en el widget) se guardan como «Incompleta» si se hizo al menos una serie;
  no cuentan para la racha ni para la alternancia A/B. Las series saltadas guardan solo lo hecho; si no llegó a 1 s, no se apuntan
- [x] También se guarda en la sesión cómo te ha ido cada módulo (fácil / justo / demasiado), para la Fase 9
- [x] Pantalla «Historial» (tercera pestaña): lista por días y detalle de cada sesión; por ejercicio, la última vez y la mejor
  (la de más kilos; sin kilos, la de más repeticiones o segundos)
- [x] Exportar todo (historial, favoritas, bandas, pesos, configuración, racha) a un archivo JSON e importarlo.
  Importar **combina**: no duplica sesiones ni borra lo que ya hay. Pruebas en `app/src/test` (`gradle testReleaseUnitTest`)
- Decidido: el historial empieza vacío (los días de la racha anteriores no tienen detalle y no se muestran).
  Si cierras la app del todo a mitad de una sesión, esa sesión no se guarda
- [x] **Tú:** fusionar la rama `claude/coruti-phase-1-history-backup-x0n7e3` en `main` (pull request #2, versión 1.0.9)
- [ ] **Tú:** Hecho cuando: una sesión aparece en el historial al terminar (desde la app y desde el widget),
  y exportar → desinstalar → importar lo recupera todo

### Fase 1b · Favorita en el widget ✅ (fusionada, versión 1.0.9; falta probar en el móvil)
Para cuando la mayoría de ejercicios los haces con otra app y aquí solo quieres un par de ejercicios sueltos.
- [x] En la app, ★ en una favorita: es la que sale en el widget (solo una; otro toque la quita). Se guarda en la copia de seguridad
- [x] Widget grande: fila «Rutina / ★ favorita» para cambiar con un toque sin abrir la app (solo sale si hay una favorita marcada).
  Con la favorita: Empezar la hace, − / + cambian sus rondas, y se ocultan módulos, A/B e intensidad
- [x] Widget pequeño: Empezar hace lo elegido en el grande
- [x] Desde el widget, la favorita se guarda en el historial como «Ejercicios sueltos» y cuenta para la racha sin cambiar la alternancia A/B
- [x] El widget monta los ejercicios sueltos en Kotlin igual que la app (`Free.kt`; `FreePlanTest` deja 400 favoritas al azar
  para compararlas con `buildFree` de `index.html`: iguales)
- [ ] **Tú:** Hecho cuando: marcas ★ en una favorita, el widget la muestra, Empezar la hace con sus ejercicios, rondas y descanso,
  y aparece en el historial

## Plan a partir de aquí (por bloques)

**La idea:** una app de entrenamiento que funcione muy bien sola (planes por objetivo, como Freeletics, para quien no use Claude)
y que, si quieres ir más fino, **se conecte a Claude** como se conecta a Strava: en una conversación que ya sabe tu objetivo,
tu peso, lo que corres y lo que comes, Claude lee tu historial de la app y **te crea y cambia las sesiones y el plan de la semana
dentro de la app**. Tú solo entrenas. Luego la app sube a Strava la sesión con ejercicios y pulso.
Abierta a más personas (tu mujer u otros), cada una con su cuenta y sus datos.

**Regla de oro (nueva):** los bloques que se pueden hacer a la vez van en **ramas distintas** y tocan **archivos distintos**.
Antes de empezar un paso, los pasos de los que depende tienen que estar fusionados en `main`.
El diseño se hace **una sola vez y completo**: incluye ya las pantallas de todo lo que viene (Claude, planes, Strava, pulso,
peso, usuarios), para no rehacerlo dentro de dos días.

```
D1 Figura ──────────┐
D2 Diseño completo ─┴─► D3 Validación ─┐
B1 Cuentas y nube ─────────────────────┼─► C1 App nueva ─► C2 Widget
                    └─► B2 Conector Claude ─► (usa C1 para enseñar los planes)
                    └─► S1 Strava ─────────► (botón en el historial de C1)
Después: P1 Pulso · P2 Planes por objetivo · P3 Peso y medidas · P4 Carreras de Strava · P5 Cardio · P6 Coach por voz
```

**Ahora mismo:** ver «Estado» al principio.

### Bloque D · Diseño (antes de construir nada de interfaz)

#### D1 · Figura del ejercicio (sesión muy fina) ✅ cerrado: figura 3D, hombre y mujer (se elige en Ajustes)
- [x] Prueba de persona con volumen, hombre o mujer, y etiquetas de zona solo en grande (`docs/diseno/figura/`)
- [x] **Tres estilos a elegir:** muñeco de palos (el de ahora, mejorado: pies, manos, cuello, lo de detrás en gris),
  muñeco redondeado y persona; los tres sobre la misma geometría (`figura.js`). Página para elegir: `docs/diseno/figura/index.html`
- [x] Persona: sin juntas visibles, **pies y zapatillas bien orientados** (apoyados en el suelo o la silla, de puntillas en plancha,
  sobre el empeine en gato y psoas), cara (también de frente), manos planas al apoyarse o cerradas al sujetar;
  bien de pie, tumbado y de lado (vista de frente en paso lateral, ángel, plancha lateral y almeja); bien en miniatura y en grande
- [x] Todos los ejercicios de `rutina.json` (34) revisados con capturas a ancho de móvil, en los tres estilos, hombre y mujer,
  claro y oscuro, en las posturas y a mitad de movimiento (`galeria.html`). Lo que hay que pasar a `rutina.json` en C1, en `NOTAS.md`
- [x] Investigado (sin decidir): imágenes o vídeos generados con un servicio externo de IA. Coste, peso en la APK
  y si la persona se mantiene igual: resumen y opciones A/B/C en `docs/diseno/figura/NOTAS.md`
- [x] Prueba de figura 3D con las mismas posturas (`docs/diseno/figura/3d.html`, opción D de `NOTAS.md`)
- [x] Modelos 3D propios, hombre y mujer (MakeHuman, CC0), con ropa de deporte, pelo y deformaciones para personalizar
  más adelante (complexión y músculo; piel, ropa y pelo como colores aparte): `docs/diseno/figura/modelos/`
- [x] Figura 3D completa (`figura3d.js`): material (bandas grandes en bucle, mini banda en los muslos, mancuernas, toalla, correas,
  sillas, sofá y pared), manos cerradas al sujetar, antebrazos apoyados en plancha, fondos con la cadera por debajo del asiento
  y etiquetas de zona solo en grande, como en la dibujada. «Remo a una mano» corregido (salía boca arriba y con los pies al revés,
  también en la dibujada). three.js incluido en `three/`
- [x] Bordes de la ropa y del pelo pulidos (`modelos/pulir_ropa.py`, lo usa `crear_modelos.py`); modelos regenerados
- [x] Página para elegir en el móvil: figura dibujada, 3D o las dos, hombre o mujer, con todos los ejercicios (`elegir.html`, publicada)
- [x] Los 34 ejercicios revisados en 3D con capturas a ancho de móvil: hombre y mujer, en grande (final y mitad de cada movimiento),
  en miniatura, claro y oscuro (`3d.html`)
- [x] **Tú:** elegida en el móvil la **figura 3D (opción D), con hombre y mujer** para que cada persona elija
- [x] `crear_modelos.py` ejecutado entero desde cero con MakeHuman/MPFB2: los modelos salen iguales en el cuerpo y mejor en la cabeza
  (oreja entera de piel, pelo alrededor en curva, nuca recta) y sin dientes en el tirante de ella ni en el cuello de la camiseta de él
- [x] Imágenes de la figura 3D hechas antes para el widget, que no puede mostrar 3D: una por fase (71 por sexo), claro y oscuro,
  WebP de 400 px con fondo transparente, ~6 KB cada una, 1,7 MB todas (`widget/`, cómo se hacen en `NOTAS.md`)
- [x] Los 34 ejercicios revisados otra vez con capturas a 412 px, hombre y mujer, con los modelos nuevos
- Para D2 y C1/C2 (en `NOTAS.md`): el fondo actual del widget (`#1E6B74`) es el color de la camiseta y ella se pierde;
  lo que hay que pasar a `rutina.json`; peso de la figura 3D en la APK (5,3–6,1 MB: three.js, dos modelos e imágenes)

#### D2 · Producto completo, sistema de diseño y prototipo ✅
- [x] Lista de funcionalidades (`docs/diseno/1-funcionalidades.md`)
- [x] Ampliada con todo lo del plan: Claude (qué ve y qué hace), planes por objetivo, calendario de la semana, Strava y Polar,
  pulso, peso y medidas, varias personas, figura 3D hombre o mujer y su personalización más adelante
- [x] Sistema de diseño (`docs/diseno/2-sistema-de-diseno.md`): 4 tamaños de letra más uno solo para el reproductor,
  colores de la marca (`#1E6B74`, `#F0B04A`, `#EDF1F0`) y oscuro, espacios, componentes y widget
- [x] Prototipo navegable de todas las pantallas (`docs/diseno/prototipo/`) con la **figura 3D real** de D1: miniaturas en la
  cuadrícula y las listas, movimiento con etiquetas en la ficha, a toda pantalla en el reproductor (en los de pie se recortan los lados),
  el siguiente durante el descanso, hombre o mujer en Tú → Figura y una prueba de personalización (complexión, músculo, piel, pelo, camiseta)
- [x] Widget grande y pequeño con las imágenes WebP de D1 (alternan las fases)
- [x] **Fondo del widget:** el de hoy (`#1E6B74`) es el color de la camiseta. Pantalla «Fondo: dos opciones» con las imágenes reales:
  A, fondo de la app claro u oscuro (propuesta); B, fondo de hoy y camiseta coral (imágenes de prueba en `prototipo/widget-ropa-coral/`)
- [x] Publicado para abrirlo en el móvil: https://claude.ai/artifact/SozxjV2P1cQ8F2uUFU8rpL (privado; la copia publicada lleva los modelos
  como glTF en JSON y solo las imágenes del widget que usa)
- Partió del D2 que no se había fusionado (rama `claude/vigilant-lovelace-hb4acy`): su revisión de validación (`3-validacion.md`)
  se hizo con la figura en un hueco y se rehace en D3. D1, D2 y D3 llegaron a `main` con C1 (pull request #5)
- [x] **Tú:** elegido el fondo del widget: **A, el de la app (claro u oscuro)**

#### D3 · Validación ✅ revisión hecha y en `main` (con C1); tu visto bueno sin confirmar
- [x] Revisión con las skills de diseño (crítica heurística, accesibilidad WCAG 2.2 AA en claro y oscuro, textos) y corrección
  hasta no tener fallos graves: `docs/diseno/3-validacion.md`. axe: 0 fallos en 43 pantallas y estados, en los dos temas
- [x] Reproductor a 1–2 m: cantidad más grande (`p2` 72–120 sp, se lee a 2 m) y **fondo distinto en descanso y «Prepárate»**
  (antes no se distinguían de lejos). El nombre no se lee desde el suelo: para C1, que la voz lo diga
- [x] Figura de pie en el reproductor: el recorte fijo **cortaba la etiqueta de la zona** («JUNTA ESCÁPULAS», «GLÚTEO DE LADO»).
  Ahora el encuadre se mide por ejercicio: nada cortado (comprobado con la 3D) y la persona hasta ×1,55 más grande
- [x] Rendimiento: aquí no hay GPU (todo va lento, también D2), así que se añadió **«Rendimiento en este móvil»** al prototipo
  para medirlo en el tuyo. Las miniaturas se dibujan una a una sin bloquear y se guardan
- [x] Widget con el fondo A: hombre y mujer se ven en claro y oscuro; para C2, la persona de pie sale pequeña (recortar la imagen)
- [x] Prototipo republicado en el mismo enlace. **Ojo:** la copia publicada de D2 enseñaba la figura dibujada, no la 3D (fallo de ruta,
  arreglado): esta es la primera vez que la 3D se ve en el enlace
- [ ] **Tú:** visto bueno en el móvil (lista en `3-validacion.md` → «Lo que falta»), con las cifras de «Rendimiento».
  Hecho cuando: das el diseño por cerrado

### Bloque B · Base técnica

#### B1 · Cuentas y datos en la nube (Supabase) ✅ (en `main`, pull request #4; falta probar en el móvil)
- [x] **Tú, antes:** crear el proyecto en supabase.com (gratis) y pasar la URL y la clave pública
- [x] Modelo de datos pensado para todo el plan (`supabase/migrations/`): personas (perfil, objetivo), peso y medidas,
  ejercicios propios, sesiones y series, favoritas, planes y días del plan, conexiones (Strava, Polar, Claude) y sus tokens
  aparte (solo para Edge Functions), con seguridad por persona (RLS). Probado en un Postgres local (ver `docs/supabase.md`)
- [x] Inicio de sesión con email y **código de 6 cifras** (decidido en vez del enlace mágico: funciona aunque leas el correo
  en el ordenador y no necesita enlaces de vuelta a la app); registro abierto; sin cuenta se sigue usando solo en el móvil
- [x] Al entrar por primera vez se sube lo que hay en el móvil (en un móvil nuevo, se baja todo); después se sincroniza
  al terminar cada sesión (app y widget), al poner «cómo te ha ido», al importar una copia y al abrir la app.
  Sin librerías nuevas en el APK (`Cloud.kt`, lógica con pruebas en `SyncLogic.kt` / `SyncLogicTest`)
- [x] Salir deja los datos en el móvil. Si entra otra cuenta, lo del móvil se cambia por lo de esa cuenta,
  y no deja hacerlo si queda algo de la anterior sin subir
- [x] La pantalla de entrar es provisional: bloque «Cuenta» en Historial; la buena llega con C1
- [x] GitHub Actions: con el repo privado, el APK de `main` sigue en Releases (solo con acceso).
  Desde el 13 nov, para no gastar: `main` solo compila si cambia algo del APK, y las ramas solo a mano
  (Actions → Compilar APK → Run workflow) cuando hace falta el APK para probarlo en el móvil
- Decidido: la Edge Function para secretos pasa a S1, cuando haya un secreto real (Strava) y algo que la use.
  La tabla `connection_secrets` ya está lista y la app no puede leerla
- [x] Migración de B1 aplicada en Supabase (13 nov, desde la conversación de S1)
- [ ] **Tú:** cambiar las plantillas de email para que traigan el código (pasos en `docs/supabase.md`, apartado 2).
  Ahora mismo mandan un enlace en inglés y la longitud del código es 8 (la app acepta de 6 a 10)
- [x] **Tú:** fusionar la rama en `main` (pull request #4, versión 1.0.12)
- [ ] **Tú:** probar en el móvil con el APK de `main` (1.0.31)
- [ ] **Tú:** Hecho cuando: con otro móvil, o tras reinstalar, entras y aparece todo; y tu mujer con su cuenta ve solo lo suyo
- Ojo: el plan gratuito pausa el proyecto tras ~1 semana sin uso; se reactiva desde la web y no se pierden datos.
  El email de Supabase manda pocos códigos por hora: si pides varios seguidos, espera unos minutos

### Bloque E · Ejercicios bien hechos (antes de B2)
Cada ejercicio pasa por tres pasos con comprobaciones: ficha (qué es y para qué sirve: lo que usa Claude para elegir),
técnica (cómo se hace y qué tiene que cumplir la figura: apoyos y condiciones) y figura, y tu visto bueno. Proceso, formato
y vocabulario en `docs/diseno/4-ejercicios.md`; datos en `ejercicios/`; en la nube, tabla `exercise_catalog`.
- [x] E1 · Proceso, formato de la ficha y comprobador del paso 1 (`node ejercicios/comprobar.js`)
- [x] E1 · Paso 1 de los 30 ejercicios (`ejercicios/fichas.json`), comprobado; 18 apuntes de cosas mal para los pasos 2 y 3
  (almeja con la figura mal, press con banda que habla de mancuernas, dosis raras en hollow y flexiones inclinadas…)
- [x] E1 · Tabla `exercise_catalog` y SQL con los 30 (ficha hecha; técnica y figura de hoy marcadas «sin revisar»),
  probados en un Postgres local: se crea, se puede repetir, las cuentas leen y no escriben, sin cuenta no se lee
- [ ] **Tú:** pegar los dos SQL en Supabase (`docs/supabase.md`, apartado 1)
- [ ] E2 · Paso 2 (técnica con apoyos y condiciones) de los 30
- [ ] E3 · Comprobador 3D (apoyos, nada flota ni atraviesa, condiciones, rangos) y paso 3 de los 30, empezando por la almeja
  (necesita posturas 3D); capturas de cada uno y tu visto bueno → `publicado`
- [ ] E4 · La app lee el catálogo de la nube (con `rutina.json` como copia sin conexión) y Claude puede proponer ejercicios (con B2)

#### B2 · Conector de Claude ⭐ — después de E (necesita los metadatos de la ficha), en paralelo con C2
- [ ] Servidor MCP propio (en Supabase) que se añade en Claude como conector personalizado, con inicio de sesión de tu cuenta de la app
- [ ] Lo que Claude puede **leer**: perfil y objetivo, peso y medidas, historial con series, kilos, bandas y pulso,
  favoritas, plan actual, catálogo de ejercicios con el material que tienes
- [ ] Lo que Claude puede **escribir**: crear o cambiar una sesión (ejercicios, repeticiones, rondas, descanso, bandas),
  el plan de la semana («lunes fuerza de cuerpo entero, martes descanso…»), favoritas, y apuntar peso o medidas
- [ ] En la app: «Plan de Claude» en Entrenar, y cada sesión que crea Claude lista para empezar con un toque
- [ ] Hecho cuando: en una conversación le pides a Claude la sesión de hoy y aparece en la app sin tocar nada más
- Ya preparado en B1: tablas `plans` y `plan_days` (con la sesión lista para empezar en `workout`), `body_measurements`,
  `profiles` y `connections`. Lo que Claude cambie en la nube llega a la app en la siguiente sincronización
  (favoritas y sesiones ya se bajan; los planes, cuando la app sepa mostrarlos)
- Necesita una suscripción de Claude que permita conectores personalizados. Sin ella, la app funciona igual con sus propios planes (P2)

### Bloque C · La app nueva

#### C1 · Construir la app a partir del diseño validado ✅ (en `main`, pull request #5, versión 1.0.26; falta probar en el móvil)
- [x] Entrega 1 · navegación (Entrenar · Ejercicios · Historial · Tú) y Entrenar: Hoy (la sesión del widget: favorita con ★ o rutina de core),
  semana con los días hechos, favoritas (también la rutina de core si la marcas), sesión nueva, elegir ejercicios y rutina de core
- [x] Entrega 2 · reproductor a pantalla completa y figura 3D dentro del APK (three.js y modelos, copiados de `docs/diseno/figura`
  al compilar; la dibujada si no hay WebGL): encuadre por ejercicio, fondo `accion-suave` en descanso y «Prepárate», la voz dice
  el nombre al empezar cada serie, densidad del lienzo como máximo 2, repeticiones que esperan al toque, deslizar para volver,
  pausa con Seguir · Anterior · Parar (guarda como incompleta), banda y kilos en marcha, y el final con «¿Cómo te ha ido?»
- [x] Entrega 3 · Ejercicios (cuadrícula con filtros) y ficha (movimiento, claves, dosis, tus marcas, YouTube, añadir a una sesión)
- [x] Entrega 4 · Historial por días, detalle con cada serie (hora, reps o segundos, kilos, banda) y por ejercicio
- [x] Entrega 5 · Tú: cuenta (entrar con el código de B1, sincronizar, salir), material, mis bandas, sonido, figura hombre o mujer,
  widget y copia de seguridad (exportar e importar)
- [x] `rutina.json` con lo pendiente de `figura/NOTAS.md`: vista de frente, puntillas, sin correas TRX, rodillas de `remo_db`
- [x] Sin perder nada: mismas claves de datos (historial, copias, favoritas, bandas, pesos, racha, configuración, favorita del widget);
  la lógica del plan y de los sueltos es la de antes (`assets/app/motor.js` = `Plan.kt` y `Free.kt`)
- [x] Comprobado en Chromium a 360 × 740: claro y oscuro, letra al 100, 130 y 200 % (las pestañas y el reproductor crecen como mucho
  un 30 % para que la figura siga cabiendo) y axe-core WCAG 2.2 AA: 19 pantallas × 2 temas × 2 tamaños, 0 fallos
- Decidido: lo que aún no existe (Claude, planes por objetivo, Strava, pulso, peso, varias personas) no sale en la app hasta que exista.
  El rodillo tampoco: no hay ejercicios de rodillo en `rutina.json`. «Menos volumen en cada ronda» está en la rutina de core
  («Menos repeticiones en cada ronda»), porque es volumen de entrenamiento, no de sonido. «Prepárate» dura lo de siempre (8 s) y va
  antes de cada ejercicio, igual que en el widget
- [ ] **Tú:** probar con TalkBack en el móvil (aquí solo se ha comprobado el árbol de accesibilidad y axe, no TalkBack de verdad)
  y medir la fluidez del reproductor 3D en tu móvil
- [ ] **Tú:** Hecho cuando: hace todo lo de antes con el diseño nuevo y te parece bien en el móvil

#### C2 · Widget con el diseño nuevo — siguiente, en paralelo con B2
- [ ] Mismo sistema de diseño; muestra la sesión de hoy (también la del plan de Claude) o la favorita elegida

### Bloque S · Strava con ejercicios y pulso, sin perder Polar Flow ⭐

#### S1 ✅ (en `main`, pull request #6, versión 1.0.31; servidor desplegado; falta probar con cuentas reales)
Todo explicado en `docs/strava.md`.
- [x] **Investigación** (13 nov, con la documentación oficial):
  1) la API de Strava **no** deja añadir ejercicios a una actividad que ya existe (al editar solo cambia nombre, descripción,
  tipo, material y etiquetas; borrar tampoco). «Editar ejercicios» solo existe en la app de Strava;
  2) Polar no documenta un filtro por deporte en Polar Flow → Strava (lo miras tú en el paso 5 de `docs/strava.md`);
  3) desde mayo de 2026 Strava acepta los ejercicios **al subir** (FIT con series o JSON de fuerza, con el pulso), y
  AccessLink da cada sesión del reloj con el pulso durante 30 días y avisa al momento
- [x] **Decidido:** Polar Flow → Strava solo carreras, trail y caminatas. Los entrenos los sube el servidor: con sesión de la app,
  JSON de fuerza con la lista de ejercicios y el pulso del reloj; sin ella (Freeletics…), el archivo del reloj tal cual.
  Sin reloj, se sube sin pulso a las 3 horas. Si Polar Flow no deja filtrar, se quita del todo y se marca
  «Reenviar también carreras y paseos»
- [x] Migración (`supabase/migrations/20261113000000_s1_strava_polar.sql`): estado de Strava por sesión, esfuerzo,
  sesiones de Polar, claves del servidor y revisión cada 15 minutos (pg_cron). Aplicada en Supabase
- [x] Edge Functions `conexiones` y `polar-aviso` (desplegadas): conectar y desconectar Strava y Polar (tokens en
  `connection_secrets`, ninguna clave en el APK), aviso de Polar con firma comprobada, emparejar por la hora,
  reintentos (1 h, 2 h, 4 h, 8 h) y aviso de duplicado. Probadas en el proyecto con un usuario de prueba (ya borrado)
- [x] Cada ejercicio del catálogo con su ejercicio de Strava (`_shared/logica.ts`, con pruebas que lo comparan con la lista
  oficial de Strava). Esfuerzo y sensación van en la descripción (la API no deja ponerlos en su sitio)
- [x] App, encima de C1 y con el diseño de D2: Tú → Conexiones → Strava y Polar (conectar, desconectar, reenviar carreras,
  pendientes); en el historial, estado de Strava y pulso de cada sesión; en el detalle, «Enviar a Strava» / «Reintentar» /
  «Abrir en Strava» con pulso medio, máximo y esfuerzo; al terminar, esfuerzo 1–10, cómo te has sentido y «Enviar a Strava».
  Al volver de Strava o Polar la app abre Conexiones (`rutinacore://conexion`)
- [ ] **Tú:** registrar la app en Strava y en Polar AccessLink y poner las 4 claves en Supabase (pasos 1–3 de `docs/strava.md`)
- [ ] **Tú:** conectar Strava y Polar en la app y luego cambiar Polar Flow → Strava (pasos 4–5)
- [ ] **Tú:** Hecho cuando: una sesión real está en Polar Flow como siempre y en Strava con la lista de ejercicios y el pulso,
  y una carrera sigue llegando a Strava
- Ojo: una app nueva de Strava solo admite 1 atleta; para tu mujer hay que pedir más plazas en strava.com/settings/api.
  La API de Strava cambia de dirección el 4 de enero de 2027 (una línea en `_shared/servidor.ts`)
- Si se añade un ejercicio a `rutina.json`, hay que añadirlo en `EJERCICIO_STRAVA` (la prueba lo avisa; se ejecuta con Node,
  no en GitHub Actions)

### Bloque P · Después (cada uno, cuando toque; casi todos independientes entre sí)
- **P1 · Pulso en directo del Polar Vantage V3** (antes: Fase 3). **Tú, una vez:** en Polar Flow, en el perfil de deporte,
  «Compartir FC con otros dispositivos» → «visible para todos». Pantalla «Probar pulso»; pulso por Bluetooth (0x180D),
  reconectar si se corta; pulso segundo a segundo en la sesión; grande en el reproductor; medio y máximo por ejercicio;
  descanso inteligente opcional. Hecho cuando: en una sesión real se ve en directo y queda guardado
- **P2 · Planes por objetivo** (antes: Fase 9), para quien no use Claude: fuerza, músculo, cardio y movilidad, de 4 a 8 semanas,
  con calendario y progresión según el historial y el «fácil / justo / demasiado». **Cada vez que repites, una sesión distinta**
- **P3 · Peso y medidas:** apuntarlos a mano, importar un archivo de la báscula inteligente o que te los pase Claude
  (tu tarea semanal que descarga los datos de la báscula puede enviarlos por el conector). Gráfica en Perfil
- **P4 · Traer de Strava carreras y otras actividades** (antes: Fase 6) y mostrarlas en el historial
- **P5 · Modos de cardio** EMOM, Tabata y AMRAP con el mismo reproductor (antes: Fase 7)
- **P6 · Coach por voz** con claves de técnica a mitad de serie (antes: Fase 8)
- **P7 · Freeletics** (antes: Fase 5): con el conector de Claude probablemente ya no hace falta la foto
  (le dices a Claude qué has hecho y lo apunta). Se decide después de B2

## Cómo es cada conversación

1. Pegas el prompt de la fase.
2. Se lee el código y este archivo, se pregunta lo que haga falta y se propone el plan antes de tocar nada.
3. Commits pequeños y separados. No se rompen las rutinas, el widget ni la compilación del APK.
4. Al acabar: este archivo actualizado, instrucciones para probar e instalar, y el prompt de la fase siguiente.

Cómo se trabaja, qué es la app y dónde está cada cosa está en `CLAUDE.md`, que Claude lee solo al empezar.
Por eso el prompt puede ser corto:

```
Haz <fase> del ROADMAP (p. ej. «B2: Conector de Claude»).
```
