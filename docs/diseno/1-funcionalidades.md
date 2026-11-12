# Rediseño · 1. Funcionalidades

Qué tiene que hacer Rutina core y qué necesitas en cada momento. **No describe el diseño actual**: es la base
para diseñar las pantallas desde cero (paso D2 del ROADMAP; el diseño está en `2-sistema-de-diseno.md` y `prototipo/`). Si algo falta o sobra, se corrige aquí antes de dibujar nada.

## Para quién y en qué situación

- Una persona (tú), entrenando en casa, varias veces por semana. Muchas sesiones las haces con otra app (Freeletics);
  esta la usas sobre todo para **uno o dos ejercicios sueltos de fuerza** y para la **rutina de core** diaria.
- **Durante el ejercicio el móvil está en el suelo, a 1–2 m**, y tienes las manos ocupadas (bandas, mancuernas).
  Lo que importa se tiene que leer de lejos y oír sin mirar (tonos en cada repetición, voz).
- Grabas con el reloj Polar a la vez. En el futuro la app subirá las series a Strava (por eso guarda horas exactas).

## Momentos y lo que necesitas en cada uno

### A. Empezar a entrenar (lo más frecuente: tiene que ser 1 toque)
1. **Tus favoritas:** combinaciones guardadas de ejercicios sueltos **y también la rutina completa de core**, si la marcas.
   Verlas y empezar una con un toque. Las que marques son las que salen primero (y en el widget).
2. **Rutina completa de core** (pensada también para alguien de nivel sencillo; tú no la usas a diario,
   así que no ocupa el centro salvo que la marques como favorita): base de core + módulos de fuerza (Abdomen, Pecho, Espalda, Brazos, Glúteo),
   con alternancia automática día A / día B, nivel por módulo (Suave / Normal / Fuerte) y de 1 a 6 rondas.
   Ver de un vistazo qué toca hoy y cuánto dura; cambiarlo solo si quieres.
3. **Sesión nueva de ejercicios sueltos:** elegir uno o varios del catálogo, repeticiones (o segundos) de cada uno,
   rondas, descanso y si van alternados (superserie). Guardarla como favorita.
4. Estado del día: si hoy ya está hecho y la racha de días seguidos.

### B. Durante la sesión (a 1–2 m del móvil)
1. **Qué hago ahora: el movimiento es lo principal de la pantalla.** Se ve a una **persona** haciendo el ejercicio
   (no un muñeco de palitos), en bucle, con el paso actual («Sube las manos a los hombros; los codos no se mueven»)
   y el nombre del ejercicio. Tiene que entenderse a 1–2 m.
2. **Cuánto:** las repeticiones o los segundos, en grande debajo de la figura. Las repeticiones no tienen tiempo fijo:
   la app marca el ritmo como guía pero **no pasa al siguiente hasta que tocas la pantalla** (cada uno tarda lo suyo y a veces
   hay que parar 2 s). Los segundos y descansos sí cuentan atrás y pasan solos. Progreso en rayas: un paquete por ronda,
   una raya por ejercicio y una para el descanso.
3. **Lo que viene:** «Prepárate» antes de cada ejercicio con su nombre; siguiente ejercicio y tiempo total que queda.
4. **Controles:** toda la pantalla es «hecho, siguiente»; deslizar a la derecha vuelve al anterior. Un botón pequeño de pausa
   con Seguir, Ejercicio anterior y Parar (con confirmación). Sin botones de parar ni saltar a la vista.
5. **Ajustes en marcha** (solo si el ejercicio los usa): kilos usados (± medio kilo) y qué banda llevas.
   Se recuerdan para la próxima vez.
6. Sonido: tono agudo al subir, grave al bajar, cuenta en voz alta opcional, «mitad» y pitidos finales.
   La pantalla no se apaga.

### B2. Antes y después: rodillo
Ejercicios con **rodillo de espuma** (sin motor) para calentar (antes) y recuperar (después), por zona. Se pueden añadir al principio o al final
de una sesión o hacer solos.

### C. Al terminar
1. Confirmación clara de que está hecho (y que cuenta para la racha).
2. **¿Cómo te ha ido?** por módulo: fácil / justo / demasiado → el nivel sube o baja la próxima vez.
3. Recordatorio para Polar («Entrenamiento en circuito»), mientras no exista la subida automática.
4. Repetir o volver.

### D. Ejercicios (catálogo)
1. **Cuadrícula de miniaturas con el nombre debajo** (la miniatura es la persona en la postura clave);
   filtrar por zona (Core, Glúteo, Espalda, Pecho, Brazos, Movilidad, Calentar y recuperar)
   y por material (sin material, bandas grandes, mini banda, rodillo, mancuernas).
2. **Ficha de un ejercicio:** el movimiento entero animado, los pasos, las claves de técnica, la dosis orientativa,
   el material, vídeos en YouTube, y lo que hiciste la última vez y tu mejor marca.
3. Añadir el ejercicio a una sesión de sueltos desde la ficha.

### E. Historial
1. Sesiones por días (rutina o sueltos, desde la app o el widget; las paradas a mitad marcadas como incompletas).
2. Detalle de una sesión: cada serie con repeticiones o segundos, kilos, banda y hora.
3. Por ejercicio: la última vez y la mejor.

### F. Ajustes (se tocan una vez)
1. **Material que tienes:** bandas grandes (largas), mini banda (de muslos), rodillo de masaje y mancuernas
   (ahora sin usar: falta una pieza). Decide qué variante sale de cada ejercicio. **Sin correas TRX**: se quitan.
2. **Mis bandas grandes:** nombres (color o dureza).
3. Sonido: contar en voz alta. Volumen: menos volumen en cada ronda (opcional).
4. **Copia de seguridad:** exportar e importar.
5. Qué hace el widget: sesión de hoy, rutina completa o una favorita (★).
6. Figura: hombre o mujer (ver M).

### G. Widget en la pantalla de inicio
1. Empezar sin abrir la app lo elegido (sesión de hoy, favorita o rutina de core), y cambiar entre ellas.
2. Durante la sesión: figura del ejercicio, nombre, cantidad, ronda, siguiente, pulso; Pausa y Hecho (como tocar la pantalla en la app).
3. Antes de empezar: rondas (− / +) y, en la rutina, módulos, A/B e intensidad.
4. Widget pequeño: figura, empezar o hecho y lo mínimo (ejercicio, cantidad).

## También entra en el diseño (aunque se construya más tarde)
El diseño se hace una vez y completo. Estas pantallas y piezas tienen que existir ya en el prototipo:

### H. Claude como entrenador (conector propio, B2)
1. **Conectar:** en Tú → Conexiones → Claude, el estado (conectado o no, cuándo leyó por última vez) y tres pasos cortos:
   añadir conector personalizado en Claude, pegar la dirección (botón Copiar) y entrar con el email de la cuenta.
   Avisa de que hace falta un plan de Claude con conectores personalizados y de que sin él la app funciona igual (planes por objetivo).
2. **Qué ve Claude:** perfil y objetivo, peso y medidas, historial con series, kilos, bandas, pulso y «fácil / justo / demasiado»,
   favoritas, plan actual y el catálogo con el material que tienes.
3. **Qué hace Claude:** crear o cambiar sesiones (ejercicios, reps, rondas, descanso, bandas), el plan de la semana, favoritas,
   y apuntar peso o medidas.
4. **En la app:** «Hoy» con la sesión de Claude lista para empezar con un toque; en la sesión, el origen («Plan de Claude»),
   cuándo la cambió y su **nota** («Hoy subo 2 reps el remo: el lunes lo marcaste como fácil»).
5. Desconectar en una hoja con confirmación. Lo que Claude cambia llega en la siguiente sincronización.

### I. Planes por objetivo (P2, sin Claude)
1. Elegir objetivo (fuerza, músculo, cardio, movilidad), semanas (4, 6 u 8) y qué días; con el material que tienes.
2. La app prepara cada sesión y la ajusta con el historial y el «fácil / justo / demasiado». **Cada vez que repites, una sesión distinta.**
3. Sustituye al de Claude si lo hay (se puede volver). Origen visible en cada sesión: Plan de Claude · Plan por objetivo · Hecha por ti · Favorita.

### I2. Calendario (plan de la semana)
1. En Entrenar, tira de la semana: hecho, hoy, pendiente, descanso y carrera (con su icono).
2. Pantalla «Plan de la semana»: cada día con su sesión, quién la creó y si está hecha. Las carreras dicen que se graban con el reloj
   y llegan desde Strava.
3. Tocar un día: hacerla hoy, cambiarla por una favorita o dejarlo de descanso. Un día pasado abre su sesión del historial.

### J. Perfil, cuentas y varias personas (B1)
1. Entrar con email y un código de 6 cifras (decidido en B1) o seguir sin cuenta, solo en el móvil. Salir deja los datos en el móvil.
2. Perfil: nombre y objetivo en palabras («ganar fuerza sin dolor de espalda»).
3. **Varias personas** (tú, tu mujer…), cada una con su cuenta y solo sus datos: historial, favoritas, bandas, plan, peso y figura.
   En el mismo móvil se cambia de persona desde Tú (hoja «¿Quién entrena?»); si queda algo de la anterior sin subir, no deja cambiar.
4. Copia de seguridad: en la nube con la cuenta; y a un archivo (exportar e importar, combina sin duplicar).

### J2. Peso y medidas (P3)
1. Peso y cintura (y otras medidas opcionales) con fecha y origen: a mano, archivo de la báscula o desde Claude.
2. Gráfica en Tú (pequeña) y pantalla propia con la gráfica grande, la tabla y «Apuntar».
3. Sin juicios en los textos: se muestra el cambio («−1,2 kg en 8 semanas»), no si está bien o mal.

### K. Strava y Polar (S1)
1. En cada sesión del historial, estado de Strava con texto e icono: En Strava · Pendiente · No se pudo subir · Ya estaba en Strava · De Strava.
   Botón «Enviar a Strava» en las no subidas; el detalle de un error dice qué pasó y qué hacer (Reintentar, Subirla igualmente).
2. En Tú → Conexiones: Strava (subir al terminar, traer carreras) y Polar (cuenta de Polar Flow, para el archivo con el pulso).
3. Al terminar una sesión: esfuerzo (1–10) y cómo te has sentido; van a Strava con los ejercicios, series, kilos y pulso.
4. Recordatorio del reloj: guardar la grabación como «Entrenamiento en circuito».

### L. Pulso (P1)
1. En el reproductor, arriba y pequeño: pulso y zona (Z1–Z5); «Sin señal» en gris si se corta (sin alarmas).
2. Pulso medio y máximo por sesión y por ejercicio en el historial.
3. Pantalla «Probar pulso» con los pasos para que el reloj emita (Compartir FC → visible para todos) y un interruptor para usarlo o no.

### M. Figura del ejercicio (D1, cerrado)
1. **Figura 3D** (modelos propios de MakeHuman, CC0), la misma en toda la app: miniatura quieta en la postura clave (cuadrícula y listas),
   movimiento en bucle en la ficha y a toda pantalla en el reproductor.
2. **Hombre o mujer**, a elegir en Tú → Figura; cada persona de la cuenta tiene la suya. Vista previa en grande.
3. Etiquetas solo en grande: punto ámbar en la zona que trabaja, flecha del movimiento, «AQUÍ ESTIRA», «BANDA».
4. Si el móvil no tiene WebGL, sale la figura dibujada (`figura.js`), que es el respaldo.
5. **Personalización (más adelante):** complexión y músculo (deformaciones que ya lleva el modelo), color de piel, pelo y camiseta.
   Opcional, con textos neutros («complexión», nunca «gordito») y sin ligarla al peso real salvo que se pida.
   El widget necesitaría rehacer sus imágenes en el móvil al cambiarla. En el prototipo ya funciona (pantalla «Personalizar»).

### G2. Widget con la figura
El widget no puede mostrar 3D: usa imágenes WebP hechas antes, una por fase (71 por sexo, claro y oscuro), y las alterna.
Fondo: ver `2-sistema-de-diseno.md` → Widget (el fondo de hoy es del color de la camiseta).

### Más adelante (dejar sitio, sin pantalla propia todavía)
Modos de cardio EMOM, Tabata y AMRAP; coach por voz; carreras traídas de Strava en el historial (ya salen como ejemplo).

## Decisiones tomadas
- **Figura 3D, hombre y mujer** (D1, noviembre de 2026), en vez de la dibujada; la dibujada queda como respaldo.
  Sin conexión, igual en todos los ejercicios y sin coste. Pesa unos 5–6 MB en la APK (three.js, dos modelos e imágenes del widget).
- Material real: bandas grandes, mini banda, rodillo de espuma; mancuernas más adelante; sin correas TRX.
- Reproductor: tocar la pantalla = hecho; deslizar a la derecha = anterior; pausa con Seguir, Anterior y Parar (confirmado).
- Entrar con código de 6 cifras por email (B1).

## Requisitos que el diseño tiene que respetar
- Funciona sin conexión; todo va dentro del APK (también la figura 3D). Con cuenta, se sincroniza al volver la conexión.
- Modo claro y oscuro (sigue al móvil).
- Todo lo tocable de al menos 48 dp; durante la sesión, más grande.
- Lo importante en la sesión, legible a 1–2 m; el resto, sin texto de ayuda permanente
  (las explicaciones solo donde hagan falta, o la primera vez).
- Colores de la marca actual: verde azulado `#1E6B74` (acción y lo que se toca), ámbar `#F0B04A`
  (lo que trabaja el cuerpo en los dibujos), fondo gris verdoso claro `#EDF1F0`; en oscuro, sus equivalentes.
- Nada de lo que ya funciona se pierde: historial, copias, favoritas, bandas, pesos, racha, widget.
