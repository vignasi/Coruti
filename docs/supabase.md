# Supabase · puesta en marcha (B1)

Proyecto: `https://jlyqtxihsorqczlxvbly.supabase.co`. La app lleva dentro solo la clave **pública**
(`sb_publishable_…`). Esa clave no deja leer ni escribir nada sin entrar con una cuenta: lo que protege los datos
es la seguridad por persona (RLS) de las tablas. La clave secreta (`sb_secret_…` o `service_role`) **nunca** va en la app.

## 1. Crear las tablas (una vez, y cada vez que haya un archivo nuevo en `supabase/migrations/`)

1. En supabase.com, abre el proyecto → **SQL Editor** → **New query**.
2. Pega entero `supabase/migrations/20261112000000_b1_cuentas_y_datos.sql` y pulsa **Run**.
   Se puede volver a ejecutar sin romper nada. Los avisos «does not exist, skipping» son normales.
3. Comprueba en **Table Editor** que están `profiles`, `app_state`, `workout_sessions`, `workout_sets`, `favorites`,
   `body_measurements`, `exercises`, `plans`, `plan_days`, `connections` y `connection_secrets`, y que ninguna pone
   «RLS disabled» ni «Unrestricted».

## 2. Que el email traiga un código (obligatorio)

La app pide un código de 6 cifras; por defecto Supabase manda un enlace. En **Authentication → Emails → Templates**
cambia **dos** plantillas: **Confirm signup** (la primera vez de cada email) y **Magic Link** (las siguientes).

- Asunto: `Tu código para Rutina core`
- Mensaje:

```html
<h2>Tu código para Rutina core</h2>
<p>Escribe este código en la app:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>Caduca en una hora. Si no lo has pedido tú, ignora este correo.</p>
```

En **Authentication → Sign In / Providers → Email**: el proveedor Email activado y «Allow new users to sign up» activado
(registro abierto). Si «Email OTP Length» no es 6, da igual: la app acepta de 6 a 10 cifras.

## 3. Límites del plan gratuito

- El servicio de email que trae Supabase manda **muy pocos correos por hora** (lo ves en Authentication → Rate Limits).
  Para dos personas basta; si pides varios códigos seguidos te dirá «Demasiados intentos». Si se queda corto,
  se configura un SMTP propio (p. ej. Resend, gratis) en Authentication → Emails → SMTP Settings.
- El proyecto **se pausa tras ~1 semana sin uso**. Se reactiva desde la web y no se pierde nada; mientras está pausado,
  la app sigue funcionando en el móvil y sincroniza cuando vuelva.

## Cómo está hecho

- **Tablas:** una fila por sesión (`workout_sessions`) y por serie (`workout_sets`), con la misma información que
  `history.json` (ver `History.kt`). Favoritas en `favorites`. El resto de lo del móvil (ajustes, pesos, bandas,
  racha, última sesión de sueltos) va en `app_state.data`. Preparadas para lo que viene: `profiles` (objetivo, sexo,
  altura), `body_measurements` (peso y medidas: a mano, báscula o Claude), `plans` y `plan_days` (planes de Claude o
  por objetivo), `exercises` (ejercicios propios), `connections` (Strava, Polar, Claude) y `connection_secrets`
  (tokens; solo los leen las Edge Functions, la app no puede).
- **Funciones** que usa la app: `push_sessions` (sube sesiones con sus series, todo o nada), `pull_sessions`
  (baja las cambiadas desde la última vez, por páginas) y `replace_favorites`.
- **Sincronización** (`Cloud.kt`, la lógica en `SyncLogic.kt` con pruebas en `SyncLogicTest`):
  al entrar, al abrir la app y unos segundos después de guardar una sesión. Las sesiones se comparan por contenido;
  el resto del estado gana el lado que haya cambiado y, si cambiaron los dos, se combina como al importar una copia.
- **Probado** en un Postgres 16 local con un esquema `auth` simulado: la migración se aplica dos veces,
  una sesión sube y baja idéntica, otra cuenta no ve ni cambia nada y sin cuenta no se lee ni se llama a nada.
  Contra tu proyecto real no se ha podido probar desde la sesión de Claude (su red no llega a supabase.co).
