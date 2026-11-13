# Strava y Polar · puesta en marcha (S1)

Cada sesión de la app llega a Strava **con la lista de ejercicios** (series, repeticiones, segundos y kilos) y
**el pulso del reloj**, y Polar Flow lo sigue teniendo todo como siempre (carga semanal y avisos del reloj).

## Por qué así (investigación del 12–13 nov 2026)

- La API de Strava **no deja añadir ejercicios** a una actividad que ya existe: al editar solo cambia nombre,
  descripción, tipo, material y etiquetas. Tampoco deja borrar actividades (quitado en 2017).
  Lo de «Editar ejercicios» solo existe en la app de Strava.
- Desde el 21 de mayo de 2026 Strava **sí acepta los ejercicios al subir** una actividad nueva: en un archivo FIT
  con series o en un JSON de fuerza, con el pulso segundo a segundo.
  Fuente: [developers.strava.com/docs/uploads](https://developers.strava.com/docs/uploads/) y su
  [changelog](https://developers.strava.com/docs/changelog/).
- Polar AccessLink da cada sesión del reloj con el pulso (JSON o FIT) durante 30 días y avisa al momento.
  Fuente: [polar.com/accesslink-api](https://www.polar.com/accesslink-api/).
- Polar no documenta un filtro por deporte en Polar Flow → Strava. Si lo tienes, mejor (paso 5).

**Resultado:** Polar Flow → Strava sube solo carreras, trail y caminatas. Las sesiones de entreno las sube el servidor
(Supabase): si a esa hora hay una sesión de la app, con la lista de ejercicios y el pulso; si no (Freeletics, otros),
el archivo del reloj tal cual.

## Tus pasos (una vez)

### 1. Registrar la app en Strava
1. Entra en [strava.com/settings/api](https://www.strava.com/settings/api) con tu cuenta.
2. Rellena: nombre `Rutina core`, categoría `Training`, web `https://github.com/vignasi/Coruti`,
   **Authorization Callback Domain:** `jlyqtxihsorqczlxvbly.supabase.co` (sin `https://` ni barra).
3. Sube cualquier icono y guarda. Apunta el **Client ID** y el **Client Secret** (no los pegues en ningún chat).

Ojo: una app nueva de Strava solo deja conectar a **1 atleta** (tú). Para tu mujer, en esa misma página pide más
plazas («athlete capacity» / acceso ampliado). Desde junio de 2026 se pide desde el propio panel.

### 2. Registrar la app en Polar AccessLink
1. Entra en [admin.polaraccesslink.com](https://admin.polaraccesslink.com) con tu cuenta de Polar Flow.
2. Crea un cliente: nombre `Rutina core`, **Redirect URL:** `https://jlyqtxihsorqczlxvbly.supabase.co/functions/v1/conexiones`
   (exacta, es la misma que para Strava).
3. Acepta las condiciones y apunta el **Client ID** y el **Client Secret**.

### 3. Poner las claves en Supabase
En [supabase.com](https://supabase.com) → proyecto **Coruti** → **Edge Functions** → **Secrets** → **Add new secret**,
añade estos cuatro (nombre exacto):

| Nombre | Valor |
|---|---|
| `STRAVA_CLIENT_ID` | el Client ID de Strava |
| `STRAVA_CLIENT_SECRET` | el Client Secret de Strava |
| `POLAR_CLIENT_ID` | el Client ID de Polar |
| `POLAR_CLIENT_SECRET` | el Client Secret de Polar |

Las claves solo están ahí: ni en el APK ni en el repositorio.

### 4. Conectar desde la app
1. Instala el APK de la rama y entra con tu cuenta (Tú → Entrar).
2. Tú → **Conexiones** → Strava → **Conectar con Strava**. Se abre Strava; deja marcado «Subir actividades» y acepta.
   Vuelves a la app con «Strava conectado».
3. Lo mismo con **Polar**. La primera vez que alguien conecta Polar, el servidor crea solo el aviso de Polar.

Solo se envían solas las sesiones hechas **después** de conectar Strava. Las anteriores salen como «Sin enviar»
y tienen el botón «Enviar a Strava».

### 5. Polar Flow → Strava: que no suba los entrenos
Hazlo **después** del paso 4 para no perder nada.
- En Polar Flow (web) → Ajustes → **Servicios asociados / Partners** → Strava, mira si deja elegir deportes.
  - **Si deja:** deja solo carrera, trail, caminata y senderismo (y bici o natación, si haces). Quita fuerza,
    circuito, core, funcional, movilidad y el resto.
  - **Si no deja:** desconecta Strava en Polar Flow y en la app marca **«Reenviar también carreras y paseos»**
    (Tú → Conexiones → Strava). Entonces el servidor sube también las carreras, con el archivo del reloj tal cual.
- Polar Flow sigue recibiéndolo todo del reloj en los dos casos.

### 6. En el reloj
Graba las sesiones de la app como siempre (p. ej. «Entrenamiento en circuito» o «Entrenamiento de fuerza»).
La app las empareja por la hora: la grabación del reloj tiene que cubrir al menos la mitad de la sesión de la app.

## Cómo funciona por dentro

- `supabase/migrations/20261113000000_s1_strava_polar.sql`: estado de Strava de cada sesión, sesiones de Polar
  (`polar_exercises`), claves del servidor (`server_secrets`, sin acceso desde la app) y la tarea de cada 15 minutos (pg_cron).
- `supabase/functions/conexiones`: conectar y desconectar, «Enviar a Strava» y la revisión de lo pendiente.
- `supabase/functions/polar-aviso`: Polar avisa aquí de cada sesión nueva (con firma HMAC comprobada).
- `supabase/functions/_shared/logica.ts`: cada ejercicio del catálogo con su ejercicio de Strava, emparejar con el reloj
  y montar el JSON de fuerza. Pruebas: `node --experimental-strip-types --test supabase/functions/_shared/logica.test.ts`.
  **Si añades un ejercicio a `rutina.json`, añádelo también en `EJERCICIO_STRAVA`** (la prueba avisa).

Qué pasa con cada sesión:

| Caso | Qué hace el servidor |
|---|---|
| Sesión de la app + sesión del reloj a la misma hora | Sube a Strava los ejercicios con el pulso, las calorías del reloj, el esfuerzo y cómo te has sentido |
| Sesión de la app sin reloj (o el reloj no sincroniza) | A las 3 horas la sube sin pulso. «Enviar a Strava» la sube ya |
| Sesión del reloj de entreno sin sesión de la app (Freeletics…) | Espera 30 min por si llega la de la app; después reenvía el archivo del reloj tal cual |
| Carrera, trail, caminata… | La sube Polar Flow (o el servidor, si marcaste «Reenviar también carreras y paseos») |
| Strava ya tenía la actividad | «Ya estaba en Strava»: no se sube otra, y el enlace lleva a la que había |
| Error de Strava | Reintenta sola a la 1 h, 2 h, 4 h, 8 h; después solo con «Reintentar» |

Al terminar una sesión en la app: esfuerzo (1–10), cómo te has sentido y «Enviar a Strava» (sí por defecto).
Strava no deja poner el esfuerzo por la API: va en la descripción.

## Desplegar otra vez (si cambian las funciones o la migración)

- Migración: SQL Editor → pegar el archivo → Run (se puede repetir).
- Funciones: `npx supabase functions deploy conexiones polar-aviso --use-api --project-ref jlyqtxihsorqczlxvbly`
  con `SUPABASE_ACCESS_TOKEN` (token personal `sbp_…` de Account → Access Tokens). `supabase/config.toml` ya pone
  `verify_jwt = false` en las dos (Strava y Polar vuelven sin JWT; cada función comprueba quién llama).
- La API de Strava cambia de dirección a `https://api-v3.strava.com` a partir del 4 de enero de 2027
  (`STRAVA_API` en `_shared/servidor.ts`). La antigua debería seguir funcionando un tiempo; conviene cambiarla entonces.
