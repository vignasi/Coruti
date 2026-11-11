# Plan del proyecto · Rutina core

Una fase por conversación. Cada conversación empieza con el prompt de la fase,
pregunta lo que haga falta antes de tocar código, trabaja en commits pequeños,
marca aquí lo hecho y termina dando el prompt de la fase siguiente.

**Regla de oro:** antes de empezar una fase, la anterior tiene que estar fusionada en `main`.
Cada conversación nueva parte de `main`; si no se fusiona, empieza sin los cambios anteriores.

## Decisiones tomadas

- **Strava tiene que mostrar los ejercicios (series, repeticiones, kilos)**, no una descripción.
  Strava solo los acepta al **subir** la actividad (archivo FIT con mensajes de series, o su formato JSON de fuerza);
  no se pueden añadir a una actividad que ya existe, y la API no deja borrar actividades. Por eso:
  - **Sesiones de fuerza (app o Freeletics):** el reloj va en **modo sensor de FC** (no graba; solo emite el pulso).
    La app graba el pulso y los ejercicios y **sube ella la actividad a Strava**, con los ejercicios y el pulso.
    Así Polar no sube nada de esa sesión y no hay duplicado.
  - **Carreras y lo demás:** como ahora, el Polar graba y Polar Flow sube a Strava.
  - Coste aceptado: esas sesiones de fuerza no aparecen en Polar Flow (ni en su carga de entrenamiento).
- **Material real:** bandas elásticas grandes (bucles largos y cerrados, sin asas) y una mini banda de glúteo.
  En los datos, las grandes usan la clave interna `gomas`.
- **Reloj:** Polar Vantage V3. Según la documentación de Polar puede emitir el pulso por Bluetooth de dos formas:
  en **modo sensor de FC** (el reloj no graba) o mientras graba un entreno («Compartir FC con otros dispositivos»).
  Desde el firmware 4.1.5 la emisión viene desactivada por defecto.
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
Base de todo lo demás (Strava, nube, planes). Cada serie se guarda con su hora de inicio y fin, para poder subirla a Strava.
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

### Fase 3 · Pulso en directo del Polar Vantage V3
Va antes de Strava porque la actividad que suba la app tiene que llevar el pulso.
- [ ] **Tú, antes (una sola vez):** comprobar que el reloj tiene el firmware al día
- Cómo se usa: en el reloj, modo sensor de FC (el reloj no graba); la app se conecta y lee el pulso
- [ ] Primer paso de la fase: pantalla «Probar pulso» para confirmar con tu reloj que el móvil lo ve y lee el pulso.
  Es lo único que no se puede comprobar sin tu reloj delante
- [ ] Leer el pulso por Bluetooth (servicio estándar de frecuencia cardíaca, 0x180D) con los permisos de Android;
  reconectar solo si se corta y seguir la sesión sin pulso si no hay reloj
- [ ] Guardar el pulso segundo a segundo en la sesión (para subirlo a Strava)
- [ ] Mostrar el pulso grande y la zona en el reproductor; pulso medio y máximo por ejercicio en el historial
- [ ] Descanso inteligente (opcional): el descanso acaba al bajar de X ppm o al llegar al máximo
- [ ] Hecho cuando: en una sesión real se ve el pulso en directo y queda guardado

### Fase 4 · Strava: la app sube la sesión con ejercicios y pulso ⭐ prioridad
- [ ] **Tú, antes:** registrar una app en strava.com/settings/api (gratis); el client secret se guarda en Supabase, no en el código
- [ ] Conectar Strava una vez (OAuth vía Edge Function, permisos `activity:read_all` y `activity:write`)
- [ ] Al terminar una sesión, generar un archivo FIT con el pulso y una serie por ejercicio (tipo de ejercicio FIT, repeticiones,
  kilos y duración) y subirlo como entreno de fuerza con un título claro («Rutina core · Espalda + Brazos»)
- [ ] Tabla que traduce cada ejercicio del catálogo a su ejercicio FIT (los que no tienen equivalente, al tipo más cercano)
- [ ] Si no hay conexión, queda pendiente y se reintenta; botón «Enviar a Strava» en el historial
- [ ] Si Strava responde «duplicado» (porque el reloj también grabó), avisar y explicar qué hacer
- [ ] Hecho cuando: tras una sesión real, en Strava aparece la actividad con la lista de ejercicios y el pulso
- Comprobado en tu Strava: ya muestra listas de ejercicios en actividades de fuerza (por ejemplo, la del 9 de noviembre)

### Fase 5 · Foto de Freeletics → sesión con ejercicios en Strava ⭐
- Flujo: antes de Freeletics, en la app pulsas «Grabar sesión externa» (graba solo el pulso del reloj en modo sensor);
  al acabar haces la captura de la sesión → la IA (Claude, a través de la Edge Function) reconoce el nombre, los ejercicios,
  las repeticiones y las rondas → la revisas → se sube a Strava como en la Fase 4, con ejercicios, pulso y título («Freeletics · Aphrodite»)
- [ ] Botón «Grabar sesión externa» (cronómetro + pulso, sin reproductor)
- [ ] Captura → IA → sesión revisable; los ejercicios que no estén en la tabla FIT van al tipo más cercano
- [ ] También vale la captura de antes de entrenar: queda como «sesión de hoy» y se completa al terminar la grabación
- [ ] Hecho cuando: con una sesión real de Freeletics, Strava muestra sus ejercicios y el pulso
- Coste: unos céntimos por foto (API de IA)
- Pendiente de aclarar: de dónde viene la lista de ejercicios de tu actividad del 9 de noviembre en Strava
  (¿la sube Freeletics?); si Freeletics ya sube a Strava, hay que desactivarlo para no duplicar

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
