# Rediseño · 3. Validación del prototipo (D3)

Revisión del prototipo (`docs/diseno/prototipo/`, con la figura 3D de D1) con tres skills de diseño: crítica heurística,
accesibilidad (WCAG 2.2 AA, claro y oscuro) y textos. Además, cuatro pruebas que pediste: el reproductor a 1–2 m,
la figura recortada en los ejercicios de pie, el rendimiento de las miniaturas 3D y el widget con el fondo elegido (**A**).
Fecha: 12 nov 2026. Severidad de 0 (nada) a 4 (impide la tarea). **Queda sin fallos de severidad 3 o 4.**

Parte de la revisión de la rama `claude/vigilant-lovelace-hb4acy` (hecha con la figura en un hueco): sus arreglos ya están
en este prototipo y se resumen al final; lo que aquí sigue se ha comprobado otra vez con la figura 3D.

Cómo se ha probado: Chromium sin pantalla (Playwright) a 360 × 640, 360 × 740 y 412 × 915, con WebGL por software
(SwiftShader). Los scripts están fuera del repo; lo que miden se explica en cada apartado.

## 1. Pruebas que pediste

### 1.1 Reproductor a 1–2 m
Se mide el alto de la mayúscula de cada texto (1 dp ≈ 0,159 mm; mayúscula ≈ 0,7 del tamaño de letra) y el ángulo que ocupa
a 1 y 2 m. Referencia: unos 16′ es lo mínimo para leer sin esfuerzo y 20–22′ lo cómodo (ISO 9241-303). [Probable: el alto de
mayúscula de Atkinson Hyperlegible es aproximado y cada móvil tiene su densidad real]

| Texto | Tamaño | A 1 m | A 2 m | Veredicto |
|---|---|---|---|---|
| Cantidad (`12 reps`, `0:30`) antes | 64–104 (360 × 640: 70) | 27–38′ | **13–19′** | En móviles pequeños, justo o por debajo a 2 m |
| Cantidad después (`p2` 72–120) | 360 × 640: 80 · 360 × 740: 93 · 412 × 915: 107 | 31–41′ | **15–21′** | Se lee a 2 m salvo en pantallas muy bajas (15′, al límite) |
| Nombre del ejercicio (`t4`, 28) | 28 | 11′ | 5′ | No se lee desde el suelo: se lee al acercarte a tocar. De lejos manda la figura |
| Clave, ritmo, «Luego» (`t2`/`t1`) | 14–16 | 5–6′ | 3′ | Solo de cerca; lo de lejos lo dan los tonos y la voz |
| Rayas de progreso | 6 → **8** px | — | 2′ → 3′ | Se ve que avanzan; el número de ronda va además en texto arriba |

Encontrado y arreglado:
- **Sev. 3 · «Prepárate» y descanso no se distinguían de la serie a 2 m.** Solo cambiaba el color de la cifra (de `#13292C` a
  `#1E6B74`: 2,5:1 entre ellos, de lejos parecen iguales) y una palabra de 16 px. Un «5» de «Prepárate» se confundía con «5 reps».
  Ahora **toda la pantalla cambia a `accion-suave`** en descanso y «Prepárate» (texto encima: 5,3:1 en claro, 5,3:1 en oscuro),
  y «PREPÁRATE · 30 S» va en el mismo estilo que «DESCANSO».
- **Sev. 2 · Cantidad pequeña en móviles de 360 dp.** `p2` pasa de 64–104 a **72–120** (`min(26vw, 12,5vh)`). En 360 × 640 la
  figura sigue teniendo ~220 dp de alto y nada se sale de la pantalla.
- **Se queda así, a propósito:** el nombre en 28 sp. Más grande se come la figura, que es lo que se entiende de lejos.
  Para C1: que la voz diga el nombre del ejercicio en «Prepárate» y al empezar cada serie (ya está la voz para contar).

### 1.2 Figura recortada en los ejercicios de pie
D2 recortaba un **15 % fijo por cada lado** a los de pie para que la persona saliera más grande. Se midió fotograma a fotograma
(6 s de bucle, hombre y mujer, 360 × 740 y 412 × 915) qué quedaba fuera: en **10 de los 12** ejercicios de pie se salía algo.

- **Sev. 4 · Se cortaba la etiqueta de la zona que trabaja**: «JUNTA ESCÁPULAS» en el remo inclinado (desaparecía entera),
  «GLÚTEO DE LADO» en el paso lateral, la flecha del ángel. Es justo lo que el reproductor tiene que enseñar.
- **Arreglo:** el encuadre se calcula por ejercicio. La primera vez que sale, se mide qué parte del ancho ocupan la figura,
  el material y las etiquetas durante todo el bucle, y se agranda hasta que eso llena el ancho (sin pasar del alto).
  Se recorta solo el aire de los lados. Resultado: ninguna etiqueta cortada; la persona sale más grande que sin recortar en los
  que tienen las etiquetas cerca (curl, fondos, toalla) y a tamaño normal en los que llevan una etiqueta en la esquina (remo).
  Cuesta ~15 dibujos pequeños la primera vez de cada ejercicio (se guarda).
- **Para C1** (en `figura/NOTAS.md`): en el remo y el psoas, las etiquetas están en la esquina del dibujo y no dejan agrandar
  la figura. Mover esas etiquetas hacia el cuerpo en `figura.js` daría más tamaño en el reproductor.

### 1.3 Rendimiento de las miniaturas 3D
PENDIENTE

### 1.4 Widget con el fondo A (elegido)
PENDIENTE

## 2. Crítica heurística (Nielsen y leyes de UX)

Pasada completa de las 36 pantallas con el método de la skill (primer vistazo de 5 s, 10 heurísticas, leyes de UX, exceso de
pasos, arquitectura de la información). Lo de la rama anterior que seguía valiendo ya estaba arreglado; lo nuevo, con la figura 3D:

| # | Fallo | Principio | Sev. | Arreglo |
|---|---|---|---|---|
| 1 | El recorte fijo de los de pie cortaba la etiqueta de la zona que trabaja (ver 1.2) | Visibilidad (H1) | 4 | Encuadre medido por ejercicio |
| 2 | Descanso y «Prepárate» iguales que la serie vistos a 2 m (ver 1.1) | Visibilidad (H1), Von Restorff | 3 | Fondo `accion-suave` en toda la pantalla |
| 3 | Cantidad por debajo de 16′ a 2 m en móviles de 360 dp | Fitts / distancia de uso | 2 | `p2` 72–120 |
| 4 | Mientras carga el 3D, la ficha y el reproductor enseñan la figura dibujada y luego cambian a la 3D | Coherencia (H4) | 2 | Se queda en el prototipo (carga de red). En C1 los modelos van dentro del APK: medir allí y, si se nota, enseñar «Cargando la figura…» hasta que esté la 3D |
| 5 | En el reproductor la figura cambia de tamaño entre ejercicios (cada uno con su encuadre) | Coherencia (H4) | 1 | A propósito: la alternativa era cortar etiquetas o verla pequeña siempre |
| 6 | Widget: la persona de pie sale pequeña en la imagen apaisada (≈100 dp de alto en el grande) | Jerarquía | 2 | Para C2: en los de pie, recortar los lados de la imagen (las del widget no llevan etiquetas, se puede) o hueco más cuadrado |
| 7 | El widget en marcha enseña la cantidad en 28 sp: no se lee desde el suelo | Distancia de uso | 1 | El widget se usa con el móvil en la mano o cerca; para lejos está la app. Se apunta, no se cambia |

Revisado y bien: una acción principal por pantalla (Empezar, Guardar y volver, Crear plan); tocar en cualquier sitio = hecho
cumple Fitts a 1–2 m; deshacer con deslizar a la derecha; parar detrás de pausa y confirmación (H5); rayas como progreso
(gradiente de meta); pantallas vacías con siguiente paso; cuatro pestañas (Hick); «Tú» junta lo que se toca una vez.

## 3. Accesibilidad (WCAG 2.2 AA, claro y oscuro)
PENDIENTE

## 4. Textos
PENDIENTE

## Lo que falta (tu visto bueno)
PENDIENTE
