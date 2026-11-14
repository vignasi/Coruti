# Supabase · puesta en marcha (B1)

Proyecto: `https://jlyqtxihsorqczlxvbly.supabase.co`. La app lleva dentro solo la clave **pública**
(`sb_publishable_…`). Esa clave no deja leer ni escribir nada sin entrar con una cuenta: lo que protege los datos
es la seguridad por persona (RLS) de las tablas. La clave secreta (`sb_secret_…` o `service_role`) **nunca** va en la app.

## 1. Crear las tablas (una vez, y cada vez que haya un archivo nuevo en `supabase/migrations/`)

1. En supabase.com, abre el proyecto → **SQL Editor** → **New query**.
2. Pega entero `supabase/migrations/20261112000000_b1_cuentas_y_datos.sql` y pulsa **Run**.
   Se puede volver a ejecutar sin romper nada. Los avisos «does not exist, skipping» son normales.
3. Después, igual, cada archivo nuevo de `supabase/migrations/` en orden de nombre. Para el catálogo de ejercicios (bloque E):
   `20261114000000_catalogo_ejercicios.sql` y luego `20261114000100_catalogo_ejercicios_datos.sql` (los 30 ejercicios).
   En **Table Editor** → `exercise_catalog` tienen que salir 30 filas con estado `publicado`. (Aplicados el 14 nov.)
4. Comprueba en **Table Editor** que están `profiles`, `app_state`, `workout_sessions`, `workout_sets`, `favorites`,
   `body_measurements`, `exercises`, `plans`, `plan_days`, `connections` y `connection_secrets`, y que ninguna pone
   «RLS disabled» ni «Unrestricted».

## 2. Que el email traiga un código (obligatorio)

La app pide un código; por defecto Supabase manda un enlace. **En el plan gratuito, con el correo que trae Supabase,
las plantillas no se pueden cambiar** (comprobado el 14 nov: la API responde «Email template modification is not available
for free tier projects using the default email provider»). Hace falta un correo propio (SMTP). Con Gmail es gratis:

**Tú (unos 10 minutos):**
1. En tu cuenta de Google, activa la **verificación en dos pasos** si no la tienes (myaccount.google.com → Seguridad).
2. En myaccount.google.com/apppasswords crea una **contraseña de aplicación** llamada «Supabase». Te da 16 letras.
   No la pegues en ningún chat.
3. En supabase.com → el proyecto → **Authentication → Emails → SMTP Settings** → **Enable custom SMTP**:
   - Sender email: tu Gmail · Sender name: `Rutina core`
   - Host: `smtp.gmail.com` · Port: `465`
   - Username: tu Gmail · Password: las 16 letras
   - Guardar.
4. Dile a Claude (en una conversación del entorno «Coruti») que ponga las plantillas: las cambia por la API con lo de abajo.

**Claude, con el token del entorno «Coruti»:** `PATCH https://api.supabase.com/v1/projects/jlyqtxihsorqczlxvbly/config/auth`
con `mailer_subjects_confirmation` y `mailer_subjects_magic_link` = `Tu código para Rutina core`,
`mailer_templates_confirmation_content` y `mailer_templates_magic_link_content` =

```html
<h2>Tu código para Rutina core</h2>
<p>Escribe este código en la app:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>Caduca en una hora. Si no lo has pedido tú, ignora este correo.</p>
```

y `mailer_otp_length` = 6. Se cambian dos plantillas: **Confirm signup** (la primera vez de cada email) y **Magic Link**
(las siguientes). El proveedor Email ya está activado y el registro abierto (comprobado el 14 nov).

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
