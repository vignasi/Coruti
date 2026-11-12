# Rediseño · 2. Sistema de diseño

Las reglas con las que se construye la app nueva (C1) y el widget (C2). La referencia viva está en el prototipo
(`docs/diseno/prototipo/`, pantalla «Sistema de diseño»); los valores de aquí y de `estilos.css` son los mismos.
En Android: los colores van a `colors.xml` / tema Material 3, los tamaños de letra en **sp** (respetan el tamaño de letra del móvil)
y los espacios en **dp**.

## Idea
- **Verde azulado = lo que se toca** (botones, enlaces, seleccionado).
- **Ámbar = el cuerpo trabajando**: zona que trabaja en la figura y progreso de la serie en marcha. Nunca como texto sobre fondo claro.
- Durante la sesión manda la distancia (móvil en el suelo a 1–2 m): **la figura a toda pantalla** y la cantidad (reps o segundos) grande; lo demás, pequeño y abajo.
- Fuera de la sesión, pantallas tranquilas: una acción principal por pantalla, el resto en listas.

## Color
| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `fondo` | `#EDF1F0` (marca) | `#0E1A1C` | Fondo de pantalla |
| `capa` | `#FFFFFF` | `#16262A` | Tarjetas, listas, hojas, widget |
| `capa-2` | `#E1E8E7` | `#1E3236` | Campos, pistas, hueco de la figura |
| `tinta` | `#13292C` | `#E4EEEC` | Texto |
| `tinta-2` | `#4A5F61` | `#9DB3B1` | Texto secundario, bordes de controles |
| `linea` | `#C9D5D3` | `#2A4044` | Separadores (decorativos) |
| `accion` | `#1E6B74` (marca) | `#5FB3BC` | Botones, enlaces, seleccionado |
| `sobre-accion` | `#FFFFFF` | `#06272B` | Texto sobre `accion` |
| `accion-suave` | `#D5E6E6` | `#173D42` | Fondo de lo seleccionado |
| `trabajo` | `#F0B04A` (marca) | `#F0B04A` | Zona que trabaja, progreso de la serie |
| `sobre-trabajo` | `#13292C` | `#13292C` | Texto sobre ámbar (etiquetas de zona) |
| `bien` / `aviso` / `error` | `#276B43` / `#9A5B00` / `#B3261E` | `#6FCF97` / `#E9A33B` / `#F2B8B5` | Estados (Strava, conexiones) |

Contrastes comprobados (WCAG AA): texto ≥ 4,5:1 en los dos temas (acción sobre fondo 5,4:1; texto secundario 5,9:1;
ámbar con texto oscuro 8:1). El ámbar sobre fondo claro da 1,7:1: por eso nunca lleva texto ni es la única señal
(la barra de progreso lleva borde y el tiempo va en cifras).

## Letra
**Atkinson Hyperlegible Next** (Google Fonts, licencia OFL; ~150 KB dentro del APK), con cifras de ancho fijo
(`tnum`) para que el tiempo no baile. Su cero lleva barra: es a propósito, para no confundirlo con la O a distancia.

| Token | Tamaño | Peso | Uso |
|---|---|---|---|
| `t1` | 14 sp | 400 / 700 | Datos secundarios, etiquetas en MAYÚSCULAS (+6 % de espaciado), chips |
| `t2` | 16 sp | 400 / 700 | Texto y botones |
| `t3` | 20 sp | 700 | Títulos de sección y tarjeta; botón grande |
| `t4` | 28 sp | 700 | Título de pantalla, cifras (peso, pulso), nombre del ejercicio en la sesión |
| `p2` | 72–120 sp | 700 | Solo reproductor: cuántas (reps o segundos), según el ancho y el alto de la pantalla (`min(26vw, 12,5vh)`). Se lee a 2 m (D3) |

Cinco tamaños en total; no se inventan otros. Interlineado 1,4 en texto y 1,1–1,15 en títulos.

## Espacios, radios y tamaños
- Espacios: **4 · 8 · 12 · 16 · 24 · 32 · 48** dp. Margen lateral de pantalla 16; entre secciones 24.
- Radios: **8** campos, chips, segmentos y miniaturas · **16** tarjetas, hojas y figura grande · **redondo** botones.
- Tocable mínimo **48 dp**. Durante la sesión **toda la pantalla** es el botón «hecho».
- Filas de lista: 64 dp de alto mínimo.

## Componentes
| Componente | Cuándo | Notas |
|---|---|---|
| Botón principal | Una acción por pantalla (Empezar, Guardar, Crear plan) | Relleno `accion`, 56 dp, ancho completo |
| Botón secundario | Acción alternativa | Borde `accion` |
| Botón de texto | Acción menor (Ver plan, Guardar como favorita) | Sin borde |
| Botón de peligro | Desconectar | Borde `error`; las acciones destructivas piden confirmación en una hoja |
| Tarjeta «Hoy» | Arriba de Entrenar | Única superficie en `accion`: es lo más importante de la app |
| Lista | Casi todo | Fondo `capa`, separadores `linea`, icono 40 dp en `accion-suave` |
| Tira de la semana | Entrenar, plan por objetivo | 7 círculos: hecho (relleno), hoy (borde grueso), descanso (discontinuo), carrera (icono) |
| Chips | Filtros de zona y material | Desplazamiento horizontal; seleccionado con fondo y borde |
| Segmentos | Elegir una opción entre 2–4 (A/B, nivel, fácil/justo/demasiado) | Seleccionado con fondo y barra inferior |
| Paso (− n +) | Repeticiones, rondas, descanso, esfuerzo | Botones de 48 dp; la cifra en `t3` |
| Interruptor | Sí/no | Toda la fila es tocable |
| Estado | Strava y conexiones | Texto + icono + color; nunca solo color |
| Origen | De dónde viene una sesión | Icono + texto: Plan de Claude · Plan por objetivo · Hecha por ti · Favorita |
| Hoja inferior | Confirmar parar, elegir banda, cambiar de persona, apuntar peso | Se cierra con Atrás/Escape o tocando fuera |
| Aviso breve (toast) | Confirmar una acción | 2 s, abajo, sin botones |
| Figura | Miniatura quieta (postura clave), sin etiquetas; grande en bucle con las etiquetas de `figura.js` | Figura 3D de D1, proporción **180:112**, fondo transparente sobre `capa`; radio 8 (mini) y 16 (grande) |

### Navegación
Cuatro pestañas abajo: **Entrenar · Ejercicios · Historial · Tú** («Tú» junta perfil, peso, cuenta, Ajustes y Conexiones).
El reproductor, el final de sesión y la pantalla de entrar van sin pestañas. Las subpantallas llevan cabecera con «Atrás».

### Reproductor
Inspirado en lo que te gusta de Freeletics: pantalla limpia, la persona enorme y la información pequeña abajo.
- **La figura ocupa toda la pantalla**, sin caja ni marco, sobre fondo `capa` (blanco en claro), por debajo de la fila de arriba.
  **Encuadre por ejercicio (D3):** se mide una vez qué parte del ancho ocupan la figura, el material y las etiquetas durante el bucle
  y se agranda hasta que eso llena el ancho (sin pasar del alto). En los de pie la persona sale más grande y **nunca se corta
  una etiqueta** (con el recorte fijo de D2 se perdían «JUNTA ESCÁPULAS» o «GLÚTEO DE LADO»). Los tumbados se ven enteros a lo ancho.
  Las etiquetas (zona en ámbar, flecha, BANDA) las pone la propia figura.
- **Descanso y «Prepárate»: toda la pantalla pasa a `accion-suave`.** Es lo único que distingue la fase a 2 m (el texto no se lee de lejos).
- En el descanso, el siguiente ejercicio en pequeño, en bucle y sin etiquetas.
- **Arriba, encima de la figura y pequeño:** pausa (48 dp), «Ronda x de y · ejercicio x de y» y el pulso (o «Sin señal»).
- **Abajo, donde no se pisa**, de arriba abajo: la clave corta («Manos debajo de los hombros»), el nombre y **la cantidad en grande**
  (`12 reps` o `0:30`), una línea pequeña (ritmo y tiempo que llevas, o «Prepárate»), banda o kilos si el ejercicio los usa,
  las **rayas de progreso** y «Luego: …» con el ejercicio siguiente.
- **Rayas** (8 dp de alto): un paquete por ronda, una raya por ejercicio y una más corta y hueca para el descanso. Hecho en `accion`, el actual en `trabajo`.
- **Repeticiones: no pasan solas.** La app marca el ritmo como guía («Ritmo 7 de 12», tonos y voz) y cuenta el tiempo hacia arriba,
  pero espera a que toques la pantalla: si paras 2 s a mitad, no pasa nada. Lo que se guarda es el tiempo real de la serie.
- **Segundos y descansos:** cuenta atrás y pasan solos («Prepárate» de 5 s antes de los de segundos). Tocar adelanta.
- **Gestos:** tocar en cualquier sitio = hecho, siguiente. Deslizar a la derecha = anterior (deslizar a la izquierda = siguiente).
  Con teclado o lector de pantalla: botón «Hecho: pasar al siguiente» y flechas.
- **No hay botón de parar ni de saltar en pantalla.** La pausa abre una hoja: Seguir · Ejercicio anterior · Parar la sesión
  (que pide confirmación). La primera vez sale la pista «Toca la pantalla al acabar · desliza a la derecha para volver».

## Widget
Mismos tokens; Android limita lo que se puede dibujar, así que:
- **Fondo: `capa` de la app, claro (`#FFFFFF`) u oscuro (`#16262A`), siguiendo al tema del móvil** (**opción A, elegida** en D3).
  El fondo de hoy (`#1E6B74`) es el color de la camiseta de la figura y ella desaparece. Las dos opciones, con las imágenes reales,
  en el prototipo («Fondo del widget»):
  - **A · Fondo de la app** (elegida): la figura se ve en los dos temas, la camiseta sigue siendo del color de la marca como en la app,
    y las imágenes de claro y oscuro ya están hechas (`figura/widget/`). Se pierde el verde del widget de hoy.
  - **B · Fondo `#1E6B74` y camiseta coral (`#D9634C`)** (descartada): conserva el aspecto de hoy, pero la ropa tendría que cambiar en toda la app
    (si no, la persona cambia de ropa entre la app y el widget), el coral compite con el ámbar de la zona que trabaja y hay que rehacer las 284 imágenes.
    Imágenes de prueba en `prototipo/widget-ropa-coral/` (`figura/widget/hacer.html?top=%23D9634C`).
- Radio del sistema (Android 12+), padding 16 dp (12 en el pequeño).
- **Figura:** imagen WebP de la fase actual (`widget/{m,f}/{claro,oscuro}/<ejercicio>_<fase>.webp`, 400 × 249), sin etiquetas,
  alternando fases al ritmo del ejercicio; la de la persona y el tema elegidos. En el grande, a la izquierda (~45 % del ancho);
  en el pequeño, arriba a todo el ancho.
- Letra: `t1` para datos, `t2` para el nombre, `t4` para la cantidad. Atkinson en el widget solo si el `RemoteViews`
  lo permite (Android 12+ con `fontFamily` de recurso); si no, la del sistema: es lo único que cambia.
- Botones de 48 dp: Empezar y Hecho en `accion`; Pausa en `capa-2`.
- **Grande, antes de empezar:** segmentos Hoy · ★ Favorita · Core, figura del primer ejercicio, nombre y origen de la sesión, duración, rondas (− / +), Empezar.
- **Grande, en marcha:** ronda y pulso arriba; figura, ejercicio, cantidad, banda y siguiente; rayas de progreso; Pausa y **Hecho**.
- **Pequeño:** antes, figura, «Hoy · 19 min» y Empezar; en marcha, figura, ejercicio, cantidad y Hecho.

## Textos
- Tuteo, frases cortas, verbos en los botones (Empezar, Enviar a Strava, Crear plan, Guardar y volver).
- Los errores dicen qué pasó y qué hacer («Strava no respondió. Se volverá a intentar sola en 1 hora, o envíala ahora.»).
- Las pantallas vacías dicen qué saldrá ahí y cómo empezar.
- Mismo nombre para lo mismo en toda la app: ronda (vuelta entera), serie (un ejercicio una vez), favorita, banda, mini banda, rodillo.
