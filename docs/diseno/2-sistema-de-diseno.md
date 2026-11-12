# Rediseño · 2. Sistema de diseño

Las reglas con las que se construye la app nueva (C1) y el widget (C2). La referencia viva está en el prototipo
(`docs/diseno/prototipo/`, pantalla «Sistema de diseño»); los valores de aquí y de `estilos.css` son los mismos.
En Android: los colores van a `colors.xml` / tema Material 3, los tamaños de letra en **sp** (respetan el tamaño de letra del móvil)
y los espacios en **dp**.

## Idea
- **Verde azulado = lo que se toca** (botones, enlaces, seleccionado).
- **Ámbar = el cuerpo trabajando**: zona que trabaja en la figura y progreso de la serie en marcha. Nunca como texto sobre fondo claro.
- Durante la sesión manda la distancia (móvil en el suelo a 1–2 m): figura, tiempo y repetición enormes; todo lo demás, pequeño o fuera.
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
| `p1` | 44 sp | 700 | Solo reproductor: repetición |
| `p2` | 72–132 sp | 700 | Solo reproductor: tiempo (30 % del ancho, menos en pantallas bajas) |

Seis tamaños en total; no se inventan otros. Interlineado 1,4 en texto y 1,1–1,15 en títulos.

## Espacios, radios y tamaños
- Espacios: **4 · 8 · 12 · 16 · 24 · 32 · 48** dp. Margen lateral de pantalla 16; entre secciones 24.
- Radios: **8** campos, chips, segmentos y miniaturas · **16** tarjetas, hojas y figura grande · **redondo** botones.
- Tocable mínimo **48 dp**; durante la sesión **72 dp** (Parar, Saltar) y **96 dp** el botón de pausa (80 en pantallas bajas).
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
| Hueco de la figura | Miniatura 1:1 sin etiquetas; grande 4:3 con etiqueta de zona en ámbar | D1 lo rellena |

### Navegación
Cuatro pestañas abajo: **Entrenar · Ejercicios · Historial · Tú** («Tú» junta perfil, peso, cuenta, Ajustes y Conexiones).
El reproductor, el final de sesión y la pantalla de entrar van sin pestañas. Las subpantallas llevan cabecera con «Atrás».

### Reproductor
Arriba: cerrar, «Ejercicio x de y · Ronda x de y», pulso (o «Sin señal del reloj»). En medio la figura, que ocupa el espacio libre.
Abajo, de grande a pequeño: tiempo, repetición, barra ámbar, «Luego: …», banda o kilos, y los tres controles (Parar · Pausa · Saltar).
«Parar» y la X piden confirmación en una hoja. «Prepárate» y «Descanso» ponen el tiempo en `accion`.

## Widget
Mismos tokens; Android limita lo que se puede dibujar, así que:
- Fondo `capa`, radio del sistema (Android 12+), padding 16 dp (12 en el pequeño).
- Letra: `t1` para datos, `t2`/`t3` para el nombre, `t4` para el tiempo. Atkinson en el widget solo si el `RemoteViews`
  lo permite (Android 12+ con `fontFamily` de recurso); si no, la del sistema: es lo único que cambia.
- Botones de 48 dp: Empezar/Pausa en `accion`; Parar y Saltar en `capa-2`.
- **Grande, antes de empezar:** segmentos Hoy · ★ Favorita · Core, nombre y origen de la sesión, duración, rondas (− / +), Empezar.
- **Grande, en marcha:** miniatura de la figura, ejercicio, repetición y ronda, tiempo, barra ámbar, Parar · Pausa · Saltar.
- **Pequeño:** antes, «Hoy · 19 min», nombre y Empezar; en marcha, ejercicio, tiempo y Pausa.

## Textos
- Tuteo, frases cortas, verbos en los botones (Empezar, Enviar a Strava, Crear plan, Guardar y volver).
- Los errores dicen qué pasó y qué hacer («Strava no respondió. Se volverá a intentar sola en 1 hora, o envíala ahora.»).
- Las pantallas vacías dicen qué saldrá ahí y cómo empezar.
- Mismo nombre para lo mismo en toda la app: ronda (vuelta entera), serie (un ejercicio una vez), favorita, banda, mini banda, rodillo.
