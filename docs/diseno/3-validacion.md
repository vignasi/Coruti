# Rediseño · 3. Validación del prototipo

Revisión del prototipo (`docs/diseno/prototipo/`) con tres skills de diseño: crítica heurística, accesibilidad y textos.
Fecha: 12 nov 2026. Severidad de 0 (nada) a 4 (impide la tarea). **Queda sin fallos de severidad 3 o 4.**

## 1. Crítica heurística (Nielsen y leyes de UX)

| # | Fallo encontrado | Principio | Sev. | Arreglo |
|---|---|---|---|---|
| 1 | La figura grande de la ficha y el final de algunas listas desaparecían (se encogían a 0) | Visibilidad (H1) | 4 | Nada se encoge dentro de una pantalla con scroll |
| 2 | En móviles bajos (360×680) los controles del reproductor quedaban fuera de la pantalla | Fitts, control (H3) | 4 | El tiempo se ajusta a la altura; en pantallas bajas se quita el paso escrito y la pausa pasa a 80 dp |
| 3 | La ★ de una favorita no hacía nada (solo un aviso) | Visibilidad (H1) | 3 | Marca esa favorita para el widget y quita la anterior, con aviso |
| 4 | «Puedes cambiar cualquier día» del plan, sin forma de hacerlo | Control (H3) | 3 | Hoja de cada día: hacerla hoy, cambiar por una favorita o dejar de descanso |
| 5 | Estados de Strava «error» y «duplicado» sin explicación ni salida | Errores (H9) | 3 | Detalle con qué pasó y qué hacer: Reintentar, Subirla igualmente |
| 6 | Sin pantallas vacías (primer día, historial vacío) | Pizarra en blanco | 3 | Añadidas: «Aún no tienes plan» y «Aquí saldrán tus sesiones» |
| 7 | Sin estado de pulso perdido en el reproductor | Visibilidad (H1) | 2 | «Sin señal del reloj» en gris en el mismo sitio (tocar el pulso lo simula) |
| 8 | Las carreras del historial no llevaban a ningún sitio | Navegación | 2 | Abren la actividad en Strava, con icono de enlace externo |
| 9 | «Ver la sesión» invisible en la tarjeta Hoy (blanco sobre blanco) | Jerarquía | 3 | Botón de texto en el color de la tarjeta |
| 10 | Repetición «1 / 12» durante «Prepárate» | Coherencia (H4) | 2 | Solo se ve durante la serie |
| 11 | Entrar sin forma de volver si vienes de Tú | Control (H3) | 2 | Cabecera con Atrás |
| 12 | Duración distinta en Hoy (19 min) y al terminar (38 min) | Coherencia (H4) | 2 | Mismo cálculo en las dos |

Se queda como está, a propósito:
- El nombre del ejercicio en la sesión va a 28 sp: a 2 m se lee justo. De lejos se ve la figura y la cantidad;
  el nombre se lee al acercarte a tocar. **Probar en el móvil (D3).**
- (Los controles Parar · Pausa · Saltar de la primera versión se quitaron después: ver el apartado 4.)

## 2. Accesibilidad (WCAG 2.1 AA)

Herramienta: axe-core 4.10 sobre las 33 pantallas, en claro y en oscuro, más revisión a mano.

| # | Fallo | Criterio | Sev. | Arreglo |
|---|---|---|---|---|
| 1 | Verde «bien» 4,43:1 sobre el fondo claro | 1.4.3 | Mayor | `#2E7D4F` → `#276B43` (5,6:1) |
| 2 | Borde del interruptor apagado y de los días pendientes casi invisible (1,4:1) | 1.4.11 | Mayor | Borde en `tinta-2` (5,9:1) |
| 3 | Barra de progreso ámbar sobre gris claro (1,5:1) | 1.4.11 | Menor | Borde a la barra y al relleno; el tiempo va además en cifras |
| 4 | Hojas inferiores sin nombre, sin Escape y con el foco escapándose | 2.1.2, 4.1.2 | Mayor | `role=dialog` con título, Escape cierra, el foco entra y no sale |
| 5 | Idioma de la página sin declarar | 3.1.1 | Menor | `lang=es` |
| 6 | Interruptores de 32 dp de alto | 2.5.5 | — | Falso positivo: toda la fila (64 dp) es la zona tocable |

Resultado final de axe: **0 fallos** en las 33 pantallas y los dos temas. Además: iconos con nombre (`aria-label`),
pestaña actual con `aria-current`, cambio de fase del reproductor anunciado («Prepárate», «Descanso»),
estados con texto e icono además del color, foco visible, movimiento reducido respetado.

Pendiente para C1 (no se puede comprobar en un prototipo web): TalkBack en un móvil de verdad, letra del sistema al 130 %
y 200 % (por eso los tamaños van en sp) y que el reproductor siga cabiendo con letra grande.

## 3. Textos

| Antes | Después | Por qué |
|---|---|---|
| Origen «Tuya» | «Hecha por ti» | Se entiende sola junto a «Plan de Claude» |
| «Guardar» al terminar | «Guardar y volver» | Dice lo que pasa al tocar |
| «Cambia la próxima sesión: sube o baja la carga.» | «La próxima vez se ajusta la carga de cada uno.» | Más corto y sin dos puntos |
| «Te hemos enviado un enlace…» | «Enlace enviado a … Ábrelo en este móvil para entrar. Si no llega en 2 minutos, mira en spam.» | La app no habla en «nosotros»; añade qué hacer si falla |
| «Base siempre: psoas…» | «Siempre incluye psoas…» | Frase completa |
| «Mini» en la tabla | «Mini banda» | Mismo nombre en toda la app |

Revisado y bien: botones con verbo, errores con causa y salida, confirmación de parar con su consecuencia
(«Se guarda como incompleta… No cuenta para la racha»), sin textos de relleno ni ayuda permanente.

## 4. Cambio del reproductor tras tu revisión
Pediste la figura a toda pantalla, la información pequeña abajo, rayas de progreso como Freeletics, que las repeticiones
no pasen solas y gestos en lugar de botones. Hecho, y repasado con las mismas tres skills:

| Revisión | Resultado |
|---|---|
| Crítica | Tocar en cualquier sitio cumple Fitts a 1–2 m (no hay que apuntar). Riesgo: pasar sin querer al apoyar la mano; se corrige deslizando a la derecha (anterior), sin perder nada. Parar queda detrás de pausa + confirmación (H5). Rayas = progreso visible (gradiente de meta). Sin fallos graves |
| Accesibilidad | axe 0 fallos. El contenedor tocable no es un botón con botones dentro: hay un botón real «Hecho: pasar al siguiente» para lector de pantalla y teclado, y flechas izquierda/derecha |
| Textos | «Toca al acabar», «Ritmo 7 de 12», «Prepárate · 30 s», «Toca para seguir ya», «En pausa», «Ejercicio anterior», «Parar la sesión» |
| Pantallas bajas | En 360×700 la figura sigue teniendo 450 px y todo cabe sin desplazar |

Decidido distinto de lo que dijiste: **deslizar a la derecha = anterior** (y a la izquierda = siguiente), como pasar páginas en Android.
Si de verdad lo quieres al revés, es un cambio de una línea.

## Lo que falta (D3)
Tu visto bueno en el móvil. Sobre todo: leer el reproductor desde el suelo a 1–2 m, y si las cuatro pestañas y el
contenido de «Tú» te encajan.
