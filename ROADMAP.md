# Plan del proyecto · Rutina core

Una fase por conversación. Cada conversación empieza con el prompt de la fase,
pregunta lo que haga falta antes de tocar código, trabaja en commits pequeños,
marca aquí lo hecho y termina dando el prompt de la fase siguiente.

**Regla de oro:** antes de empezar una fase, la anterior tiene que estar fusionada en `main`.
Cada conversación nueva parte de `main`; si no se fusiona, empieza sin los cambios anteriores.

## Decisiones tomadas

- **Requisitos:** Strava tiene que mostrar los ejercicios (series, repeticiones, kilos), no una descripción,
  y **Polar Flow tiene que seguir teniendo todas las sesiones** (carga semanal y avisos del reloj).
- Lo que se sabe: Strava solo acepta los ejercicios al **subir** la actividad (archivo FIT con series o su JSON de fuerza);
  no se pueden añadir a la que ya subió Polar, y la API no deja borrarla. Polar → Strava no envía ejercicios.
- **Camino alternativo (si la API no deja añadir ejercicios a una actividad existente):** el reloj graba como siempre (Polar Flow lo tiene todo),
  pero se **desactiva la sincronización automática Polar Flow → Strava**. La app descarga de Polar (API AccessLink)
  el archivo de cada sesión con el pulso, le añade las series si es una sesión de la app o de Freeletics, y lo sube a Strava.
  Las carreras y lo demás se reenvían tal cual. Riesgo: si la app falla, no llega nada a Strava hasta reintentar.
- **Dato clave:** la lista de ejercicios de la actividad del 9 de noviembre la añadiste a mano en Strava sobre la actividad
  que subió Polar. O sea, Strava **sí deja añadir ejercicios a una actividad que ya existe**, al menos desde su app.
  Si la API también lo permite, el camino más sencillo es: Polar sigue subiendo a Strava como ahora y la app solo
  añade los ejercicios y el título a esa actividad. Es lo primero que se investiga en la Fase 4.
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

### Fase 1 · Historial de sesiones y copia de seguridad ✅ (hecho, falta fusionar y probar en el móvil)
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
- [ ] **Tú:** fusionar la rama `claude/coruti-phase-1-history-backup-x0n7e3` en `main` y comprobar que «Compilar APK» acaba en verde
- [ ] **Tú:** Hecho cuando: una sesión aparece en el historial al terminar (desde la app y desde el widget),
  y exportar → desinstalar → importar lo recupera todo

### Fase 2 · Supabase: datos en la nube y caja fuerte de claves
- [ ] **Tú, antes:** crear el proyecto en supabase.com (gratis) y pasar la URL y la clave pública (`anon`)
- [ ] Inicio de sesión con email (enlace mágico)
- [ ] Tablas con seguridad por usuario (RLS) para el historial, las favoritas, las bandas y la configuración; sincronizar al terminar cada sesión y al abrir la app
- [ ] Edge Function base para guardar secretos (la usarán Strava y la IA)
- [ ] Hecho cuando: con otro móvil (o tras reinstalar) e iniciando sesión, aparece todo
- Ojo: el plan gratuito pausa el proyecto tras ~1 semana sin uso; se reactiva desde la web y no se pierden datos

### Fase 3 · Pulso en directo del Polar Vantage V3
Para ver el pulso en directo en la app y guardar el pulso por ejercicio (el reloj sigue grabando para Polar Flow).
- [ ] **Tú, antes (una sola vez):** en Polar Flow, en el perfil de deporte que uses (p. ej. «Entrenamiento en circuito»),
  activar «Compartir FC con otros dispositivos» → «visible para todos»
- Cómo se usa: en el reloj eliges el deporte y empiezas a grabar; la app se conecta y lee el pulso
- [ ] Primer paso de la fase: pantalla «Probar pulso» para confirmar con tu reloj que el móvil lo ve y lee el pulso.
  Es lo único que no se puede comprobar sin tu reloj delante
- [ ] Leer el pulso por Bluetooth (servicio estándar de frecuencia cardíaca, 0x180D) con los permisos de Android;
  reconectar solo si se corta y seguir la sesión sin pulso si no hay reloj
- [ ] Guardar el pulso segundo a segundo en la sesión
- [ ] Mostrar el pulso grande y la zona en el reproductor; pulso medio y máximo por ejercicio en el historial
- [ ] Descanso inteligente (opcional): el descanso acaba al bajar de X ppm o al llegar al máximo
- [ ] Hecho cuando: en una sesión real se ve el pulso en directo y queda guardado

### Fase 4 · Strava con ejercicios, sin perder Polar Flow ⭐ prioridad
- [ ] **Primero, investigar de verdad** (antes de escribir código): 1) si la API de Strava deja añadir ejercicios
  a una actividad existente, como hace su app (camino sencillo: Polar sigue subiendo); 2) si no, confirmar que la API AccessLink de Polar da el archivo FIT
  de cada sesión con el pulso, que Strava muestra las series de un FIT subido por API, y si hay otra forma más sencilla
  que cumpla los dos requisitos. Decidir el camino contigo
- [ ] **Tú, antes:** registrar una app en strava.com/settings/api y otra en Polar AccessLink (gratis);
  los secretos se guardan en Supabase, no en el código
- [ ] Conectar Strava y Polar una vez (OAuth vía Edge Function)
- [ ] Tabla que traduce cada ejercicio del catálogo a su ejercicio FIT (los que no tienen equivalente, al tipo más cercano)
- [ ] Por cada sesión nueva de Polar: si coincide en hora con una sesión de la app o de Freeletics, añadir las series y un
  título claro («Rutina core · Espalda + Brazos»); si no, reenviarla tal cual. Subir a Strava
- [ ] Pendientes y reintentos; botón «Enviar a Strava» en el historial; aviso si Strava responde «duplicado»
- [ ] Hecho cuando: una sesión real aparece en Polar Flow como siempre y en Strava con la lista de ejercicios y el pulso,
  y una carrera sigue llegando a Strava

### Fase 5 · Foto de Freeletics → sesión con ejercicios en Strava ⭐
- Flujo: grabas Freeletics con el Polar como siempre; haces la captura de la sesión → la IA (Claude, a través de la
  Edge Function) reconoce el nombre, los ejercicios, las repeticiones y las rondas → la revisas → cuando llega la sesión
  de Polar de esa hora, se sube a Strava como en la Fase 4, con ejercicios, pulso y título («Freeletics · Aphrodite»)
- [ ] Captura → IA → sesión revisable; los ejercicios que no estén en la tabla FIT van al tipo más cercano
- [ ] También vale la captura de antes de entrenar: queda como «sesión de hoy» y se completa al terminar la grabación
- [ ] Hecho cuando: con una sesión real de Freeletics, Strava muestra sus ejercicios y el pulso
- Coste: unos céntimos por foto (API de IA)
- Aclarado: la lista de ejercicios del 9 de noviembre la añadiste a mano en Strava; Freeletics no sube nada

### Fase 6 · Traer de Strava carreras y otras actividades
- [ ] Leer de Strava las actividades que no son de la app (carreras, bici…) y mostrarlas en el historial con distancia, tiempo y pulso
- [ ] Hecho cuando: una carrera grabada con el Polar aparece sola en el historial

### Fase 7 · Modos de cardio
- [ ] EMOM, Tabata y AMRAP con los ejercicios del catálogo, usando el mismo reproductor
- [ ] Con pulso (Fase 3) si está disponible

### Fase 8 · Coach por voz
- [ ] A mitad de serie, una clave de técnica del ejercicio («codos pegados», «junta los omóplatos»)
- [ ] Opción para activarlo o desactivarlo

### Fase 9 · Planes por objetivo
- [ ] Fuerza, cardio y movilidad, de 4 a 8 semanas, con calendario
- [ ] Progresión según el historial y el «fácil / justo / demasiado»

## Cómo es cada conversación

1. Pegas el prompt de la fase.
2. Se lee el código y este archivo, se pregunta lo que haga falta y se propone el plan antes de tocar nada.
3. Commits pequeños y separados. No se rompen las rutinas, el widget ni la compilación del APK.
4. Al acabar: este archivo actualizado, instrucciones para probar e instalar, y el prompt de la fase siguiente.

Plantilla del prompt:

```
Trabajamos en mi app Android «Rutina core» (repo vignasi/Coruti).
Lee ROADMAP.md y haz la Fase N: <nombre>.
Antes de tocar código, revisa lo necesario y hazme las preguntas que haga falta.
Commits pequeños y separados; no rompas las rutinas, el widget ni la compilación del APK con GitHub Actions.
Al acabar: marca lo hecho en ROADMAP.md, explícame cómo probarlo e instalar el APK,
y dame el prompt para la fase siguiente.
```
