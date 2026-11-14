// Edge Function «claude»: el servidor MCP del conector de Claude (B2a). Ver docs/claude.md.
//
//  POST /functions/v1/claude                                   ← Claude (MCP por HTTP, JSON-RPC, sin estado)
//  GET  /functions/v1/claude/.well-known/oauth-protected-resource  ← dónde se inicia sesión (Supabase Auth, OAuth 2.1)
//
// Se despliega con verify_jwt = false para poder contestar 401 con la cabecera que le dice a Claude dónde iniciar
// sesión; el token se comprueba aquí con Supabase Auth y todo se lee y escribe con él (RLS de la persona).
// Ningún secreto: solo la clave pública, la misma que lleva la app.
import { crearRest, metadatosRecurso, responderTodo } from "../_shared/claude.ts";

const PROYECTO = Deno.env.get("SUPABASE_URL") ?? "https://jlyqtxihsorqczlxvbly.supabase.co";
// La clave pública (no es secreta: va en el APK). Si Supabase da la suya, se usa esa.
function clavePublica(): string {
  try {
    const k = Object.values(JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}"))[0];
    if (typeof k === "string" && k) return k;
  } catch { /* sigue */ }
  return Deno.env.get("SUPABASE_ANON_KEY") ?? "sb_publishable_f2Z1xuqDy0reZeLvTEVMaA_IlDu_Vw5";
}
const APIKEY = clavePublica();
const METADATOS = `${PROYECTO}/functions/v1/claude/.well-known/oauth-protected-resource`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
};
const json = (o: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json", ...extra } });

function sinSesion(msg: string): Response {
  return json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: msg } }, 401, {
    "WWW-Authenticate": `Bearer realm="rutina-core", resource_metadata="${METADATOS}"`,
  });
}

/** Quién llama, según Supabase Auth (null si el token no vale o ha caducado). */
async function quien(token: string): Promise<{ id: string; email?: string } | null> {
  const r = await fetch(`${PROYECTO}/auth/v1/user`, { headers: { apikey: APIKEY, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null);
  return u?.id ? { id: u.id, email: u.email } : null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (url.pathname.endsWith("/.well-known/oauth-protected-resource")) return json(metadatosRecurso(PROYECTO));
  if (req.method === "GET" || req.method === "DELETE") {
    // Sin estado: ni canal de avisos (SSE) ni sesiones que cerrar
    return new Response(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
  }
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return sinSesion("Hay que iniciar sesión con tu cuenta de la app");
  const u = await quien(token);
  if (!u) return sinSesion("La sesión ha caducado o no vale: vuelve a conectar");

  let cuerpo: unknown;
  try { cuerpo = await req.json(); } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON no válido" } }, 400);
  }
  try {
    const rest = crearRest(PROYECTO, APIKEY, token);
    const esInicio = !Array.isArray(cuerpo) && (cuerpo as any)?.method === "initialize";
    if (esInicio) {
      // La app podrá enseñar «Claude conectado» (B2b). Si falla, no pasa nada
      await rest("POST", "/rest/v1/connections?on_conflict=user_id,provider",
        { provider: "claude", status: "connected", meta: { cliente: (cuerpo as any)?.params?.clientInfo?.name ?? null } },
        { Prefer: "resolution=merge-duplicates,return=minimal" }).catch((e) => console.error("connections", e.message));
    }
    const r = await responderTodo(cuerpo, { rest, uid: u.id, email: u.email });
    if (r === null) return new Response(null, { status: 202, headers: CORS });
    return json(r);
  } catch (e) {
    console.error(e);
    return json({ jsonrpc: "2.0", id: null, error: { code: -32603, message: (e as Error).message } }, 500);
  }
});
