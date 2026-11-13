// Edge Function «conexiones»: conectar y desconectar Strava y Polar, «Enviar a Strava» y la revisión cada 15 minutos.
//
//  POST { action: "conectar", provider }      → { url } para abrir en el navegador (con la cuenta de la app)
//  GET  ?code=…&state=…                         ← vuelta de Strava o Polar; redirige a la app (rutinacore://conexion)
//  POST { action: "desconectar", provider }
//  POST { action: "enviar", session_id }       → sube esa sesión ya (aunque no haya llegado el reloj)
//  POST { action: "procesar" }                 → revisa lo pendiente (la app lo pide tras sincronizar)
//  POST { action: "cron" } + cabecera x-cron   ← la tarea programada (pg_cron), cada 15 minutos
//
// Se despliega sin comprobar el JWT en la puerta (verify_jwt = false) porque Strava y Polar vuelven sin él;
// cada acción comprueba aquí quién llama.
import {
  db, env, VUELTA, AVISO_POLAR, firmarEstado, leerEstado, guardarConexion, borrarConexion, conexion, procesar,
  procesarTodos, secretoServidor, igual, tokenStrava,
} from "../_shared/servidor.ts";

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

/** Vuelve a la app. Si el navegador no sabe abrirla, queda el texto. */
function aLaApp(proveedor: string, ok: boolean, msg: string): Response {
  const url = `rutinacore://conexion?p=${encodeURIComponent(proveedor)}&ok=${ok ? 1 : 0}&msg=${encodeURIComponent(msg)}`;
  return new Response(`${msg}\n\nVuelve a la app Rutina core.`, {
    status: 302, headers: { Location: url, "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function quien(req: Request): Promise<string | null> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data } = await db.auth.getUser(jwt);
  return data.user?.id ?? null;
}

function enlace(proveedor: string, state: string): string {
  if (proveedor === "strava") {
    return "https://www.strava.com/oauth/mobile/authorize?" + new URLSearchParams({
      client_id: env("STRAVA_CLIENT_ID"), redirect_uri: VUELTA, response_type: "code",
      approval_prompt: "auto", scope: "read,activity:write", state,
    });
  }
  return "https://flow.polar.com/oauth2/authorization?" + new URLSearchParams({
    response_type: "code", client_id: env("POLAR_CLIENT_ID"), redirect_uri: VUELTA, scope: "accesslink.read_all", state,
  });
}

async function vueltaStrava(uid: string, code: string, scope: string): Promise<Response> {
  if (!scope.split(",").includes("activity:write")) {
    return aLaApp("strava", false, "Hace falta dejar marcado «Subir actividades» en Strava. Vuelve a conectar.");
  }
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: env("STRAVA_CLIENT_ID"), client_secret: env("STRAVA_CLIENT_SECRET"), code, grant_type: "authorization_code",
    }),
  });
  if (!r.ok) return aLaApp("strava", false, `Strava no dejó conectar (${r.status}). Prueba otra vez.`);
  const t = await r.json();
  const nombre = [t.athlete?.firstname, t.athlete?.lastname].filter(Boolean).join(" ");
  await guardarConexion(uid, "strava", String(t.athlete?.id ?? ""), scope.split(","), { name: nombre }, {
    access_token: t.access_token, refresh_token: t.refresh_token, expires_at: new Date(t.expires_at * 1000).toISOString(),
  });
  return aLaApp("strava", true, nombre ? `Strava conectado (${nombre}).` : "Strava conectado.");
}

/** Polar avisa por un único «webhook» de la app; se crea la primera vez que alguien conecta Polar. */
async function asegurarAvisoPolar() {
  if (await secretoServidor("polar_webhook")) return;
  const basic = "Basic " + btoa(`${env("POLAR_CLIENT_ID")}:${env("POLAR_CLIENT_SECRET")}`);
  const cab = { Authorization: basic, "Content-Type": "application/json", Accept: "application/json" };
  // Si ya había uno (de una prueba anterior), se borra: la clave de firma solo se da al crearlo
  const prev = await fetch("https://www.polaraccesslink.com/v3/webhooks", { headers: cab });
  if (prev.ok) {
    const d = await prev.json().catch(() => null);
    for (const w of (d?.data ? (Array.isArray(d.data) ? d.data : [d.data]) : [])) {
      if (w?.id) await fetch(`https://www.polaraccesslink.com/v3/webhooks/${w.id}`, { method: "DELETE", headers: cab });
    }
  }
  const r = await fetch("https://www.polaraccesslink.com/v3/webhooks", {
    method: "POST", headers: cab, body: JSON.stringify({ events: ["EXERCISE"], url: AVISO_POLAR }),
  });
  if (!r.ok) throw new Error(`Polar no creó el aviso (${r.status}): ${await r.text()}`);
  const d = await r.json();
  const clave = d?.data?.signature_secret_key;
  if (!clave) throw new Error("Polar no dio la clave del aviso");
  await db.from("server_secrets").upsert({ name: "polar_webhook", value: clave });
}

async function vueltaPolar(uid: string, code: string): Promise<Response> {
  const basic = "Basic " + btoa(`${env("POLAR_CLIENT_ID")}:${env("POLAR_CLIENT_SECRET")}`);
  const r = await fetch("https://polarremote.com/v2/oauth2/token", {
    method: "POST",
    headers: { Authorization: basic, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json;charset=UTF-8" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: VUELTA }),
  });
  if (!r.ok) return aLaApp("polar", false, `Polar no dejó conectar (${r.status}). Prueba otra vez.`);
  const t = await r.json();
  // Registrar a la persona en la app de Polar (si ya lo estaba, Polar responde 409 y vale igual)
  const reg = await fetch("https://www.polaraccesslink.com/v3/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ "member-id": uid }),
  });
  if (!reg.ok && reg.status !== 409) return aLaApp("polar", false, `Polar no dejó registrar la cuenta (${reg.status}).`);
  await guardarConexion(uid, "polar", String(t.x_user_id), ["accesslink.read_all"], {}, {
    access_token: t.access_token, expires_at: new Date(Date.now() + (t.expires_in ?? 31535999) * 1000).toISOString(),
  });
  await asegurarAvisoPolar();
  return aLaApp("polar", true, "Polar conectado.");
}

async function desconectar(uid: string, proveedor: string) {
  try {
    if (proveedor === "strava") {
      const t = await tokenStrava(uid);
      await fetch("https://www.strava.com/oauth/deauthorize", { method: "POST", body: new URLSearchParams({ access_token: t }) });
    } else {
      const { data: c } = await db.from("connections").select("external_id").eq("user_id", uid).eq("provider", "polar").maybeSingle();
      const { data: s } = await db.from("connection_secrets").select("access_token").eq("user_id", uid).eq("provider", "polar").maybeSingle();
      if (c?.external_id && s?.access_token) {
        await fetch(`https://www.polaraccesslink.com/v3/users/${c.external_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${s.access_token}` } });
      }
    }
  } catch (e) { console.error("desconectar", proveedor, e); }  // aunque falle allí, aquí se borra
  await borrarConexion(uid, proveedor);
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (req.method === "GET") {
      const state = await leerEstado(url.searchParams.get("state") ?? "");
      if (!state) return aLaApp("", false, "El enlace ha caducado. Vuelve a pulsar Conectar en la app.");
      if (url.searchParams.get("error")) return aLaApp(state.p, false, "No has dado permiso. Puedes volver a conectar cuando quieras.");
      const code = url.searchParams.get("code") ?? "";
      return state.p === "strava" ? await vueltaStrava(state.u, code, url.searchParams.get("scope") ?? "") : await vueltaPolar(state.u, code);
    }
    if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
    const body = await req.json().catch(() => ({}));

    if (body.action === "cron") {
      const clave = await secretoServidor("cron");
      if (!clave || !igual(req.headers.get("x-cron") ?? "", clave)) return json({ error: "No" }, 401);
      return json({ personas: await procesarTodos() });
    }

    const uid = await quien(req);
    if (!uid) return json({ error: "Hay que entrar con tu cuenta" }, 401);
    const prov = body.provider === "polar" ? "polar" : "strava";
    switch (body.action) {
      case "conectar":
        return json({ url: enlace(prov, await firmarEstado(uid, prov)) });
      case "desconectar":
        await desconectar(uid, prov);
        return json({ ok: true });
      case "enviar": {
        if (!body.session_id) return json({ error: "Falta la sesión" }, 400);
        if (!await conexion(uid, "strava")) return json({ error: "Conecta Strava primero" }, 409);
        await procesar(uid, String(body.session_id));
        const { data } = await db.from("workout_sessions").select("strava_status, strava_error, strava_activity_id")
          .eq("user_id", uid).eq("id", body.session_id).maybeSingle();
        return json({ ok: true, status: data?.strava_status ?? null, error: data?.strava_error ?? null, activity: data?.strava_activity_id ?? null });
      }
      case "procesar":
        await procesar(uid);
        return json({ ok: true });
      default:
        return json({ error: "Acción desconocida" }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
