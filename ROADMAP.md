# Plan del proyecto · Rutina core

Una fase por conversación. Cada conversación empieza con el prompt de la fase,
pregunta lo que haga falta antes de tocar código, trabaja en commits pequeños,
marca aquí lo hecho y termina dando el prompt de la fase siguiente.

**Regla de oro:** antes de empezar una fase, la anterior tiene que estar fusionada en `main`.
Cada conversación nueva parte de `main`; si no se fusiona, empieza sin los cambios anteriores.

## Decisiones tomadas

- **Polar sigue grabando y subiendo a Strava** (Polar Flow → Strava, como ahora).
  La app **completa** esa actividad (título y descripción); no sube actividades propias.
- **Descartado:** que la app suba su propia actividad a Strava (duplicaría cada sesión).
- **Material real:** bandas elásticas grandes (bucles largos y cerrados, sin asas) y una mini banda de glúteo.
  En los datos, las grandes usan la clave interna `gomas`.
- **Reloj:** Polar Vantage V3. Comprobado en la documentación de Polar: puede emitir el pulso por Bluetooth
  («Compartir FC con otros dispositivos» → «Frecuencia cardíaca visible para todos») **mientras graba el entreno**,
  así que graba y emite a la vez: encaja con A + B sin duplicados. Desde el firmware 4.1.5 viene **desactivado**
  por defecto y la emisión se corta al salir del modo pre-entreno o al parar la grabación.
- **Claves secretas** (Strava, IA): nunca dentro del APK, que es público en Releases. Van en Supabase (Edge Functions).
- Las carreras se graban con el Polar; la app las **importa** de Strava, no graba GPS.

## Fases

### Fase 0 · Ejercicios sueltos, favoritas y bandas ✅ (hecho, falta fusionar)
- [x] Remo inclinado y curl de bíceps con banda; catálogo con zona, material y repeticiones
- [x] Pantalla «Ejercicios sueltos», modo alternado (superserie) y favoritas
- [x] Nombre de cada banda y banda recordada por ejercicio
- [x] Solo dos materiales de banda: bandas grandes y mini banda
- [ ] **Tú:** fusionar la rama `ccr-ca344ef2-pok0db` en `main` y comprobar que «Compilar APK» acaba en verde

### Fase 1 · Historial de sesiones y copia de seguridad
Base de todo lo demás (Strava, nube, planes).
- [ ] Guardar cada sesión terminada (rutina o sueltos): fecha y hora de inicio y fin, tipo, y por cada serie el ejercicio, las repeticiones o segundos, la banda y los kilos
- [ ] Pantalla «Historial»: lista por días y detalle de cada sesión; por ejercicio, la última vez y la mejor
- [ ] Exportar todo (historial, favoritas, bandas, configuración, racha) a un archivo JSON e importarlo
- [ ] Hecho cuando: una sesión aparece en el historial al terminar, y exportar → desinstalar → importar lo recupera todo

### Fase 2 · Supabase: datos en la nube y caja fuerte de claves
- [ ] **Tú, antes:** crear el proyecto en supabase.com (gratis) y pasar la URL y la clave pública (`anon`)
- [ ] Inicio de sesión con email (enlace mágico)
- [ ] Tablas con seguridad por usuario (RLS) para el historial, las favoritas, las bandas y la configuración; sincronizar al terminar cada sesión y al abrir la app
- [ ] Edge Function base para guardar secretos (la usarán Strava y la IA)
- [ ] Hecho cuando: con otro móvil (o tras reinstalar) e iniciando sesión, aparece todo
- Ojo: el plan gratuito pausa el proyecto tras ~1 semana sin uso; se reactiva desde la web y no se pierden datos

### Fase 3 · Strava: completar la actividad que sube Polar ⭐ prioridad
- [ ] **Tú, antes:** registrar una app en strava.com/settings/api (gratis); el client secret se guarda en Supabase, no en el código
- Comprobado en tu Strava: Polar sube las sesiones de fuerza como `WeightTraining`, `Workout` o `HighIntensityIntervalTraining`,
  con nombres genéricos («Entrenamiento fuerza nocturno»). Se buscará por hora entre esos tres tipos.
- Strava muestra una lista de ejercicios en algunas actividades de fuerza, pero la API pública no deja escribirla [probable]:
  el detalle irá en la descripción.
- [ ] Conectar Strava una vez (OAuth vía Edge Function, permisos `activity:read_all` y `activity:write`)
- [ ] Al terminar una sesión, buscar en Strava la actividad que coincide en hora y cambiarle el título («Rutina core · Espalda + Brazos») y la descripción (ejercicios, rondas, repeticiones, banda y kilos)
- [ ] Si Polar aún no la ha subido, dejarla pendiente y reintentar al abrir la app; botón «Enviar a Strava» en el historial
- [ ] Hecho cuando: tras una sesión real, la actividad de Polar en Strava muestra el título y el detalle de la app

### Fase 4 · Foto de Freeletics → título y descripción en Strava ⭐
Lo mismo que la Fase 3, pero para sesiones que no haces con la app (Freeletics u otras).
- Flujo: haces la captura de la sesión de Freeletics (la de hoy, antes o después de entrenar) → la app
  la manda a la IA (Claude, a través de la Edge Function) → reconoce el nombre de la sesión, los ejercicios,
  las repeticiones y las rondas → la revisas y corriges → se guarda en el historial → la app busca en Strava
  la actividad que grabó el Polar ese día y le pone el título («Freeletics · Aphrodite») y la descripción
- [ ] Captura → IA → sesión revisable (los ejercicios que no están en el catálogo se guardan como «ejercicio externo»)
- [ ] Si la captura es de **antes** de entrenar: queda como «sesión de hoy pendiente» y se envía a Strava cuando aparece la actividad del Polar
- [ ] Si es de **después**: se envía en el momento (o queda pendiente hasta que Polar la suba)
- [ ] Elegir la actividad de Strava a mano si ese día hay varias (por ejemplo, carrera y fuerza)
- [ ] Hecho cuando: con una captura real, la actividad del Polar en Strava queda con el nombre y la descripción de la sesión de Freeletics
- Coste: unos céntimos por foto (API de IA). Necesita la Fase 2 (clave de la IA) y la Fase 3 (Strava)
- Pendiente de aclarar: ¿Freeletics sube algo a Strava por su cuenta? Tu actividad del 9 de noviembre tiene una lista
  de ejercicios en Strava (Cobra Stretch, Cat Cow, Push Up…) y hay que saber de dónde viene para no duplicar

### Fase 5 · Pulso en directo del Polar Vantage V3
- [ ] **Tú, antes (una sola vez):** en la app Polar Flow → perfil de deporte que uses para la app (p. ej. «Entrenamiento en circuito»)
  → activar «Compartir FC con otros dispositivos» → «visible para todos». También se puede en el reloj, en el modo pre-entreno:
  Ajustes → Compartir FC con otros dispositivos
- Cómo se usa: en el reloj eliges el deporte (pre-entreno) y empiezas a grabar; la app se conecta y lee el pulso.
  Si paras la grabación o sales del pre-entreno, el reloj deja de emitir
- [ ] Primer paso de la fase: pantalla «Probar pulso» para confirmar con tu reloj que el móvil lo ve y lee el pulso.
  Es lo único que no se puede comprobar sin tu reloj delante
- [ ] Leer el pulso por Bluetooth (servicio estándar de frecuencia cardíaca, 0x180D) con los permisos de Android;
  reconectar solo si se corta y seguir la sesión sin pulso si no hay reloj
- [ ] Mostrar el pulso grande y la zona en el reproductor; pulso medio y máximo por ejercicio en el historial
- [ ] Descanso inteligente (opcional): el descanso acaba al bajar de X ppm o al llegar al máximo
- [ ] Añadir el pulso por ejercicio a la descripción de Strava
- [ ] Hecho cuando: en una sesión real se ve el pulso en directo y queda guardado por ejercicio

### Fase 6 · Traer de Strava carreras y otras actividades
- [ ] Leer de Strava las actividades que no son de la app (carreras, bici…) y mostrarlas en el historial con distancia, tiempo y pulso
- [ ] Hecho cuando: una carrera grabada con el Polar aparece sola en el historial

### Fase 7 · Modos de cardio
- [ ] EMOM, Tabata y AMRAP con los ejercicios del catálogo, usando el mismo reproductor
- [ ] Con pulso (Fase 5) si está disponible

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
