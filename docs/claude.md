# Conector de Claude (B2a)

Claude lee y escribe tus datos de entrenamiento desde una conversación: le pides «la sesión de hoy» o «el plan de la semana»
y lo guarda en tu cuenta. La app lo enseñará en Entrenar en B2b; hasta entonces, las **favoritas** que cree Claude ya
llegan a la app al sincronizar, y los planes quedan guardados en la nube.

## Cómo está hecho

```
Claude ──MCP──► Edge Function «claude» ──(tu token, RLS)──► tablas de Supabase
   │                       │ 401 + dónde iniciar sesión
   └──OAuth 2.1──► Supabase Auth (servidor OAuth) ──► página web/claude/ (GitHub Pages): email, contraseña y «Permitir»
```

- **Servidor MCP:** `supabase/functions/claude/index.ts` (la puerta) y `supabase/functions/_shared/claude.ts` (herramientas,
  comprobaciones y protocolo, sin Deno; pruebas en `claude.test.ts`). MCP por HTTP sin estado (JSON-RPC, sin SSE).
  Dirección: `https://jlyqtxihsorqczlxvbly.supabase.co/functions/v1/claude`.
- **Inicio de sesión:** el servidor OAuth 2.1 de Supabase Auth (Authentication → OAuth Server), con registro dinámico de
  clientes (Claude se registra solo). Supabase manda a `Site URL` + `/claude/` =
  `https://vignasi.github.io/Coruti/claude/`, una página estática (`web/claude/index.html`) donde entras con el email y la
  contraseña de la app y das permiso. Va en GitHub Pages porque Supabase sirve el HTML de las Edge Functions como texto
  (comprobado: `text/plain` y `sandbox`).
- **Seguridad:** el token que recibe Claude es un token normal de tu cuenta. La función lo comprueba con Supabase Auth y
  hace cada consulta con él y la clave pública: la RLS (`user_id = auth.uid()`) manda igual que en la app. **Ningún secreto**
  ni clave de servicio en la función, la página o el repo. Tu mujer, con su cuenta, solo ve y cambia lo suyo.
- Al conectar, se apunta `connections` (`provider = 'claude'`) para que la app pueda enseñar «Claude conectado» (B2b).

## Herramientas

| Leer | Qué da |
|---|---|
| `ver_perfil` | fecha de hoy, perfil, objetivo, material marcado en la app, nombres de tus bandas, kilos por ejercicio, últimas medidas, conexiones |
| `ver_medidas` | peso y medidas (filtro por tipo y fecha) |
| `ver_historial` | sesiones con series: repeticiones o segundos hechos y planeados, kilos, banda, saltadas, pulso, RPE, sensación (filtro por fechas y ejercicio) |
| `ver_favoritas` | tus favoritas |
| `ver_plan` | planes activos y días de un periodo (por defecto, esta semana) |
| `ver_catalogo` | `exercise_catalog` publicado, con `disponible` según tu material; con `clave`, ficha y técnica completas |

| Escribir | Qué hace |
|---|---|
| `guardar_plan` | crea un plan con sus días (o lo cambia con `plan_id`: los días pendientes se sustituyen, los hechos se quedan); apaga los otros planes de Claude que se solapan |
| `guardar_dia` | crea o cambia la sesión de un día (sin plan, va al plan de Claude de esa semana, o crea uno); también marca hecho o saltado |
| `borrar_dia` | quita un día del plan |
| `guardar_favorita` · `borrar_favorita` | crea, cambia, renombra o borra una favorita (máximo 20, como la app) |
| `apuntar_medidas` · `borrar_medida` | apunta peso y medidas (`source = 'claude'`) o borra una equivocada |

**Forma de una sesión** (`plan_days.workout` y `favorites.data`, la misma que una favorita de la app):
`{ name, sel: [{ k, n, kg?, band? }], rounds, rest, alt, notas? }`. `n` son repeticiones (1–50) o segundos (5–180, de 5 en 5)
según el ejercicio, igual que `normFree` en `motor.js`. Solo se admiten claves publicadas del catálogo. Si falta material o la
banda no es tuya, se guarda igual y Claude recibe el aviso. Un día de tipo `core` sin sesión lleva `{ rutina: true }`
(la rutina de core de la app con sus ajustes). `kg`, `band` y `notas` dentro de `sel` son nuevos: la app los usará en B2b.

## Puesta en marcha

Hecho por Claude el 14 nov: servidor OAuth activado (registro dinámico, ruta `/claude/`, Site URL
`https://vignasi.github.io/Coruti`) y la función `claude` desplegada. El Site URL antes era `http://localhost:3000`, que no
se usaba (la app entra con contraseña).

**Tú, una vez:**
1. Fusionar el pull request de B2a.
2. GitHub → el repo → **Settings → Pages → Build and deployment → Source: «GitHub Actions»**. Luego **Actions →
   «Página del conector de Claude» → Run workflow** (rama `main`). Comprueba que
   `https://vignasi.github.io/Coruti/claude/` enseña «Esta página se abre desde Claude…».
3. En Claude (web o escritorio; hace falta un plan que admita conectores personalizados): **Ajustes → Conectores →
   Añadir conector personalizado**. Nombre: `Rutina core`. URL: `https://jlyqtxihsorqczlxvbly.supabase.co/functions/v1/claude`.
   Sin ID ni secreto de cliente (se registra solo). **Añadir → Conectar**: se abre la página, entras con tu email y
   contraseña de la app y pulsas **Permitir**.
4. En una conversación, con el conector activado: «¿Qué ves de mi perfil?», «Apunta que hoy peso 78,4», «Guárdame una
   favorita de pecho con lo que tengo». Lo que escriba sale en Supabase → Table Editor (`plans`, `plan_days`,
   `favorites`, `body_measurements`), y las favoritas en la app tras sincronizar.
5. Tu mujer igual, desde su Claude y con su cuenta.

**Quitar el acceso:** en Claude, Ajustes → Conectores → Desconectar. Para cortarlo del todo, en Supabase →
Authentication → OAuth Server → Clients, borra el cliente de Claude.

## Probado

- `node --experimental-strip-types --test supabase/functions/_shared/claude.test.ts` (20 pruebas: protocolo, cada
  herramienta contra una base simulada, comprobación de sesiones y medidas, que no escribe nada si los datos no valen y que
  un plan nuevo no queda a medias) y `deno check` de la función.
- Contra el proyecto real: metadatos OAuth (los de la función y los de Supabase Auth), registro dinámico de un cliente,
  `authorize` que lleva a `…/Coruti/claude/?authorization_id=…`, 401 con `WWW-Authenticate`, y que las 7 consultas de
  lectura son válidas para PostgREST. La página, con Playwright, hasta «Email o contraseña incorrectos».
- **Sin probar:** el flujo entero con una cuenta (Claude no tiene contraseñas ni la clave secreta, a propósito). Se prueba
  en el paso 3. Si al conectar falla algo, mira Supabase → Edge Functions → `claude` → Logs y Authentication → Logs.

## Para B2b (la app)

- Leer `plans` (activos) y `plan_days` y enseñar «Plan de Claude» en Entrenar; empezar una sesión de `workout` como una
  favorita, con `kg` y `band` por ejercicio si vienen, y `{ rutina: true }` como la rutina de core.
- Al guardar una sesión hecha desde un día del plan, poner `plan_day_id` en la sesión y el día en `done`.
