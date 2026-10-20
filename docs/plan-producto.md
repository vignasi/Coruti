# Plan de producto: de "Rutina core" a una app de entrenamiento para gente normal

Fecha: octubre de 2026. Estado: borrador para decidir, no hay código escrito de nada de esto.

Este documento planifica la evolución de la app Android personal "Rutina core" (repo `vignasi/Coruti`) en dos horizontes:

1. **Primero, vosotros dos.** Que tu mujer y tú tengáis cada uno su cuenta, sus planes, su historial, su racha y sus pesos, sin perder lo que ya funciona bien (animaciones con la zona que se aprieta marcada, modo guiado con voz y sonido, widget con reproductor).
2. **Después, el mundo.** Que la misma base sirva para una app freemium dirigida a gente que no es profesional pero tiene un objetivo pequeño y concreto: fortalecer el glúteo, quitar barriga, corregir la postura, ponerse en forma en casa con poco material. Inspirada en lo que funciona de Freeletics y BetterMe, pero sin sus patrones oscuros y con coste de operación mínimo.

Decisiones ya tomadas contigo antes de escribir esto:

| Pregunta | Respuesta |
|---|---|
| Móvil de tu mujer | Android |
| Tecnología | La que mejor escale, aunque suponga cambiar de lenguaje |
| Monetización futura | Freemium con suscripción |
| Tiempo disponible | 10 a 15 horas por semana |
| Módulos opcionales (abdomen, pecho, espalda, brazos, intensidades, pesos) | Solo en papel; en el repo hay 5 ejercicios |

---

## Índice

1. [Visión y usuarios](#1-visión-y-usuarios)
2. [Alcance por fases](#2-alcance-por-fases)
3. [Plataforma y arquitectura](#3-plataforma-y-arquitectura)
4. [Backend y login](#4-backend-y-login)
5. [Modelo de datos](#5-modelo-de-datos)
6. [Biblioteca de ejercicios y animaciones](#6-biblioteca-de-ejercicios-y-animaciones)
7. [Ideas a valorar](#7-ideas-a-valorar)
8. [Distribución](#8-distribución)
9. [Privacidad](#9-privacidad)
10. [Riesgos, preguntas abiertas y esfuerzo](#10-riesgos-preguntas-abiertas-y-esfuerzo)
- [Anexo A: punto de partida (lo que hay en el repo)](#anexo-a-punto-de-partida)
- [Anexo B: qué copiar y qué no de Freeletics y BetterMe](#anexo-b-qué-copiar-y-qué-no-de-freeletics-y-betterme)
- [Anexo C: fuentes consultadas](#anexo-c-fuentes-consultadas)

---

## 1. Visión y usuarios

### 1.1 Visión en una frase

> Una app que te dice qué hacer hoy, te guía con voz mientras lo haces sin mirar el móvil, y te enseña con un dibujo qué tienes que apretar. Para personas con un objetivo pequeño y poco material.

Lo que la diferencia de Freeletics o BetterMe no es la cantidad de contenido, sino tres cosas que ya tienes y que ellas no hacen bien:

- **El dibujo dice qué apretar.** La figura marca "APRIETA EL CULO" y "OMBLIGO DENTRO" en el momento justo. Es la diferencia entre hacer un puente de glúteo y hacerlo bien.
- **Se entrena sin mirar el móvil.** Voz por repetición, pitidos, widget con reproductor. El móvil se queda en el suelo.
- **Es honesta y corta.** Sesiones de 10 a 25 minutos, un objetivo, sin cuestionarios eternos ni "tu plan personalizado está al 97 %".

### 1.2 Usuarios

**Usuario 1: tú.**
Objetivo: corregir la anteversión pélvica y mantener core y postura. Rutina diaria corta (la actual, 3 rondas, unos 15 minutos) y módulos opcionales de fuerza con correas de suspensión y mancuernas 2 o 3 días por semana. Tienes reloj Polar y te gustaría que la sesión quedara registrada. Eres quien mantiene la app.

**Usuario 2: tu mujer.**
Objetivo: pendiente de concretar contigo (ver preguntas abiertas), pero del tipo "fortalecer glúteo y pierna" o "tonificar en casa". Android. Quiere poder elegir cada día entre repetir lo de ayer o cambiar de zona (glúteo, abdomen, brazos, espalda), con el mismo material que tú. No va a crear ejercicios ni editar JSON: elige, entrena y ve su progreso.

**Usuario 3 (fase 2): "la persona con un objetivo pequeño".**
Perfil tipo: entre 25 y 55 años, no va al gimnasio o lo ha dejado, tiene una esterilla y como mucho unas mancuernas o unas correas, se ve la pierna o la barriga y quiere algo concreto. Lo que le frustra de otras apps: demasiadas opciones, ejercicios que no sabe si hace bien, suscripciones con trampa. Lo que necesita: que alguien le diga "hoy toca esto, son 18 minutos, dale".

**Usuario 4 (más adelante): "el que ya sabe".**
Quiere montarse sus planes, llevar pesos y ver progresión. Es tu propio perfil. No es el objetivo principal del producto, pero el editor de planes del MVP ya le sirve.

### 1.3 Casos de uso

| Caso de uso | Quién | Cómo tiene que funcionar |
|---|---|---|
| Hacer la rutina de hoy desde el widget | Los dos | Pulsar "Empezar" en el widget, dejar el móvil en el suelo, seguir la voz y los pitidos. Al acabar, el día queda marcado y la racha sube. Sin abrir la app. |
| Entrenar sin mirar el móvil | Los dos | Voz anuncia ejercicio, lado, tiempo o repeticiones; pitido en cada repetición o cada 10 segundos en los de mantener; aviso de descanso; vibración al cambiar. Funciona con pantalla apagada y en segundo plano. |
| Elegir qué hacer hoy | Tu mujer | Abrir la app y ver una tarjeta "Hoy": el plan activo propone una sesión, pero puede cambiarla por "repetir ayer" o "otra zona" en dos toques. |
| Ver el dibujo de un ejercicio antes de hacerlo | Los dos | Tocar el ejercicio y ver la animación en bucle con las zonas marcadas y la señal clave. |
| Montar un plan propio | Tú (y ella si quiere) | Elegir ejercicios de la biblioteca filtrando por zona y material, ordenarlos, poner series o rondas, tiempos, intensidad. Guardar con nombre. |
| Registrar pesos y repeticiones | Los dos | En los ejercicios con mancuernas, al acabar la serie la voz pregunta nada; la app muestra el peso orientativo del rango y permite tocar "+2,5 / -2,5" o "igual". Se recuerda para la siguiente vez. |
| Ver historial y racha | Los dos | Calendario de días hechos, racha actual y mejor racha, minutos por semana, pesos por ejercicio con su evolución. |
| Cambiar de móvil o reinstalar | Los dos | Entrar con la cuenta y recuperar todo. |
| Compartirle un plan a tu mujer | Tú | Botón "Compartir" en el plan, ella lo acepta y aparece en sus planes como copia editable. |
| Empezar desde cero (fase 2) | Usuario nuevo | Tres preguntas (objetivo, material, minutos al día), un plan de 4 semanas y la primera sesión en menos de 2 minutos desde la instalación. |
| Decir "me ha costado" (fase 2) | Usuario nuevo | Al acabar: "¿Fácil, justo o duro?". La siguiente sesión ajusta intensidad o pesos. |

### 1.4 Lo que NO es este producto

- No es una app de seguimiento de dieta ni de peso corporal.
- No sustituye a un fisioterapeuta: para dolor o lesión, deriva.
- No es una red social. Como mucho, compartir planes con personas concretas.
- No es para gimnasio con máquinas. Material: cuerpo, esterilla, correas de suspensión, mancuernas, bandas. Sin banco.

---

## 2. Alcance por fases

Tres fases. Cada una tiene un criterio de "hecho" que se puede comprobar con hechos, no con sensaciones.

### Fase 0: cimientos (antes del MVP, 2 a 3 semanas)

No añade funciones visibles, pero hace posible todo lo demás. Es el trabajo que, si se salta, se paga tres veces después.

Funcionalidades:
- Separar **dominio** (modelo de ejercicio, motor de pasos, lógica de sesión) de **plataforma** (WebView, widget, servicio) en un módulo Kotlin puro sin dependencias de Android. Hoy `Model.kt`, `Data.kt` y `Workout.kt` ya son casi puros; `Store.kt` y el resto no.
- Formalizar el formato de ejercicio como **Exercise JSON v1** (ver apartado 6) y mover los 5 ejercicios actuales a `content/exercises/*.json`. `Data.kt` pasa a generarse o a cargarse desde ese JSON. Hoy el comentario de `Data.kt` dice "Generado a partir de la rutina web, no editar a mano": ese flujo se invierte, el JSON manda.
- Un único renderer de poses en Kotlin (hoy hay dos: el canvas de `index.html` y `PoseRenderer.kt` para el widget). Decisión de arquitectura: ver apartado 3.
- Base de datos local con Room en lugar de SharedPreferences, con las tablas del apartado 5 ya en su forma final aunque solo se usen algunas.
- Tests del motor de sesión (pasos, tiempos, fases, racha) porque es lo que no puede romperse.

Criterio de hecho:
- La app hace exactamente lo mismo que hoy desde el punto de vista del usuario (misma rutina, mismo widget, misma voz).
- Los 5 ejercicios se cargan desde JSON y el renderer es uno solo.
- La racha y los días hechos migran automáticamente de SharedPreferences a Room al abrir la app actualizada, sin perder nada.
- Hay tests que cubren `buildSteps`, `phaseAt`, el cálculo de racha y la migración.

### Fase 1: MVP, "lo usamos los dos" (8 a 11 semanas)

Funcionalidades:

1. **Cuentas y perfil.** Login con Google y enlace mágico por email. Perfil con nombre, material disponible, unidades. Al entrar, cada uno ve lo suyo.
2. **Biblioteca inicial de 20 a 25 ejercicios.** Los 5 actuales más, como mínimo: glúteo y pierna (puente a una pierna, sentadilla, zancada, peso muerto rumano con mancuernas, hip thrust en suelo), abdomen (plancha lateral, bicho muerto con mancuerna, crunch inverso, pallof con banda o correa), espalda (remo con correas, remo con mancuerna, superman, face pull con correas), pecho (flexiones, flexiones con correas, press de suelo con mancuernas), brazos (curl con mancuernas, curl con correas, extensión de tríceps con correas, fondos en silla). Cada uno con zona, material, intensidades Suave/Normal/Fuerte, rangos de peso orientativos y señales clave. Animación obligatoria para los de suelo; los de pie pueden entrar sin animación (texto + voz) en el MVP.
3. **Planes.** Crear, editar, duplicar y borrar planes propios. Un plan es una lista ordenada de bloques; cada bloque tiene ejercicios con series o rondas, tiempo o repeticiones, descanso e intensidad. El plan actual de postura y core es el primer plan "oficial" y viene de serie. Un plan puede marcarse como "activo".
4. **Tarjeta "Hoy".** Propone la sesión del plan activo; permite "repetir ayer" o elegir otro plan en dos toques.
5. **Modo guiado** para cualquier plan (hoy solo funciona con la rutina fija): voz, pitidos por repetición, descansos, vibración, pantalla apagada, widget con reproductor. Es la pieza más delicada porque `WorkoutService` y `Widgets` hoy asumen la rutina fija (`ROUND` y `buildSteps(rounds)`).
6. **Registro.** Al acabar: día hecho, duración, y para ejercicios con peso, el peso usado por serie con "+/igual/-". Historial por usuario, calendario, racha actual y mejor, minutos por semana, evolución de pesos por ejercicio.
7. **Sincronización.** Todo funciona sin red; cuando la hay, sube y baja cambios. Reinstalar o cambiar de móvil recupera todo.
8. **Compartir un plan** con el otro usuario por código corto (copia editable).
9. **Distribución:** sigue siendo APK por Releases, igual que hoy.

Fuera del MVP a propósito: onboarding por objetivo, planes generados, feedback post-sesión, recordatorios, suscripción, iOS, integraciones con relojes.

Criterio de hecho (todos a la vez):
- Tu mujer ha entrado con su cuenta, tiene un plan propio con al menos 8 ejercicios de 3 zonas distintas y ha completado **2 semanas seguidas** usándolo.
- Al menos 5 de esas sesiones las ha hecho desde el widget **sin tocar el móvil** entre el "Empezar" y el final.
- Tú has seguido tu rutina diaria y tu racha no se ha roto por culpa de la app (contando la migración).
- Uno de los dos ha reinstalado la app o cambiado de móvil y ha recuperado planes, historial, racha y pesos.
- Los dos habéis usado la app una semana entera en modo avión al menos una sesión y los datos se han sincronizado después sin duplicados.
- Ningún ejercicio de la biblioteca está sin: nombre, zona, material, intensidades, señal clave, texto para la voz.

### Fase 2: "lista para terceros" (10 a 14 semanas)

Funcionalidades:

1. **Onboarding en 3 preguntas**: objetivo (glúteo y pierna, abdomen y postura, cuerpo entero, brazos y espalda), material (nada, mancuernas, correas, bandas), minutos al día (10, 15, 25). Nada más.
2. **Planes generados por plantilla**: para cada combinación objetivo × material × tiempo, un plan de 4 semanas construido con reglas (no con IA en tiempo real) a partir de la biblioteca. Las plantillas las escribes tú y se revisan.
3. **Feedback post-sesión** ("fácil / justo / duro") que ajusta la siguiente sesión: intensidad, descansos o peso orientativo.
4. **Progresión semanal**: semana 1 a 4 suben volumen o intensidad siguiendo la plantilla.
5. **Recordatorios**: hora elegida en el onboarding, notificación local, "no molestar" en fin de semana si se quiere.
6. **Biblioteca ampliada a 50 a 60 ejercicios** con animación en todos los que lo necesiten (vista lateral y frontal).
7. **Freemium**: gratis = rutina de postura y core, 1 plan generado, biblioteca básica (unos 20 ejercicios), historial de 30 días. Premium = toda la biblioteca, planes ilimitados, progresión automática, historial completo, compartir. Precio de referencia a decidir: entre 2,99 y 4,99 euros al mes o 19,99 a 29,99 al año (BetterMe cobra mucho más; Freeletics unos 35 a 80 euros al año según oferta). RevenueCat sobre Google Play Billing.
8. **Google Play**: prueba interna (vosotros), prueba cerrada (12 testers, 14 días), producción.
9. **Legal y privacidad**: política de privacidad, términos, descargo de responsabilidad en el primer uso, exportar y borrar cuenta desde la app, formulario Data Safety de Play.
10. **Analítica mínima** sin datos de salud (apertura, sesión empezada, sesión acabada, paso del onboarding) para saber dónde se cae la gente.
11. **Accesibilidad básica**: tamaños de texto, contraste, voz configurable (velocidad, silenciar pitidos).

Criterio de hecho:
- 10 personas que no sois vosotros (amigos, familia) han instalado por prueba cerrada y al menos 5 han completado 2 semanas con un plan generado.
- El tiempo desde instalar hasta terminar la primera sesión es menor de 20 minutos en la mediana (medido con la analítica).
- La compra de Premium funciona en sandbox y en producción con una compra real tuya, y cancelar la restaura correctamente.
- El proceso de exportar y borrar cuenta funciona de punta a punta y borra de verdad.
- Google Play ha aprobado la app en producción.
- Ningún plan generado contiene un ejercicio que requiera material que el usuario dijo no tener.

### Fase 3: "más adelante" (sin fecha, por orden de valor)

1. **iOS** con dominio compartido vía Kotlin Multiplatform, interfaz en SwiftUI, widget con WidgetKit, Sign in with Apple. Entre 120 y 180 horas, más Mac y cuenta de Apple.
2. **Health Connect** (Android) para escribir cada sesión como entrenamiento de fuerza; de ahí la leen Polar Flow, Samsung Health, Google Fit y otras. **Strava** por API para crear la actividad. Polar AccessLink directo queda descartado (apartado 7).
3. **Progresión automática de pesos** con doble progresión y RPE.
4. **Editor de ejercicios dentro de la app** (hoy, editor web en el repo).
5. **Retos y rachas compartidas** entre dos personas ("los dos hemos entrenado 5 días esta semana").
6. **Localización** a inglés y catalán. La voz usa TTS del sistema, así que el coste es traducir textos.
7. **Vídeo corto opcional** por ejercicio, si el dibujo no basta para los de pie.
8. **Tablet y web de solo lectura** para montar planes desde el ordenador.

---

## 3. Plataforma y arquitectura

### 3.1 Qué tiene que seguir funcionando

Las tres cosas que no se pueden perder son también las tres más difíciles de hacer en cualquier framework multiplataforma:

| Capacidad | Cómo está hecha hoy | Qué exige la plataforma |
|---|---|---|
| Widget con reproductor | `Widgets.kt`: dos `AppWidgetProvider` con `RemoteViews`, imagen de la pose dibujada en `PoseRenderer.kt` | En Android el widget corre en el proceso del launcher: solo `RemoteViews` o Glance, nunca una vista de React, Flutter o web. En iOS, WidgetKit exige Swift y SwiftUI, siempre. |
| Voz y pitidos en segundo plano | `WorkoutService.kt`: servicio en primer plano con `specialUse`, `TextToSpeech`, `ToneGenerator`, vibración, wake lock | Servicio en primer plano nativo con notificación. Android 14 exige declarar el tipo y justificarlo en Play. En iOS, audio en segundo plano requiere la capacidad "audio" y mantener una sesión de audio activa. |
| Sin conexión | Todo local en SharedPreferences | Base de datos local y sincronización con cola de cambios. |

Conclusión que condiciona todo: **el widget y el audio en segundo plano se escriben en código nativo da igual el framework que elijas**. Cambiar de framework no ahorra la parte difícil y obliga a reescribir la que ya funciona.

### 3.2 Comparación de opciones

Criterios, de más a menos importante para este producto: widget, voz y sonido en segundo plano, offline, iOS futuro, reutilizar lo que ya hay, velocidad para una sola persona a 10 a 15 horas por semana, coste.

| Criterio | Android nativo (Kotlin) + KMP después | Flutter | React Native / Expo | PWA + Capacitor |
|---|---|---|---|---|
| Widget Android | Nativo, ya hecho. Glance para modernizar. | Plugin `home_widget` + código Kotlin propio para dibujar la pose. | Plugin de configuración + Kotlin/Glance propio. No hay solución oficial para Android. | Plugin comunitario inmaduro; en la práctica, Kotlin propio. |
| Widget iOS (futuro) | Swift + WidgetKit, como todos. | Swift + WidgetKit. | `expo-widgets` en alpha o recién estable según la fuente; alternativa `@bacons/apple-targets`, que es Swift igualmente. | Swift + WidgetKit. |
| Voz y sonido en segundo plano | Nativo, ya hecho. | `flutter_tts` + `audio_service` + servicio en primer plano propio. Funciona, con trabajo. | Módulo nativo propio; Expo no cubre un temporizador con TTS en segundo plano. | Muy limitado: el WebView se pausa en segundo plano. Requiere servicio nativo igual. |
| Offline | Room, control total. | Drift o Isar, control total. | SQLite o WatermelonDB, control total. | IndexedDB, suficiente para datos; el widget no puede leerlo. |
| Animaciones de poses | Compose Canvas desde JSON, mismo código que el widget. | CustomPainter desde JSON; el widget lo dibuja aparte en Kotlin (dos renderers). | Skia/canvas desde JSON; widget aparte en Kotlin (dos renderers). | Canvas HTML actual tal cual; widget aparte en Kotlin (dos renderers). |
| Reutiliza lo que hay | Todo menos el HTML. | Nada del Kotlin, sí la lógica como referencia. | Reutiliza el HTML/JS del canvas; nada del Kotlin. | Reutiliza casi todo el HTML; nada del Kotlin. |
| iOS en el futuro | KMP comparte dominio y sync (60 a 70 % del código no visual); UI en SwiftUI. | Una sola UI para ambos, salvo widget y servicio. | Una sola UI para ambos, salvo widget y servicio. | Una sola UI, pero sin widget ni audio en segundo plano fiable. |
| Velocidad para 1 persona | Alta ahora (ya conoces el stack y hay base). | Media: reescritura completa, curva de Dart. | Media: reescritura del Kotlin, y los módulos nativos siguen siendo Kotlin y Swift. | Alta al principio, se atasca en widget y audio. |
| Coste | 0. | 0. | 0 (EAS Build tiene plan gratuito limitado). | 0. |
| Riesgo principal | Dos bases de código de UI cuando llegue iOS. | Tirar lo que funciona; dos renderers de poses. | Tirar lo que funciona; dependencia de plugins para lo crítico. | No cumple widget ni audio en segundo plano. |

### 3.3 Recomendación: Android nativo evolucionado, con el dominio preparado para Kotlin Multiplatform

**Qué significa en concreto:**

1. **La app sigue siendo Android nativa en Kotlin.** Se moderniza la interfaz con Jetpack Compose (hoy es un WebView dentro de una `Activity`), se guarda en Room, el widget se migra a Glance cuando convenga (no es urgente, `RemoteViews` funciona).
2. **Se abandona el WebView.** La animación pasa a un `Canvas` de Compose alimentado por el mismo JSON que usa el widget. `PoseRenderer.kt` ya dibuja la figura con la misma lógica que `index.html`: se convierte en el único renderer y el HTML desaparece. Ventajas: un solo código de dibujo, sin puente JavaScript (`Bridge` en `MainActivity.kt`), sin dos copias de los datos (`Data.kt` dice literalmente "generado a partir de la rutina web").
3. **El dominio vive en un módulo Kotlin puro** (`:core` o similar) sin ninguna importación de `android.*`: modelo de ejercicio y plan, motor de sesión (`buildSteps`, `phaseAt`, temporizador lógico), cálculo de racha, reglas de progresión, lógica de sincronización. Desde el primer día se estructura como un módulo Kotlin Multiplatform aunque solo tenga target Android: así cuando llegue iOS se añade el target sin reescribir.
4. **iOS, cuando toque**, se hace con SwiftUI para la interfaz, WidgetKit para el widget y una capa fina de Swift para audio, consumiendo el módulo KMP. Alternativa dentro de la misma decisión: Compose Multiplatform para compartir también la UI principal (no el widget), a evaluar cuando llegue la fase.

**Por qué esta y no Flutter o React Native:**

- Las dos piezas más difíciles (widget y servicio con voz) ya están hechas y probadas en Kotlin, y en cualquier otro framework habría que volver a escribirlas en Kotlin de todos modos.
- A 10 a 15 horas por semana, una reescritura completa consume el tiempo que debería ir a contenido (ejercicios y planes), que es lo que de verdad hace vendible el producto.
- Tu mujer tiene Android. iOS es fase 3. Decidir hoy un framework por un requisito de dentro de un año o más es pagar por adelantado algo que puede cambiar.
- KMP comparte lo que importa compartir (reglas, datos, sync) y deja nativo lo que tiene que ser nativo (widget, audio, UI del sistema). Es exactamente el perfil de esta app.

**Cuándo tendría sentido Flutter en su lugar:** si iOS pasara a ser prioridad en los próximos 6 meses y aceptaras reescribir todo. Es la segunda mejor opción y se documenta aquí para no reabrir el debate: Flutter con `home_widget`, `audio_service`, `flutter_tts`, Drift para datos y un renderer en `CustomPainter`. PWA + Capacitor queda descartada porque no cumple ni widget ni audio en segundo plano. React Native queda por detrás de Flutter en este caso porque sus soluciones de widget son menos maduras y el audio en segundo plano requiere módulo nativo propio igualmente.

### 3.4 Arquitectura objetivo (Android)

```
app/                         Android: Compose UI, Glance widget, WorkoutService, Room, Google Sign-In
├── ui/                      pantallas: Hoy, Biblioteca, Planes, Editor de plan, Sesión, Historial, Perfil
├── widget/                  Glance/RemoteViews + PoseRenderer (bitmap)
├── service/                 WorkoutService (foreground), TTS, tonos, vibración, wake lock
├── data/                    Room (entidades del apartado 5), repositorios, cola de sincronización
└── sync/                    cliente Supabase, auth, push/pull

core/  (Kotlin puro, listo para KMP)
├── model/                   Exercise, Variant, Plan, Session, SetLog, Preferences
├── engine/                  SessionEngine (pasos, tiempos, fases), StreakCalculator, ProgressionRules
├── content/                 carga y validación de Exercise JSON v1
└── sync/                    reglas de fusión (last-write-wins por updated_at), outbox

content/                     fuera del código, versionado en git
├── exercises/*.json         un archivo por ejercicio (Exercise JSON v1)
├── plans/*.json             planes oficiales y plantillas por objetivo
└── schema/exercise.v1.json  esquema JSON para validar en CI

tools/
└── pose-editor/index.html   editor web sencillo de poses (apartado 6)
```

**Flujo de una sesión guiada**, para comprobar que el diseño aguanta un plan cualquiera y no solo la rutina fija:

1. La UI o el widget piden al `SessionEngine` del módulo `core` que construya la lista de pasos a partir de un `Plan` (hoy `buildSteps(rounds)` solo sabe de `ROUND`).
2. `WorkoutService` arranca en primer plano con esa lista serializada, lleva el reloj, lanza voz y pitidos y publica el estado (paso actual, segundos, ronda) en Room.
3. El widget y la pantalla de sesión leen ese estado y lo pintan; el widget dibuja la pose con `PoseRenderer`.
4. Al terminar, el servicio escribe `workout_session` y `set_logs` en Room y encola la sincronización. La racha se calcula al leer, no se guarda.

**Qué cambia respecto a hoy:** `WorkoutService`, `Widgets` y `Workout` dependen de `ROUND`, `EXERCISES` y `buildSteps(rounds)`. Pasan a recibir un plan. Es el cambio más delicado del MVP y conviene hacerlo en fase 0 con tests.

### 3.5 Si tu mujer hubiera tenido iPhone (o cuando alguien lo tenga)

Aunque hoy no aplica, para que quede escrito:

- **Widget**: WidgetKit obliga a Swift y SwiftUI. No hay forma de dibujar un widget iOS desde Kotlin, Dart o JavaScript. El renderer de poses se reescribiría en SwiftUI (unas 150 líneas, es un dibujo de líneas).
- **Audio en segundo plano**: capacidad "Background Modes: Audio" y una `AVAudioSession` activa mientras dura la sesión; `AVSpeechSynthesizer` para la voz. iOS mata apps que abusan; una sesión de entrenamiento de 20 minutos es un uso legítimo y aceptado.
- **Cuenta de desarrollador de Apple**: 99 dólares al año, obligatoria para distribuir a otra persona. Sin ella solo se puede instalar en el propio iPhone desde Xcode con firma personal, que caduca cada 7 días. No es una opción real para tu mujer.
- **Mac**: imprescindible para compilar. Alternativa: compilar en la nube (GitHub Actions tiene runners macOS, más caros por minuto; Codemagic o similares tienen plan gratuito limitado).
- **Instalación**: TestFlight (hasta 10.000 testers, caduca a los 90 días por build, se renueva subiendo otra) para vosotros y para la prueba cerrada; App Store para público. Sign in with Apple es obligatorio si ofreces login con Google.
- **Esfuerzo**: con el dominio en KMP, entre 120 y 180 horas para paridad con Android (UI, widget, audio, login, revisión de App Store).

---

## 4. Backend y login

### 4.1 Qué necesita el backend

Poco: autenticar a dos (y luego a muchas) personas, guardar sus datos de forma que nadie más los lea, sincronizar entre dispositivos, servir el catálogo de ejercicios y planes oficiales, y comprobar quién ha pagado. No necesita lógica en tiempo real, ni procesamiento pesado, ni archivos grandes (las animaciones son JSON de unos pocos KB).

### 4.2 Supabase frente a Firebase

| Criterio | Supabase | Firebase |
|---|---|---|
| Base de datos | Postgres relacional. Encaja con planes → bloques → ejercicios → series. SQL, claves foráneas, vistas. | Firestore (documentos). Encaja peor con relaciones; obliga a duplicar datos. |
| Seguridad por usuario | Row Level Security: una política por tabla ("`user_id = auth.uid()`") y queda cerrado. Fácil de auditar. | Reglas de seguridad propias. Funcionan, pero son más fáciles de dejar mal. |
| Login | Google, enlace mágico, Apple, email y contraseña. Incluido. | Igual o más completo. Incluido. |
| Offline en el cliente | No lo trae de serie. Hay que hacer offline-first propio (Room + cola) o usar PowerSync (tiene plan gratuito). | Firestore trae caché offline y sincronización automática. Es su gran ventaja. |
| Plan gratuito (octubre 2026, según fuentes de terceros; confirmar en la web oficial) | 2 proyectos, 50.000 usuarios activos al mes en auth, 500 MB de base de datos, entre 500 MB y 1 GB de archivos según fuente. **El proyecto se pausa tras 7 días sin actividad** y hay que reactivarlo a mano. | Plan Spark sin pausa. Cuotas diarias de lecturas y escrituras en Firestore, suficientes de sobra para dos personas y para cientos. |
| Región UE | Sí, se elige al crear el proyecto (Frankfurt, entre otras). | Sí, Firestore permite `eur3` o regiones europeas al crearlo. |
| Dependencia del proveedor | Baja: es Postgres, se exporta con `pg_dump` y se puede alojar en otro sitio. | Alta: Firestore no tiene equivalente fuera de Google. |
| Funciones en servidor | Edge Functions (Deno) en el plan gratuito. | Cloud Functions requieren plan Blaze (de pago por uso, con cuota gratuita). |
| Coste cuando haya ventas | Pro: 25 dólares al mes, elimina la pausa, 100.000 MAU, 8 GB de base de datos. | Blaze: pago por uso; para miles de usuarios de esta app, probablemente entre 0 y 10 dólares al mes. |

**Recomendación: Supabase**, región Frankfurt, por tres razones: el modelo de datos es relacional de verdad (apartado 5), RLS hace que la privacidad de datos de salud sea una política por tabla y no una colección de reglas, y no te ata al proveedor. La pausa por inactividad es el único inconveniente serio y tiene dos mitigaciones: mientras seáis dos, un ping semanal desde GitHub Actions (una llamada a una función que hace un `select 1`) mantiene el proyecto activo; cuando se venda, el plan Pro de 25 dólares al mes lo elimina y cabe en el margen de unas pocas suscripciones.

**Cuándo elegir Firebase en su lugar:** si no quisieras escribir la sincronización offline tú mismo. Es trabajo real (unas 20 a 30 horas en el MVP) y Firestore te lo da hecho. A cambio, el modelo de datos sería peor y la salida más cara. Para esta app, el trabajo de sync merece la pena porque el dominio es pequeño y las reglas de fusión son simples.

### 4.3 Sincronización sin conexión

Principio: **el móvil es la fuente de verdad y el servidor es la copia**. La app tiene que funcionar entera sin red, incluido el widget.

- **Base local**: Room con todas las tablas del apartado 5. Cada fila lleva `id` (UUID generado en el cliente), `user_id`, `updated_at` y `deleted_at` (borrado lógico, nunca físico, para que el borrado se propague).
- **Outbox**: cada cambio local escribe la fila y una entrada en una tabla `sync_queue` (tabla, id, operación). Un `WorkManager` con restricción de red vacía la cola en orden.
- **Pull**: al abrir la app y tras cada push, se piden las filas con `updated_at` mayor que la última marca conocida por tabla.
- **Conflictos**: último cambio gana por `updated_at`. Es suficiente porque un usuario normalmente tiene un solo móvil, y porque lo que puede chocar (un plan editado en dos sitios) es raro y poco grave. Las sesiones y los registros de series nunca chocan: cada uno tiene su UUID y solo se crean, no se editan.
- **Catálogo**: ejercicios y planes oficiales van empaquetados en el APK (`content/`) y además se sirven desde Supabase con una versión; la app descarga novedades cuando hay red. Así se pueden corregir textos o añadir ejercicios sin publicar versión.
- **Widget**: lee solo Room. Nunca espera a la red.

### 4.4 Login

| Opción | Pros | Contras | Decisión |
|---|---|---|---|
| Google | Un toque, sin contraseña, los dos tenéis cuenta. Credential Manager en Android. | Dependencia de Google; en iOS obliga a añadir Apple. | **Principal** |
| Enlace mágico por email | Sin contraseña, funciona para cualquiera, sin dependencias. | Hay que salir al correo; el enlace tiene que abrir la app (App Links). Supabase lo trae. | **Respaldo** en MVP y opción por defecto para quien no quiera Google |
| Email y contraseña | Universal. | Contraseñas que olvidar, recuperación, más superficie de ataque. | No en MVP |
| Sign in with Apple | Obligatorio en iOS si hay Google. | Solo iOS. | Fase 3 |
| Anónimo con vinculación posterior | Entrar sin cuenta y crearla después sin perder datos. Reduce abandono en el onboarding. | Más complejidad. | Fase 2, vale la pena para el público |

Sesiones: tokens de Supabase guardados en `EncryptedSharedPreferences`; refresco automático; sin red se sigue usando la app con la sesión caducada porque los datos son locales.

### 4.5 Monetización (fase 2)

- **Google Play Billing** para la suscripción (obligatorio en Play para contenido digital).
- **RevenueCat** como intermediario: gestiona recibos, renovaciones, periodos de prueba y entitlements, y avisa al servidor por webhook. Plan gratuito hasta 2.500 dólares al mes de ingresos; después, un porcentaje pequeño. Evita escribir validación de recibos y facilita añadir iOS.
- **Entitlement en servidor**: tabla `entitlements` en Supabase rellenada por el webhook de RevenueCat. El cliente la cachea y la usa también offline (con margen de unos días).
- **Qué es gratis y qué no** (propuesta, apartado 2, fase 2): lo gratis tiene que ser útil de verdad (la rutina de postura y core completa y un plan generado), lo de pago tiene que ser "más", no "lo básico desbloqueado".

### 4.6 Coste mensual estimado

| Concepto | Vosotros dos | Primeros 500 usuarios | Primeros 5.000 |
|---|---|---|---|
| Supabase | 0 (Free, con ping semanal) | 0 o 25 $ (Pro si molesta la pausa) | 25 $ |
| RevenueCat | 0 | 0 | 0 hasta 2.500 $/mes de ingresos |
| Google Play | 25 $ una sola vez | 0 | 0 |
| GitHub Actions | 0 (repo público) o dentro de los minutos gratuitos | 0 | 0 |
| Dominio (política de privacidad, enlaces mágicos) | 0 (GitHub Pages) o unos 10 €/año | 10 €/año | 10 €/año |
| Apple (si iOS) | 99 $/año | 99 $/año | 99 $/año |
| **Total mensual** | **0 €** | **0 a 25 €** | **~25 €** |

---

## 5. Modelo de datos

### 5.1 Principios

- Cada fila de datos personales lleva `user_id` y una política RLS: solo su dueño la lee y escribe. Sin excepciones.
- Catálogo (ejercicios, variantes, material, planes oficiales) es de solo lectura para usuarios y lo escribes tú o una cuenta de administración.
- La racha no se guarda: se calcula a partir de los días con sesión completada (como hace hoy `Store.streak`). Lo que se guarda es la sesión.
- Todo lo que el usuario crea tiene `id` UUID generado en el cliente, `created_at`, `updated_at`, `deleted_at`. Es lo que hace posible la sincronización.
- El contenido de un ejercicio (poses, fases) es un JSON versionado dentro de la fila, no se descompone en tablas: se lee entero, no se consulta por dentro.

### 5.2 Diagrama

```
profiles ──< user_equipment >── equipment
   │
   ├──< preferences
   ├──< plans ──< plan_days ──< plan_blocks ──< plan_items >── exercise_variants >── exercises
   │                                                                                    │
   ├──< workout_sessions ──< set_logs ──────────────────────────────────────────────────┘
   ├──< plan_shares (como emisor o receptor)
   └──< entitlements

exercises ──< exercise_variants
exercises >──< equipment (vía exercise_equipment)
```

### 5.3 Entidades

**profiles** (uno por usuario de auth)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | = `auth.users.id` |
| display_name | text | |
| locale | text | `es-ES` |
| units | text | `kg` o `lb` |
| created_at, updated_at | timestamptz | |

**equipment** (catálogo)
`id`, `key` (`none`, `mat`, `dumbbells`, `suspension`, `band`, `chair`), `name`.

**user_equipment**
`user_id`, `equipment_id`, y para mancuernas `available_weights` (array de kg: `[4, 6, 8, 10]`), `updated_at`. Sirve para filtrar la biblioteca y para proponer el peso real que tienes y no "7,5 kg" cuando no existe.

**exercises** (catálogo)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| key | text | único, estable: `puente`, `deadbug`… |
| name | text | |
| zones | text[] | `gluteo`, `pierna`, `abdomen`, `espalda`, `pecho`, `brazos`, `movilidad`, `postura` |
| goals | text[] | `postura`, `gluteo`, `barriga`, `fuerza_general` |
| type | text | `hold` (mantener), `reps` (repeticiones), `breath` (respiraciones) |
| default_unit | text | `seg`, `rep`, `resp` |
| cues | text[] | señales clave (hoy `cues` en el HTML) |
| contraindications | text[] | "no hacer con dolor lumbar agudo" |
| content | jsonb | Exercise JSON v1: poses, fases, etiquetas, vista. Versión en `content.version` |
| has_animation | bool | para permitir ejercicios solo con texto y voz |
| is_published | bool | |
| created_at, updated_at | timestamptz | |

**exercise_equipment**: `exercise_id`, `equipment_id`, `required` (bool). "Remo con correas" requiere `suspension`; "Puente" no requiere nada.

**exercise_variants** (catálogo)
Una variante es el mismo ejercicio con otra intensidad, otro material o como progresión o regresión.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| exercise_id | uuid | |
| key | text | `puente.una_pierna`, `flexiones.rodillas` |
| name | text | |
| intensity | text | `suave`, `normal`, `fuerte` |
| relation | text | `base`, `easier`, `harder` |
| default_duration_s / default_reps | int | lo que se propone al añadirla a un plan |
| rep_seconds | numeric | segundos por repetición para la voz y el pitido (hoy `rep` en `Exercise`) |
| weight_range_kg | numrange | orientativo, por intensidad |
| voice_text | text | lo que dice la voz al empezar (hoy `say` en `RoundStep`) |
| content_override | jsonb | si la animación cambia respecto al ejercicio base |

**plans**

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| user_id | uuid, null | null = plan oficial del catálogo |
| name, description | text | |
| goal | text | |
| weeks | int | null = sin fin (rutina diaria) |
| source_plan_id | uuid, null | de qué plan se copió (compartido o generado) |
| is_active | bool | el que propone "Hoy" |
| created_at, updated_at, deleted_at | timestamptz | |

**plan_days**
`id`, `plan_id`, `index` (1..n), `name` ("Glúteo y pierna", "Postura diaria"), `week` (null si se repite cada semana). Un plan de "rutina diaria" tiene un solo día.

**plan_blocks**
`id`, `plan_day_id`, `index`, `kind` (`warmup`, `main`, `circuit`, `cooldown`), `rounds` (para circuitos; hoy "1 a 6 rondas"), `rest_between_rounds_s`.

**plan_items**
`id`, `plan_block_id`, `index`, `variant_id`, `sets`, `target_reps` o `target_duration_s`, `per_side` (bool: hoy "rodilla izquierda / derecha"), `rest_s`, `intensity` (puede anular la de la variante), `notes`.

**workout_sessions**

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| user_id | uuid | |
| plan_id, plan_day_id | uuid, null | null si fue una sesión libre |
| started_at, finished_at | timestamptz | |
| completed | bool | false si se abandonó |
| rounds_done | int | |
| feedback | text, null | `easy`, `ok`, `hard` (fase 2) |
| source | text | `app`, `widget` |
| created_at, updated_at, deleted_at | timestamptz | |

**set_logs**
`id`, `session_id`, `user_id`, `variant_id`, `set_index`, `reps` o `duration_s`, `weight_kg`, `rpe` (null en MVP), `side` (`L`, `R`, null), `created_at`. Es la tabla que crece; nunca se edita, solo se crea.

**daily_checkins**: no existe como tabla. "Día hecho" = existe una `workout_session` con `completed = true` ese día en la zona horaria del usuario. La racha se calcula con la misma lógica que `Store.streak` hoy (si hoy no está hecho, cuenta hasta ayer). Para el widget se guarda en caché local, no en el servidor.

**preferences**
`user_id`, `voice_enabled`, `voice_rate`, `beeps_enabled`, `vibration_enabled`, `prep_seconds` (hoy `PREP_S = 8`), `rest_seconds` (hoy `REST_S = 20`), `reminder_time`, `reminder_days`, `updated_at`.

**plan_shares**
`id`, `plan_id`, `from_user_id`, `code` (6 caracteres), `to_user_id` (null hasta que se acepta), `expires_at`, `accepted_at`. Al aceptar, se copia el plan entero (con días, bloques e ítems) al receptor con `source_plan_id` apuntando al original. No se comparte "en vivo": cada uno edita su copia.

**entitlements** (fase 2)
`user_id`, `product` (`premium`), `active` (bool), `expires_at`, `store` (`play`, `app_store`), `updated_at`. La escribe el webhook de RevenueCat con la clave de servicio; el usuario solo la lee.

### 5.4 Políticas RLS (resumen)

| Tabla | Lectura | Escritura |
|---|---|---|
| profiles, preferences, user_equipment, plans (con user_id), plan_days/blocks/items (vía plan), workout_sessions, set_logs | `user_id = auth.uid()` | `user_id = auth.uid()` |
| exercises, exercise_variants, equipment, exercise_equipment, plans oficiales (`user_id is null`) | cualquier usuario autenticado, solo `is_published` | solo rol de servicio |
| plan_shares | emisor o receptor | emisor crea; receptor solo actualiza `to_user_id` y `accepted_at` |
| entitlements | `user_id = auth.uid()` | solo rol de servicio |

### 5.5 Migración desde lo que hay

Hoy `Store.kt` guarda en SharedPreferences un conjunto de fechas (`days`), `rounds` y `lastRounds`. La migración en fase 0: por cada fecha, crear una `workout_session` completada con `plan_id` = plan oficial de postura y core, `started_at` a las 12:00 de ese día, `rounds_done = lastRounds` (o 3). `rounds` pasa a `plan_blocks.rounds` del plan oficial del usuario. Se hace una sola vez al arrancar y se marca como hecha.

---

## 6. Biblioteca de ejercicios y animaciones

### 6.1 Lo que ya existe y hay que formalizar

El formato actual, repartido entre `index.html` y `Data.kt`, ya es bueno. Lo que falta es declararlo, validarlo y sacarlo del código.

Una figura es un conjunto de 12 puntos en un lienzo de 180 × 112 (vista lateral): `h` cabeza, `s` hombro, `c` centro del tronco (opcional, para curvar la espalda), `p` pelvis, `k1`/`a1` rodilla y tobillo de la pierna cercana, `k2`/`a2` de la lejana, `e1`/`w1` codo y muñeca del brazo cercano, `e2`/`w2` del lejano. Una fase apunta a una pose, dura `move` segundos de transición más `hold` segundos quieta, lleva un texto (`cap`), las zonas que se marcan (`sq`: `gl` glúteo, `ab` abdomen), una flecha opcional y si se resalta un segmento como "estiramiento". El renderer interpola entre poses, dibuja el lado lejano en un color apagado y el cercano en blanco, marca las zonas apretadas en ámbar con su etiqueta, y pinta el suelo.

### 6.2 Exercise JSON v1

Un archivo por ejercicio en `content/exercises/<key>.json`, validado contra `content/schema/exercise.v1.json` en GitHub Actions (el workflow actual `build.yml` añade un paso de validación antes de compilar).

```json
{
  "version": 1,
  "key": "puente",
  "name": "Puente de glúteo",
  "type": "reps",
  "zones": ["gluteo", "postura"],
  "goals": ["postura", "gluteo"],
  "equipment": [],
  "view": "side",
  "cues": [
    "Boca arriba, rodillas dobladas y pies apoyados",
    "Sube apretando el culo, no la lumbar",
    "Arriba, el cuerpo forma una línea recta de rodillas a hombros"
  ],
  "contraindications": [],
  "voice": { "start": "Puente de glúteo, quince repeticiones" },
  "rep_seconds": 4,
  "default_reps": 15,
  "points": ["h", "s", "p", "k1", "a1", "k2", "a2", "e1", "w1", "e2", "w2"],
  "poses": [
    { "h": [26, 94], "s": [40, 97], "p": [90, 98], "k1": [120, 74], "a1": [135, 100], "k2": [118, 75], "a2": [133, 100], "e1": [60, 100], "w1": [78, 100], "e2": [60, 100], "w2": [78, 100] },
    { "h": [28, 93], "s": [46, 95], "p": [95, 72], "k1": [126, 67], "a1": [135, 100], "k2": [124, 68], "a2": [133, 100], "e1": [64, 100], "w1": [82, 100], "e2": [64, 100], "w2": [82, 100] }
  ],
  "phases": [
    { "pose": 1, "move": 1.0, "hold": 1.0, "caption": "Sube en 1 s apretando el culo y aguanta 1 s arriba", "squeeze": ["gl"], "arrow": [108, 96, 108, 70] },
    { "pose": 0, "move": 1.5, "hold": 0.5, "caption": "Baja despacio (2 s) con el ombligo dentro", "squeeze": ["ab"] }
  ],
  "labels": { "gl": [135, 28], "ab": [40, 62] },
  "offsets": { "gl": [-2, 5], "ab": [0, -7] },
  "variants": [
    { "key": "puente.una_pierna", "name": "Puente a una pierna", "relation": "harder", "intensity": "fuerte", "per_side": true, "default_reps": 10, "voice": { "start": "Puente a una pierna, diez por lado" } },
    { "key": "puente.mancuerna", "name": "Puente con mancuerna en la cadera", "relation": "harder", "intensity": "fuerte", "equipment": ["dumbbells"], "weight_range_kg": { "suave": [4, 6], "normal": [6, 10], "fuerte": [10, 16] } }
  ]
}
```

Novedades respecto a hoy:
- `view: "side" | "front"`: los ejercicios de pie (sentadilla, curl, press) se ven mejor de frente. La vista frontal usa los mismos 12 puntos más `s2` (segundo hombro) y `p2` (segunda cadera) y un renderer casi igual. Se añade en fase 1 solo si hace falta para la biblioteca inicial; si no, fase 2.
- `props`: lista opcional de accesorios dibujados (mancuerna en la mano `w1`, correa desde un punto de anclaje a `w1`/`w2`, banda entre `a1` y `a2`). Son primitivas de dibujo sencillas (un rectángulo, una línea con tensión) ancladas a puntos existentes. Sin esto, los ejercicios con material se entienden peor.
- `variants` dentro del mismo archivo, para que el ejercicio y sus variaciones se revisen juntos.
- Textos para la voz separados de los textos en pantalla (hoy `say` y `cap` se mezclan).
- `type` y `rep_seconds` explícitos para que el motor sepa si pitar por repetición, cada 10 segundos o por respiración.

### 6.3 Cómo crear un ejercicio nuevo (proceso)

1. **Ficha**: nombre, tipo, zonas, material, señales clave, contraindicaciones, texto de voz, variantes. Lo escribes tú en 10 minutos, es la parte que no se puede delegar.
2. **Poses con ayuda de IA**: se da a un modelo el esquema, dos ejercicios existentes como referencia y la descripción de la postura inicial y final; devuelve el JSON de poses y fases. En la práctica da una primera versión razonable para posturas de suelo y necesita retoque para las de pie. Guardar el prompt en `tools/pose-editor/PROMPT.md` para que sea repetible.
3. **Editor web sencillo** (`tools/pose-editor/index.html`, una sola página sin dependencias): carga un JSON, dibuja la figura con el mismo renderer (una copia en JavaScript del algoritmo, o mejor, el renderer Kotlin compilado a JS vía KMP cuando exista), permite arrastrar los 12 puntos, cambiar de pose, reproducir las fases en bucle, y exportar el JSON. Unas 300 a 400 líneas. Es el paso que convierte "retocar coordenadas a mano" en "mover un punto y verlo".
4. **Validación automática** en CI: esquema, claves únicas, que cada fase apunte a una pose existente, que las zonas y el material existan, que los textos de voz no estén vacíos, que las coordenadas estén dentro del lienzo, que no haya segmentos de longitud absurda (un fémur de 5 píxeles es un error de pose).
5. **Revisión de técnica** con una lista fija por ejercicio: postura inicial correcta, qué se aprieta y cuándo, el error típico (patrón "Así NO" que ya usa la plancha), rango seguro, a quién no conviene, y que las señales de voz coincidan con las fases. Mientras seáis dos, la haces tú. Para vender, pasar la biblioteca a un fisioterapeuta o entrenador titulado para una revisión única (unas horas de su tiempo, coste puntual de 100 a 300 euros) y guardar su visto bueno por ejercicio (`reviewed_by`, `reviewed_at` en el JSON). Es también la defensa frente a responsabilidad.
6. **Prueba real**: hacerlo tú con la voz puesta. Si el ritmo de la voz no cuadra con el movimiento, `rep_seconds` o `move`/`hold` están mal.

Coste por ejercicio con este proceso, una vez el editor exista: entre 45 minutos (suelo, sin material) y 2 horas (de pie, con accesorios y 2 variantes). Para la biblioteca inicial de unos 22 ejercicios, entre 25 y 35 horas. Es el bloque de trabajo más grande del MVP después del motor de sesión, y el que más valor aporta al producto.

### 6.4 Validar la técnica a lo largo del tiempo

- Cada ejercicio lleva versión y fecha de revisión; cambiar las poses o las señales sube la versión.
- Los usuarios (fase 2) pueden marcar "no entiendo este ejercicio" o "me duele" en un toque; cada marca va a una tabla `exercise_feedback` sin más datos personales que el id de usuario, y se revisa a mano.
- Cuando haya vídeo (fase 3), el dibujo sigue siendo el modo principal: es lo que se puede mirar de reojo desde el suelo.

---

## 7. Ideas a valorar

### 7.1 Registrar la sesión en Polar, Strava o Health Connect

| Opción | Qué permite | Esfuerzo | Veredicto |
|---|---|---|---|
| **Polar AccessLink API** | Está diseñada para **leer** datos que el usuario ya ha subido a Polar Flow (entrenamientos, actividad, sueño). La creación de sesiones por la vía "transaccional" está marcada como obsoleta en su documentación y no hay un endpoint de subida mantenido. | Alto, y sin garantía de que exista la capacidad | **Descartado** para escribir. Solo serviría para leer frecuencia cardíaca de una sesión grabada con el reloj, lo que no aporta mucho aquí. |
| **Health Connect (Android)** | La app escribe una `ExerciseSessionRecord` de tipo entrenamiento de fuerza con inicio, fin y, si se quiere, series. Polar Flow, Samsung Health, Google Fit, Garmin y otras leen de Health Connect si el usuario lo activa. | Medio: unas 10 a 15 horas (permisos, política de privacidad obligatoria, declaración en Play). | **Recomendado** para fase 3. Es una integración que sirve para todos los relojes a la vez. |
| **Strava API** | Permite crear una actividad manual (`WeightTraining`) con nombre, duración y descripción. OAuth por usuario. | Medio: unas 8 a 12 horas. Strava exige revisión de la app para más de un usuario. | Vale la pena solo si uno de los dos usa Strava a diario. Sin esa condición, no. |
| **Grabar con el reloj y leer FC** | Leer la frecuencia cardíaca en vivo por Bluetooth del Polar durante la sesión. | Alto. | No: no aporta nada a una sesión de fuerza y movilidad de 15 minutos. |

### 7.2 Progresión automática de intensidad y pesos

Reglas simples, explicables y ajustables, en vez de "inteligencia artificial":

- **Feedback de sesión** (fase 2): "fácil" dos veces seguidas en un plan sube un escalón (más repeticiones, más tiempo o siguiente intensidad); "duro" dos veces seguidas baja uno. "Justo" no cambia nada.
- **Doble progresión en ejercicios con peso** (fase 3): se fija un rango de repeticiones (por ejemplo 8 a 12). Cuando se completan todas las series en el tope del rango con el peso actual, la siguiente vez se propone el siguiente peso **que el usuario tiene** (de `user_equipment.available_weights`), no un "+2,5 kg" teórico. Si no se llega al mínimo del rango, se propone bajar.
- **RPE opcional** (fase 3): al acabar una serie con peso, "¿cuánto te ha costado? 1 a 5". Alimenta la misma regla.
- **Semanas de descarga**: cada 4 semanas, una más suave. Freeletics lo hace y la gente lo agradece.
- Todo se muestra: "Te propongo 8 kg porque la última vez hiciste 12 repeticiones con 6 kg y lo marcaste como fácil". Esa frase es la diferencia entre confiar y no confiar en la app.

### 7.3 Recordatorios

- Fase 2. Hora elegida en el onboarding, días elegidos, notificación local con `WorkManager` y `AlarmManager` para exactitud. Texto corto: "Hoy toca glúteo y pierna, 18 minutos". Tocar la notificación arranca la sesión directamente, como el widget.
- No enviar recordatorios desde el servidor en el MVP ni en la fase 2: las notificaciones push obligan a Firebase Cloud Messaging o similar y no aportan nada que una notificación local no haga.
- Si el usuario lleva 3 días sin entrenar, un recordatorio distinto y amable. Nunca culpar, nunca "has perdido tu racha" en mayúsculas.

### 7.4 Compartir planes entre vosotros

- Fase 1. `plan_shares` con código de 6 caracteres; el receptor lo introduce y recibe una copia editable. Sirve para "te he montado un plan de glúteo, pruébalo" sin que tus ediciones posteriores le cambien el suyo.
- Fase 3: "rachas compartidas" o "esta semana los dos" como reto a dos. Es lo máximo de social que conviene a este producto.
- Para el público, los planes "oficiales" curados sustituyen al compartir entre desconocidos. Un mercado de planes de usuarios es moderación y responsabilidad que no compensan.

### 7.5 Otras ideas, por si se quieren valorar

- **Sesión "exprés"**: botón "solo tengo 8 minutos" que recorta el plan de hoy a lo esencial.
- **Modo "sin voz"** para entrenar con música: solo pitidos y vibración, con la pista de audio mezclada (`AudioAttributes` con ducking) para que la música baje mientras habla.
- **Medir, no pesar**: contorno de cadera o cintura cada 4 semanas, opcional y local, para la gente que quiere "ver la pierna" o "quitar barriga". Dato de salud: ver apartado 9 antes de añadirlo.
- **Importar plan desde texto**: pegar "3x12 sentadilla, 3x10 remo, plancha 30s" y que la app lo convierta en plan. Barato con la biblioteca ya hecha.

---

## 8. Distribución

### 8.1 Camino propuesto

| Etapa | Cuándo | Cómo | Coste |
|---|---|---|---|
| **APK por Releases** (hoy) | Fase 0 y fase 1 | Igual que ahora: cada push a `main` compila y publica en Releases. Añadir: canal `beta` desde la rama de desarrollo para probar sin tocar la versión que usa tu mujer. | 0 |
| **Google Play, prueba interna** | Final de la fase 1 | Cuenta de desarrollador (25 $ una vez). La prueba interna admite hasta 100 testers por correo, no exige la regla de los 12 testers, y las actualizaciones llegan como cualquier app. Vosotros dos pasáis a instalar desde Play. | 25 $ |
| **Google Play, prueba cerrada** | Fase 2 | Para cuentas personales creadas después de noviembre de 2023, Google exige **12 testers inscritos durante 14 días seguidos** antes de poder pedir producción, y después una revisión que suele tardar menos de una semana. Amigos y familia. Alternativa: cuenta de organización (requiere número D-U-N-S, gratuito pero tarda) que no tiene esa regla. | 0 |
| **Google Play, producción** | Final de la fase 2 | Ficha de la tienda, capturas, política de privacidad en una URL, formulario Data Safety, declaración del servicio en primer plano `specialUse` (Play pide justificarlo: "temporizador de entrenamiento con guía por voz"). Considerar cambiar a `mediaPlayback` si encaja mejor con la política. | 0 |
| **iOS** | Fase 3 | Apple Developer 99 $/año, Mac, TestFlight para prueba, App Store para público. Revisión de Apple más estricta en salud: exigirá descargo y política. | 99 $/año |

### 8.2 Firma y versiones

- La clave de firma hoy está en el repo (`app/rutina.keystore`) con contraseña en `build.gradle.kts`. Para APK personal es aceptable; para Play **no**: mover el keystore y las contraseñas a secretos de GitHub Actions y usar **Play App Signing** (Google guarda la clave de distribución; la tuya es solo de subida). Hacerlo antes de la primera subida a Play, porque después no se puede cambiar el `applicationId` ni la clave sin perder la continuidad.
- `applicationId` hoy es `com.vignasi.rutinacore`. Si el nombre público va a cambiar (ver preguntas abiertas), decidirlo antes de Play: el id no se puede cambiar después.
- Versionado: hoy `1.0.<número de ejecución>`. Pasar a semántico (`1.4.0`) con `versionCode` seguido del número de ejecución, para que las notas de versión tengan sentido.

### 8.3 Pipeline

El `build.yml` actual compila `assembleRelease` y publica. Evolución:
1. Fase 0: añadir validación de `content/` y tests del módulo `core` antes de compilar.
2. Fase 1: compilar `bundleRelease` (AAB, obligatorio en Play) además del APK para Releases.
3. Fase 2: subida automática a la pista interna de Play con `r0adkll/upload-google-play` o la API de Play, usando una cuenta de servicio en secretos.

---

## 9. Privacidad

### 9.1 Qué datos hay y cuáles son sensibles

Son datos de salud en el sentido del RGPD (artículo 9, categoría especial) en cuanto reflejan actividad física, y más aún si se añaden lesiones, contraindicaciones o medidas corporales. Para dos personas en casa el riesgo real es bajo; para público, el tratamiento tiene que estar bien desde el principio porque corregirlo después es imposible.

| Dato | Dónde vive | Quién lo ve | Protección |
|---|---|---|---|
| Identidad (email, nombre, id de Google) | Supabase Auth, UE | Solo el usuario y tú como administrador | Cifrado en reposo del proveedor; acceso de administración con 2FA; nunca en logs de la app |
| Planes y preferencias | Room en el móvil y Supabase | Solo el usuario (RLS) | RLS; copia local en almacenamiento privado de la app |
| Sesiones, series, pesos | Room y Supabase | Solo el usuario | RLS; borrado lógico y purga física periódica |
| Racha, días hechos | Derivado, caché local | Solo el usuario | No sale del móvil salvo como sesiones |
| Feedback de sesión, RPE | Room y Supabase | Solo el usuario | RLS |
| Contraindicaciones o lesiones (si se añaden) | Solo local en el MVP | Solo el usuario | **No subir al servidor** hasta tener base legal y consentimiento explícito |
| Medidas corporales (si se añaden) | Solo local | Solo el usuario | Igual que arriba; opt-in explícito |
| Tokens de sesión | `EncryptedSharedPreferences` | Nadie | Cifrado con Android Keystore |
| Analítica (fase 2) | Proveedor de analítica | Tú | Solo eventos de uso sin datos de salud; id anónimo no vinculado al email |
| Compras (fase 2) | RevenueCat y Google | Tú | Datos de pago nunca pasan por tu servidor |

### 9.2 Principios

1. **Minimizar.** En el MVP no se guarda peso corporal, altura, edad, fotos ni dolencias. Si en fase 2 se piden en el onboarding, se usan para generar el plan y se guardan solo las respuestas necesarias (objetivo, material, minutos), nunca un dato médico.
2. **Local primero.** Todo lo que no necesita sincronizarse, no se sube. Los datos sensibles opcionales (lesiones, medidas) se quedan en el móvil hasta que haya una razón y un consentimiento para subirlos.
3. **Región UE** para auth y base de datos (Frankfurt en Supabase). Sin transferencias fuera de la UE salvo las inevitables de Google (login) y RevenueCat (compras), que tienen sus propios acuerdos.
4. **Una política por tabla.** RLS en todas las tablas con `user_id` desde la primera migración. Un test automático que intenta leer datos de otro usuario y debe fallar.
5. **Exportar y borrar desde la app**, en dos toques, sin escribir a nadie. Exportar: un JSON con todo lo suyo. Borrar: elimina de Supabase (sesión, planes, auth) y de Room. Es obligatorio por RGPD y por las políticas de Play, y es trivial si se hace desde el principio.
6. **Sin anuncios nunca.** Datos de salud y redes publicitarias no se mezclan.
7. **Analítica sin salud.** Qué pantallas se abren, dónde se abandona el onboarding, cuántas sesiones se acaban. Nunca qué ejercicio, qué peso ni qué objetivo ligado a una persona identificable. Proveedor con alojamiento en la UE o propio (una tabla `events` en Supabase es suficiente al principio).
8. **Descargo de responsabilidad** al primer uso y en cada ejercicio con contraindicaciones: "esto no es consejo médico; si tienes dolor, para". Para vender, con revisión de un profesional (apartado 6.3).
9. **Entre vosotros dos**: aunque seáis pareja, cada cuenta ve solo lo suyo salvo lo que se comparte explícitamente (planes). Es la regla correcta para el producto y evita diseñar una excepción que luego hay que quitar.

### 9.3 Qué hay que escribir (fase 2)

- Política de privacidad en una URL pública (GitHub Pages sirve), en español, que diga qué se guarda, dónde, por qué, cuánto tiempo y cómo borrarlo.
- Términos de uso con el descargo.
- Formulario Data Safety de Play coherente con la política.
- Registro de tratamiento (una página) por si algún día lo pide alguien.

---

## 10. Riesgos, preguntas abiertas y estimación de esfuerzo

### 10.1 Riesgos

| Riesgo | Probabilidad | Impacto | Qué hacer |
|---|---|---|---|
| El servicio en segundo plano muere en algunos móviles (Xiaomi, Huawei, Samsung con ahorro de batería agresivo) y la voz se corta | Alta en público, baja entre vosotros | Alto: es la función estrella | Pedir exclusión de optimización de batería en el onboarding con explicación; `AlarmManager` exacto como respaldo del `Handler`; probar en al menos 3 marcas antes de Play. |
| Google Play rechaza o pide justificar `FOREGROUND_SERVICE_SPECIAL_USE` | Media | Medio: retrasa la publicación | Preparar la justificación; valorar `mediaPlayback` como tipo, que tiene mejor encaje en política. |
| El proyecto de Supabase se pausa por inactividad y un día la sync no funciona | Alta mientras seáis dos | Bajo: la app sigue funcionando offline | Ping semanal desde GitHub Actions; pasar a Pro al vender. |
| La regla de 12 testers durante 14 días retrasa la publicación | Media | Medio | Empezar a reunir testers en cuanto exista la prueba interna; o cuenta de organización con D-U-N-S. |
| Responsabilidad por lesiones cuando haya público | Baja | Alto | Descargo, contraindicaciones por ejercicio, revisión profesional de la biblioteca, no dar consejo médico. |
| Cada ejercicio animado cuesta más de lo previsto y la biblioteca se queda corta | Media | Medio: el producto parece vacío | Editor de poses antes de hacer la biblioteca; permitir ejercicios sin animación; priorizar por objetivo (glúteo, abdomen, postura) y no por cantidad. |
| Una sola persona desarrollando a 10 a 15 horas por semana se cansa a mitad de la fase 2 | Media | Alto | Fases cortas con criterio de hecho; usar la app vosotros desde el final de la fase 1 para que cada mejora se note; no empezar la fase 2 hasta que el MVP esté en uso real. |
| Migración de datos de la app actual pierde la racha | Baja | Alto para la moral | Test de migración con tus datos reales exportados antes de publicar la fase 0. |
| Elegir mal el nombre y el `applicationId` antes de Play | Media | Alto: no se puede cambiar | Decidirlo antes de la primera subida a Play (pregunta abierta). |
| La sincronización duplica sesiones o pierde cambios | Media | Medio | UUID en cliente, outbox idempotente, tests de los casos: sin red, red a medias, dos móviles. |
| Los planes generados por plantilla no gustan o parecen genéricos | Media | Medio | Probarlos con 5 personas antes de escribir el onboarding; mejor 6 planes muy buenos que 30 regulares. |

### 10.2 Preguntas abiertas que tienes que responder tú

Ordenadas por cuándo bloquean:

**Antes de la fase 0**
1. **Nombre del producto.** "Rutina core" describe la app actual, no la futura. El `applicationId` (`com.vignasi.rutinacore`) y el nombre en Play no se pueden cambiar después de publicar. ¿Lo cambias ahora?
2. **Objetivo concreto de tu mujer.** "Fortalecer glúteo y pierna" y "tonificar brazos y espalda" dan planes distintos. ¿Cuál es el primero? ¿Cuántos días por semana y cuántos minutos le parecen realistas?
3. **Material real en casa.** ¿Qué mancuernas tenéis exactamente (pesos)? ¿Bandas? ¿Dónde se anclan las correas? Define `available_weights` y qué ejercicios de la biblioteca inicial tienen sentido.

**Antes de la fase 1**
4. **¿Google como login principal te parece bien** o prefieres enlace mágico por defecto para no depender de Google?
5. **Región de datos**: Frankfurt (Supabase) salvo que digas otra cosa.
6. **Los 20 a 25 ejercicios iniciales**: te propongo una lista en el apartado 2 (fase 1). ¿Cuáles quitas o añades? Esta lista es el contenido del MVP.
7. **¿Pagas los 25 $ de Google Play al final de la fase 1** para pasar a prueba interna, o seguís con APK hasta la fase 2?

**Antes de la fase 2**
8. **Quién revisa la técnica** de la biblioteca antes de abrirla al público: ¿conoces a un fisioterapeuta o entrenador? ¿Presupuesto para una revisión puntual?
9. **Precio y periodo de prueba** de Premium: ¿3,99 €/mes y 24,99 €/año con 7 días gratis? Y, más importante: ¿qué queda gratis para siempre?
10. **Cuenta personal o de organización en Play**: la de organización evita la regla de 12 testers pero exige D-U-N-S y datos de empresa o autónomo.
11. **Testers**: ¿tienes a 12 personas que instalarían y mantendrían la app 14 días?

**Antes de la fase 3**
12. **¿Cuándo iOS?** Solo si hay una persona concreta con iPhone que la vaya a usar o si las ventas en Android lo justifican. Implica Mac y 99 $/año.
13. **Strava o Health Connect**: ¿alguno de los dos usa Strava? Si no, Health Connect y punto.

### 10.3 Estimación de esfuerzo

A 10 a 15 horas por semana, contando una sola persona que conoce el proyecto y usa herramientas de generación de código. Las horas son de trabajo efectivo; las semanas asumen que no todas las semanas se llega a 10 horas.

**Fase 0: cimientos (30 a 40 horas, 2 a 3 semanas)**

| Bloque | Horas |
|---|---|
| Módulo `core` puro con modelo, motor de pasos, racha; tests | 8 a 10 |
| Exercise JSON v1, esquema, mover los 5 ejercicios, carga en la app, validación en CI | 6 a 8 |
| Renderer único en Compose Canvas, quitar WebView, pantalla de rutina equivalente a la actual | 8 a 10 |
| Room con todas las tablas, migración desde SharedPreferences con test | 6 a 8 |
| Pipeline: tests y validación antes de compilar | 2 a 4 |

**Fase 1: MVP (130 a 170 horas, 9 a 12 semanas)**

| Bloque | Horas |
|---|---|
| Supabase: proyecto, esquema SQL, RLS, tests de RLS, ping semanal | 8 a 10 |
| Login Google + enlace mágico, perfil, sesión cifrada | 8 a 12 |
| Sincronización offline-first (outbox, pull, conflictos) con tests de casos sin red | 20 a 28 |
| Editor de poses web | 8 a 12 |
| Biblioteca inicial de 20 a 25 ejercicios con variantes (contenido) | 25 a 35 |
| Pantallas: Biblioteca con filtros, Planes, Editor de plan, Hoy | 20 a 25 |
| Motor de sesión para cualquier plan + adaptar `WorkoutService` y widget | 15 a 20 |
| Registro de pesos y series, historial, calendario, evolución | 10 a 15 |
| Compartir plan por código | 4 a 6 |
| Pruebas reales con vosotros dos, corrección de lo que falle | 10 a 15 |

**Fase 2: lista para terceros (150 a 200 horas, 11 a 15 semanas)**

| Bloque | Horas |
|---|---|
| Onboarding de 3 preguntas y login anónimo con vinculación | 10 a 14 |
| Plantillas de planes por objetivo × material × tiempo (contenido y reglas), semanas de progresión | 20 a 30 |
| Feedback post-sesión y reglas de ajuste | 8 a 12 |
| Biblioteca ampliada a 50 a 60 ejercicios, vista frontal, accesorios dibujados | 40 a 55 |
| Recordatorios | 6 a 8 |
| Freemium: RevenueCat, Play Billing, entitlements, pantalla de pago, restaurar compra | 15 a 20 |
| Play: firma, AAB, ficha, capturas, Data Safety, justificación del servicio, subida automática | 10 a 14 |
| Privacidad: política, términos, descargo, exportar y borrar cuenta | 8 a 10 |
| Analítica mínima, accesibilidad básica | 6 a 8 |
| Prueba cerrada con 12 personas, corrección | 15 a 20 |
| Revisión profesional de técnica (tiempo tuyo de coordinación; su coste aparte) | 4 a 6 |

**Fase 3: más adelante (por bloque, independientes)**

| Bloque | Horas |
|---|---|
| iOS con KMP, SwiftUI, WidgetKit, audio, Apple login, App Store | 120 a 180 |
| Health Connect | 10 a 15 |
| Strava | 8 a 12 |
| Progresión de pesos con doble progresión y RPE | 10 a 15 |
| Editor de ejercicios dentro de la app | 20 a 30 |
| Retos a dos | 10 a 15 |
| Localización a un idioma | 8 a 12 por idioma |

**Calendario orientativo** si se empieza en noviembre de 2026: fase 0 lista a mediados de diciembre; MVP en uso por vosotros dos hacia marzo de 2027; fase 2 y publicación en Play hacia julio de 2027. iOS, no antes de finales de 2027 y solo si se decide.

---

## Anexo A: punto de partida

Lo que hay en el repo a fecha de este documento, para que el plan se lea con el código delante:

| Archivo | Qué hace | Qué le pasa en el plan |
|---|---|---|
| `app/src/main/assets/index.html` (386 líneas) | Toda la interfaz: rutina, animación en canvas, modo guiado, datos de los 5 ejercicios en JavaScript | Desaparece en fase 0; su renderer y sus datos pasan a Kotlin y JSON |
| `MainActivity.kt` | `Activity` con WebView y un `Bridge` JavaScript para voz, vibración, marcar hecho, rondas y estadísticas | Se sustituye por Compose en fase 0 |
| `Model.kt` | `Exercise`, `Phase`, `Step`, `buildSteps(rounds)`, `phaseAt`, `PREP_S`, `REST_S` | Base del módulo `core`; `buildSteps` pasa a recibir un plan |
| `Data.kt` | Los 5 ejercicios y `ROUND` como código Kotlin generado desde el HTML | Se sustituye por `content/exercises/*.json` |
| `Store.kt` | SharedPreferences: fechas hechas, rondas; cálculo de racha | Migra a Room; la lógica de racha va a `core` |
| `Workout.kt` | Estado de la sesión en curso (paso, tiempo restante) | Se absorbe en el motor de sesión de `core` |
| `WorkoutService.kt` | Servicio en primer plano: temporizador, TTS en español, pitidos, vibración, wake lock, notificación con controles | Se mantiene; pasa a recibir una lista de pasos de cualquier plan y a publicar estado en Room |
| `Widgets.kt` + `PoseRenderer.kt` | Dos widgets (reproductor y mini) con `RemoteViews`; dibujo de la pose a bitmap | Se mantienen; `PoseRenderer` se convierte en el renderer único; Glance opcional más adelante |
| `AndroidManifest.xml` | Permisos de vibración, wake lock, notificaciones, servicio `specialUse` | Añadir `INTERNET`; valorar tipo de servicio para Play |
| `.github/workflows/build.yml` | Compila APK firmado en cada push a `main` y publica Release | Añadir validación de contenido y tests; AAB en fase 1; subida a Play en fase 2 |
| `app/build.gradle.kts` + `app/rutina.keystore` | Firma con clave en el repo | Mover a secretos y Play App Signing antes de Play |

## Anexo B: qué copiar y qué no de Freeletics y BetterMe

**Copiar**
- Onboarding por objetivo, material y tiempo, en pocas preguntas. Freeletics lo hace bien; BetterMe lo alarga demasiado.
- "Sesión de hoy" en una tarjeta grande con duración y un botón. Nada más en la pantalla principal.
- Voz que guía y cuenta. Freeletics la tiene; aquí ya existe y es mejor porque habla por repetición.
- Feedback al acabar ("¿cómo ha ido?") que ajusta la siguiente sesión. Es el "Coach" de Freeletics reducido a lo que importa.
- Sesiones de 10 a 25 minutos y planes de 4 semanas con progresión visible.
- Racha y calendario, sin dramatizar cuando se rompe.
- Vista del ejercicio antes de empezar, en bucle. Ellos usan vídeo; aquí el dibujo con la zona marcada es la ventaja.
- Prueba gratuita real y un plan anual claro.

**No copiar**
- Cuestionarios de 30 pantallas con "analizando tus respuestas".
- Suscripción que se activa al final del cuestionario sin que quede claro el precio, ni "ofertas" con cuenta atrás. BetterMe tiene mala fama por esto y Google Play lo vigila.
- Promesas de resultados ("pierde 5 kg en 4 semanas").
- Fotos de antes y después y seguimiento de peso corporal como centro del producto.
- Comunidad, feed, comentarios. No aportan al objetivo y requieren moderación.
- Cientos de ejercicios con vídeo. Mejor 50 bien hechos y bien explicados.

## Anexo C: fuentes consultadas

Datos de precios y límites de octubre de 2026, de fuentes de terceros salvo que se indique; confirmar en las páginas oficiales antes de contratar nada.

- Supabase, plan gratuito y pausa por inactividad: [jetadmin.io](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/), [costbench.com](https://costbench.com/software/database-as-service/supabase/free-plan/), [automationatlas.io](https://automationatlas.io/answers/supabase-free-tier-limits-2026/).
- Google Play, cuota de 25 $ y regla de 12 testers durante 14 días: [magora-systems.com](https://magora-systems.com/google-play-developer-account-cost/), [choicely.com](https://www.choicely.com/blog/google-play-12-tester-rule), [rapidnative.com](https://www.rapidnative.com/deploy/google-play-12-tester-requirement).
- Widgets con Expo y React Native (estado de `expo-widgets`, necesidad de Kotlin/Glance en Android): [expo.dev](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo.md), [docs.expo.dev](https://docs.expo.dev/versions/v55.0.0/sdk/widgets), [reactnativerelay.com (Android)](https://reactnativerelay.com/article/react-native-android-widgets-expo-glance-2026), [reactnativerelay.com (iOS)](https://reactnativerelay.com/article/react-native-ios-widgets-expo-apple-targets-2026).
- Polar AccessLink, orientación a lectura y API transaccional obsoleta: [apis.io](https://apis.io/apis/polar/polar-exercises-deprecated-api/), [github.com/spurtli/polar-api-v3](https://github.com/spurtli/polar-api-v3), [pypi.org/project/polar-accesslink](https://pypi.org/project/polar-accesslink/).
