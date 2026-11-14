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

## 2. Cuentas: las creas tú, con contraseña (desde el 14 nov)

El plan gratuito de Supabase no deja cambiar las plantillas de email si se envía con su correo, así que el email no podía
traer el código que pedía la app. Desde el 14 nov la app **entra con email y contraseña**, y el **registro está cerrado**
(`disable_signup`; comprobado: la app no puede crear cuentas). El APK es público, y así nadie más puede crearse una cuenta.

**Crear una cuenta (tu mujer, por ejemplo):** supabase.com → el proyecto → **Authentication → Users → Add user →
Create new user** → email, contraseña y **«Auto Confirm User»** marcado. Las contraseñas no se pegan en ningún chat.
Dentro de la app, cada persona la cambia en **Tú → Cambiar la contraseña** (mínimo 8 caracteres).

Si algún día se abre a más gente: correo propio (SMTP, p. ej. Gmail con contraseña de aplicación) en
Authentication → Emails → SMTP Settings, plantillas con `{{ .Token }}` y volver a abrir el registro. `Cloud.sendCode`
y `Cloud.verify` siguen en el código para eso. La longitud del código ya está en 6.

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
