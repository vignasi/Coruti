# Rediseño · 1. Funcionalidades

Qué tiene que hacer Rutina core y qué necesitas en cada momento. **No describe el diseño actual**: es la base
para diseñar las pantallas desde cero (Fase 1c del ROADMAP). Si algo falta o sobra, se corrige aquí antes de dibujar nada.

## Para quién y en qué situación

- Una persona (tú), entrenando en casa, varias veces por semana. Muchas sesiones las haces con otra app (Freeletics);
  esta la usas sobre todo para **uno o dos ejercicios sueltos de fuerza** y para la **rutina de core** diaria.
- **Durante el ejercicio el móvil está en el suelo, a 1–2 m**, y tienes las manos ocupadas (bandas, mancuernas).
  Lo que importa se tiene que leer de lejos y oír sin mirar (tonos en cada repetición, voz).
- Grabas con el reloj Polar a la vez. En el futuro la app subirá las series a Strava (por eso guarda horas exactas).

## Momentos y lo que necesitas en cada uno

### A. Empezar a entrenar (lo más frecuente: tiene que ser 1 toque)
1. **Tus favoritas** (combinaciones guardadas de ejercicios sueltos): verlas y empezar una con un toque.
2. **Rutina completa de hoy:** base de core + módulos de fuerza (Abdomen, Pecho, Espalda, Brazos, Glúteo),
   con alternancia automática día A / día B, nivel por módulo (Suave / Normal / Fuerte) y de 1 a 6 rondas.
   Ver de un vistazo qué toca hoy y cuánto dura; cambiarlo solo si quieres.
3. **Sesión nueva de ejercicios sueltos:** elegir uno o varios del catálogo, repeticiones (o segundos) de cada uno,
   rondas, descanso y si van alternados (superserie). Guardarla como favorita.
4. Estado del día: si hoy ya está hecho y la racha de días seguidos.

### B. Durante la sesión (a 1–2 m del móvil)
1. **Qué hago ahora:** nombre del ejercicio y el dibujo animado del movimiento, con el paso actual
   («Sube las manos a los hombros; los codos no se mueven»).
2. **Cuánto falta:** tiempo de la serie (lo más grande de la pantalla), repetición actual de cuántas,
   ronda o serie de cuántas, barra de progreso.
3. **Lo que viene:** «Prepárate» antes de cada ejercicio con su nombre; siguiente ejercicio y tiempo total que queda.
4. **Controles:** pausa / seguir, saltar, parar. Grandes y difíciles de tocar sin querer.
5. **Ajustes en marcha** (solo si el ejercicio los usa): kilos usados (± medio kilo) y qué banda llevas.
   Se recuerdan para la próxima vez.
6. Sonido: tono agudo al subir, grave al bajar, cuenta en voz alta opcional, «mitad» y pitidos finales.
   La pantalla no se apaga.

### C. Al terminar
1. Confirmación clara de que está hecho (y que cuenta para la racha).
2. **¿Cómo te ha ido?** por módulo: fácil / justo / demasiado → el nivel sube o baja la próxima vez.
3. Recordatorio para Polar («Entrenamiento en circuito»), mientras no exista la subida automática.
4. Repetir o volver.

### D. Ejercicios (catálogo)
1. **Cuadrícula de miniaturas con el nombre debajo**; filtrar por zona (Core, Glúteo, Espalda, Pecho, Brazos, Movilidad)
   y por material (sin material, bandas grandes, mini banda, mancuernas, correas).
2. **Ficha de un ejercicio:** el movimiento entero animado, los pasos, las claves de técnica, la dosis orientativa,
   el material, vídeos en YouTube, y lo que hiciste la última vez y tu mejor marca.
3. Añadir el ejercicio a una sesión de sueltos desde la ficha.

### E. Historial
1. Sesiones por días (rutina o sueltos, desde la app o el widget; las paradas a mitad marcadas como incompletas).
2. Detalle de una sesión: cada serie con repeticiones o segundos, kilos, banda y hora.
3. Por ejercicio: la última vez y la mejor.

### F. Ajustes (se tocan una vez)
1. **Material que tienes** (correas, mancuernas, bandas grandes, mini banda): decide qué variante sale de cada ejercicio.
2. **Mis bandas grandes:** nombres (color o dureza).
3. Sonido: contar en voz alta. Volumen: menos volumen en cada ronda (opcional).
4. **Copia de seguridad:** exportar e importar.
5. Qué hace el widget: rutina completa o una favorita (★).

### G. Widget en la pantalla de inicio
1. Empezar sin abrir la app lo elegido (rutina o favorita), y cambiar entre las dos.
2. Durante la sesión: ejercicio, dibujo, tiempo, repetición, ronda; pausa, saltar, parar.
3. Antes de empezar: rondas (− / +) y, en la rutina, módulos, A/B e intensidad.
4. Widget pequeño: empezar / pausa y lo mínimo (ejercicio, tiempo).

## Lo que viene después (dejar sitio, no diseñarlo todavía)
- Pulso en directo del Polar y zona (Fase 3) → hueco en el reproductor y en el historial.
- Enviar a Strava, pendientes y reintentos (Fase 4) → estado por sesión en el historial.
- Foto de Freeletics → sesión con ejercicios (Fase 5) → entrada desde Entrenar o Historial.
- Carreras y otras actividades traídas de Strava (Fase 6) → aparecen en el historial.
- Modos de cardio EMOM, Tabata, AMRAP (Fase 7) → otro tipo de sesión en Entrenar.
- Coach por voz y planes por objetivo (Fases 8 y 9).

## Requisitos que el diseño tiene que respetar
- Funciona sin conexión; todo va dentro del APK.
- Modo claro y oscuro (sigue al móvil).
- Todo lo tocable de al menos 48 dp; durante la sesión, más grande.
- Lo importante en la sesión, legible a 1–2 m; el resto, sin texto de ayuda permanente
  (las explicaciones solo donde hagan falta, o la primera vez).
- Colores de la marca actual: verde azulado `#1E6B74` (acción y lo que se toca), ámbar `#F0B04A`
  (lo que trabaja el cuerpo en los dibujos), fondo gris verdoso claro `#EDF1F0`; en oscuro, sus equivalentes.
- Nada de lo que ya funciona se pierde: historial, copias, favoritas, bandas, pesos, racha, widget.
