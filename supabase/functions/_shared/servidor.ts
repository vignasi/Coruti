// Lo que comparten las Edge Functions de S1: base de datos (con la clave de servicio), Strava, Polar y la cola de subidas.
// Las claves de Strava y Polar están en los secretos de Supabase (Edge Functions → Secrets), nunca en la app.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import {
  emparejar, esResistencia, horasPolar, jsonFuerza, descripcion, titulo, duplicadoDe, siguienteIntento,
  ESPERA_RELOJ_MS, ESPERA_APP_MS, type PolarExercise, type Sesion, type Serie,
} from "./logica.ts";

export const PROYECTO = Deno.env.get("SUPABASE_URL") ?? "https://jlyqtxihsorqczlxvbly.supabase.co";
/** La dirección a la que vuelven Strava y Polar al conectar (hay que ponerla igual en sus webs de desarrolladores). */
export const VUELTA = `${PROYECTO}/functions/v1/conexiones`;
export const AVISO_POLAR = `${PROYECTO}/functions/v1/polar-aviso`;
// La API de Strava pasa a https://api-v3.strava.com a partir del 4 de enero de 2027; hasta entonces, esta
const STRAVA_API = "https://www.strava.com/api/v3";
const POLAR_API = "https://www.polaraccesslink.com/v3";

function claveServicio(): string {
  const k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (k) return k;
  try { return Object.values(JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}"))[0] as string; } catch { return ""; }
}
export const db: SupabaseClient = createClient(PROYECTO, claveServicio(), { auth: { persistSession: false } });

export function env(nombre: string): string {
  const v = Deno.env.get(nombre);
  if (!v) throw new Error(`Falta el secreto ${nombre} en Supabase (Edge Functions → Secrets)`);
  return v;
}

export async function secretoServidor(nombre: string): Promise<string | null> {
  const { data } = await db.from("server_secrets").select("value").eq("name", nombre).maybeSingle();
  return data?.value ?? null;
}

/* ---------------- Firmas (enlace de conectar y aviso de Polar) ---------------- */

const enc = new TextEncoder();
async function hmacHex(clave: string, texto: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(clave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(texto)));
  return [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function igual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
export const firmaPolar = (clave: string, cuerpo: string) => hmacHex(clave, cuerpo);

/** «state» del enlace de conectar: quién eres y a qué servicio, firmado y válido 15 minutos. */
export async function firmarEstado(uid: string, proveedor: string): Promise<string> {
  const datos = btoa(JSON.stringify({ u: uid, p: proveedor, t: Date.now() + 15 * 60000 })).replace(/=+$/, "");
  return `${datos}.${await hmacHex((await secretoServidor("state"))!, datos)}`;
}
export async function leerEstado(state: string): Promise<{ u: string; p: string } | null> {
  const [datos, firma] = (state ?? "").split(".");
  if (!datos || !firma) return null;
  if (!igual(firma, await hmacHex((await secretoServidor("state"))!, datos))) return null;
  try {
    const o = JSON.parse(atob(datos));
    return o.t > Date.now() && o.u && o.p ? { u: o.u, p: o.p } : null;
  } catch { return null; }
}

/* ---------------- Conexiones y tokens ---------------- */

export interface Conexion { user_id: string; provider: string; status: string; external_id: string | null; meta: Record<string, unknown>; connected_at: string }

export async function conexion(uid: string, proveedor: string): Promise<Conexion | null> {
  const { data } = await db.from("connections").select("*").eq("user_id", uid).eq("provider", proveedor).maybeSingle();
  return data && data.status === "connected" ? data as Conexion : null;
}

export async function guardarConexion(uid: string, proveedor: string, externo: string, scopes: string[], meta: Record<string, unknown>,
  token: { access_token: string; refresh_token?: string | null; expires_at?: string | null }) {
  const previa = (await db.from("connections").select("meta").eq("user_id", uid).eq("provider", proveedor).maybeSingle()).data;
  let r = await db.from("connections").upsert({
    user_id: uid, provider: proveedor, status: "connected", external_id: externo, scopes,
    meta: { ...(previa?.meta ?? {}), ...meta },
  }, { onConflict: "user_id,provider" });
  if (r.error) throw r.error;
  r = await db.from("connection_secrets").upsert({
    user_id: uid, provider: proveedor, access_token: token.access_token,
    refresh_token: token.refresh_token ?? null, expires_at: token.expires_at ?? null,
  }, { onConflict: "user_id,provider" });
  if (r.error) throw r.error;
}

export async function borrarConexion(uid: string, proveedor: string) {
  await db.from("connection_secrets").delete().eq("user_id", uid).eq("provider", proveedor);
  await db.from("connections").delete().eq("user_id", uid).eq("provider", proveedor);
}

async function marcarError(uid: string, proveedor: string, motivo: string) {
  const { data } = await db.from("connections").select("meta").eq("user_id", uid).eq("provider", proveedor).maybeSingle();
  await db.from("connections").update({ status: "error", meta: { ...(data?.meta ?? {}), error: motivo } })
    .eq("user_id", uid).eq("provider", proveedor);
}

class SinPermiso extends Error {}

/** Token de Strava válido; lo renueva si caduca en menos de 5 minutos. */
export async function tokenStrava(uid: string): Promise<string> {
  const { data: s } = await db.from("connection_secrets").select("*").eq("user_id", uid).eq("provider", "strava").maybeSingle();
  if (!s?.refresh_token) throw new SinPermiso("Strava no está conectado");
  if (s.access_token && s.expires_at && Date.parse(s.expires_at) > Date.now() + 300000) return s.access_token;
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: env("STRAVA_CLIENT_ID"), client_secret: env("STRAVA_CLIENT_SECRET"),
      grant_type: "refresh_token", refresh_token: s.refresh_token,
    }),
  });
  if (r.status === 400 || r.status === 401) {
    await marcarError(uid, "strava", "Strava ha quitado el permiso. Vuelve a conectar.");
    throw new SinPermiso("Strava ha quitado el permiso");
  }
  if (!r.ok) throw new Error(`Strava no renovó el permiso (${r.status})`);
  const t = await r.json();
  await db.from("connection_secrets").update({
    access_token: t.access_token, refresh_token: t.refresh_token, expires_at: new Date(t.expires_at * 1000).toISOString(),
  }).eq("user_id", uid).eq("provider", "strava");
  return t.access_token;
}

/** Token de Polar (dura un año; Polar no da refresh). */
async function tokenPolar(uid: string): Promise<string> {
  const { data: s } = await db.from("connection_secrets").select("access_token").eq("user_id", uid).eq("provider", "polar").maybeSingle();
  if (!s?.access_token) throw new SinPermiso("Polar no está conectado");
  return s.access_token;
}

export async function polarGet(uid: string, ruta: string, accept = "application/json"): Promise<Response> {
  const r = await fetch(ruta.startsWith("http") ? ruta : POLAR_API + ruta, {
    headers: { Authorization: `Bearer ${await tokenPolar(uid)}`, Accept: accept },
  });
  if (r.status === 401) {
    await marcarError(uid, "polar", "Polar ha quitado el permiso. Vuelve a conectar.");
    throw new SinPermiso("Polar ha quitado el permiso");
  }
  return r;
}

/* ---------------- Subir a Strava ---------------- */

type Resultado = { estado: "done" | "duplicate"; actividad: number | null } | { estado: "error"; error: string };

/** Sube un archivo y espera (hasta ~20 s) a que Strava lo procese. */
async function subirArchivo(uid: string, archivo: Blob, nombre: string, campos: Record<string, string>): Promise<Resultado> {
  const token = await tokenStrava(uid);
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.append(k, v);
  fd.append("file", archivo, nombre);
  const r = await fetch(`${STRAVA_API}/uploads`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
  if (r.status === 401) { await marcarError(uid, "strava", "Strava ha quitado el permiso. Vuelve a conectar."); throw new SinPermiso("Strava"); }
  if (r.status === 429) return { estado: "error", error: "Strava está saturado ahora mismo. Se volverá a intentar sola." };
  let up = await r.json().catch(() => ({}));
  for (let i = 0; i < 12; i++) {
    if (up.activity_id) return { estado: "done", actividad: Number(up.activity_id) };
    if (up.error) {
      const dup = duplicadoDe(up.error);
      return dup != null || /duplicate/i.test(up.error) ? { estado: "duplicate", actividad: dup } : { estado: "error", error: String(up.error).replace(/<[^>]+>/g, "") };
    }
    if (!up.id_str && !up.id) return { estado: "error", error: `Strava no aceptó el archivo (${r.status})` };
    await new Promise((ok) => setTimeout(ok, 1500));
    const g = await fetch(`${STRAVA_API}/uploads/${up.id_str ?? up.id}`, { headers: { Authorization: `Bearer ${token}` } });
    up = await g.json().catch(() => ({}));
  }
  return { estado: "error", error: "Strava tarda en procesarla. Se volverá a intentar sola." };
}

interface FilaSesion {
  id: string; title: string | null; kind: string; started_at: string; ended_at: string; tz_offset_min: number;
  complete: boolean; rpe: number | null; extra: Record<string, unknown>; polar_exercise_id: string | null;
  strava_status: string | null; strava_attempts: number;
}

async function subirSesion(uid: string, s: FilaSesion): Promise<void> {
  const { data: sets } = await db.from("workout_sets").select("*").eq("user_id", uid).eq("session_id", s.id).order("idx");
  const ses: Sesion = {
    id: s.id, title: s.title, type: s.kind, start: Date.parse(s.started_at), end: Date.parse(s.ended_at), tz: s.tz_offset_min,
    complete: s.complete, rpe: s.rpe, feel: (s.extra?.feel as string) ?? null,
    sets: (sets ?? []).map((x): Serie => ({
      k: x.exercise_key, name: x.exercise_name, start: Date.parse(x.started_at), end: Date.parse(x.ended_at),
      reps: x.reps, secs: x.secs, kg: x.kg != null ? Number(x.kg) : null, band: x.band, skipped: x.skipped,
    })),
  };
  let polar: PolarExercise | null = null;
  if (s.polar_exercise_id && await conexion(uid, "polar")) {
    const r = await polarGet(uid, `/exercises/${s.polar_exercise_id}?samples=true`);
    if (r.ok) polar = await r.json();
    else if (r.status !== 404) throw new Error(`Polar no dio el pulso (${r.status})`);
  }
  const datos = jsonFuerza(ses, polar);
  if (!(datos.sets as unknown[]).length) {
    await db.from("workout_sessions").update({ strava_status: "error", strava_error: "La sesión no tiene ninguna serie hecha.", strava_next_at: null })
      .eq("user_id", uid).eq("id", s.id);
    return;
  }
  const res = await subirArchivo(uid, new Blob([JSON.stringify(datos)], { type: "application/json" }), `rutinacore-${s.id}.json`, {
    data_type: "json", sport_type: "WeightTraining", name: titulo(ses), description: descripcion(ses),
    external_id: `rutinacore-${s.id}`,
  });
  const extra = polar ? { hr_avg: polar.heart_rate?.average ?? null, hr_max: polar.heart_rate?.maximum ?? null, calories: polar.calories ?? null } : {};
  if (res.estado === "error") {
    const n = s.strava_attempts + 1, sig = siguienteIntento(n, Date.now());
    await db.from("workout_sessions").update({
      ...extra, strava_status: "error", strava_error: res.error, strava_attempts: n,
      strava_next_at: sig ? new Date(sig).toISOString() : null,
    }).eq("user_id", uid).eq("id", s.id);
  } else {
    await db.from("workout_sessions").update({
      ...extra, strava_status: res.estado, strava_activity_id: res.actividad, strava_error: null, strava_next_at: null,
    }).eq("user_id", uid).eq("id", s.id);
  }
}

/** Reenvía a Strava el archivo FIT del reloj tal cual (sesiones sin sesión de la app: Freeletics, otros entrenos…). */
async function reenviarPolar(uid: string, p: { id: string; attempts: number }): Promise<void> {
  const r = await polarGet(uid, `/exercises/${p.id}/fit`, "*/*");
  if (!r.ok) {
    const n = p.attempts + 1, sig = r.status === 404 ? null : siguienteIntento(n, Date.now());
    await db.from("polar_exercises").update({
      status: "error", error: r.status === 404 ? "Polar ya no tiene el archivo (más de 30 días)." : `Polar no dio el archivo (${r.status})`,
      attempts: n, next_at: sig ? new Date(sig).toISOString() : "infinity",
    }).eq("user_id", uid).eq("id", p.id);
    return;
  }
  const res = await subirArchivo(uid, await r.blob(), `polar-${p.id}.fit`, { data_type: "fit", external_id: `polar-${p.id}` });
  if (res.estado === "error") {
    const n = p.attempts + 1, sig = siguienteIntento(n, Date.now());
    await db.from("polar_exercises").update({ status: "error", error: res.error, attempts: n, next_at: sig ? new Date(sig).toISOString() : "infinity" })
      .eq("user_id", uid).eq("id", p.id);
  } else {
    await db.from("polar_exercises").update({
      status: res.estado === "done" ? "forwarded" : "duplicate", strava_activity_id: res.actividad, error: null, next_at: "infinity",
    }).eq("user_id", uid).eq("id", p.id);
  }
}

/* ---------------- La cola: qué toca subir ahora ---------------- */

/** Guarda una sesión que acaba de llegar de Polar (desde el aviso o al revisar). */
export async function guardarPolar(uid: string, e: PolarExercise) {
  const h = horasPolar(e);
  await db.from("polar_exercises").upsert({
    user_id: uid, id: e.id, started_at: new Date(h.start).toISOString(), ended_at: new Date(h.end).toISOString(),
    sport: e.sport ?? null, detailed_sport: e.detailed_sport_info ?? null, device: e.device ?? null,
    calories: e.calories ?? null, hr_avg: e.heart_rate?.average ?? null, hr_max: e.heart_rate?.maximum ?? null,
  }, { onConflict: "user_id,id", ignoreDuplicates: true });
}

const reclamarHasta = () => new Date(Date.now() + 10 * 60000).toISOString();

/**
 * Revisa todo lo pendiente de una persona: sesiones de Polar nuevas (emparejar o reenviar),
 * sesiones de la app nuevas (esperar al reloj o subir) y reintentos. [forzar]: el id de una sesión
 * para subirla ya (botón «Enviar a Strava»), aunque no haya llegado el reloj.
 */
export async function procesar(uid: string, forzar?: string): Promise<void> {
  const strava = await conexion(uid, "strava");
  if (!strava) return;
  const polar = await conexion(uid, "polar");
  const reenviarTodo = strava.meta?.forward === true;
  const desde = strava.connected_at;
  const ahora = Date.now();

  // 1. Sesiones de Polar nuevas o que fallaron
  if (polar) {
    const { data: nuevas } = await db.from("polar_exercises").select("*").eq("user_id", uid)
      .in("status", ["new", "error"]).lte("next_at", new Date(ahora).toISOString()).order("started_at").limit(10);
    for (const p of nuevas ?? []) {
      // Reclamarla para que otra llamada a la vez no la suba también
      const { data: mia } = await db.from("polar_exercises").update({ next_at: reclamarHasta() })
        .eq("user_id", uid).eq("id", p.id).eq("next_at", p.next_at).select("id");
      if (!mia?.length) continue;
      const ini = Date.parse(p.started_at), fin = Date.parse(p.ended_at);
      const { data: cerca } = await db.from("workout_sessions").select("id, started_at, ended_at, strava_status, extra")
        .eq("user_id", uid).in("src", ["app", "widget"])
        .gte("started_at", new Date(ini - 3600000).toISOString()).lte("started_at", new Date(fin + 3600000).toISOString());
      const m = emparejar({ start: ini, end: fin }, (cerca ?? []).map((s) => ({ ...s, start: Date.parse(s.started_at), end: Date.parse(s.ended_at) })));
      if (m) {
        await db.from("polar_exercises").update({ status: "matched", session_id: m.id, next_at: "infinity", error: null }).eq("user_id", uid).eq("id", p.id);
        const cambios: Record<string, unknown> = { polar_exercise_id: p.id, hr_avg: p.hr_avg, hr_max: p.hr_max, calories: p.calories };
        const quiere = (m.extra as Record<string, unknown>)?.st !== false && m.started_at >= desde;
        if ((m.strava_status === null && quiere) || m.strava_status === "waiting") {
          Object.assign(cambios, { strava_status: "waiting", strava_next_at: new Date(ahora).toISOString() });
        }
        await db.from("workout_sessions").update(cambios).eq("user_id", uid).eq("id", m.id);
      } else if (esResistencia(p.sport, p.detailed_sport) && !reenviarTodo) {
        await db.from("polar_exercises").update({ status: "kept", next_at: "infinity" }).eq("user_id", uid).eq("id", p.id);
      } else if (Date.parse(p.created_at) + ESPERA_APP_MS > ahora && p.status === "new") {
        // Puede que la sesión de la app aún no se haya sincronizado: se espera un poco antes de reenviarla tal cual
        await db.from("polar_exercises").update({ next_at: new Date(Date.parse(p.created_at) + ESPERA_APP_MS).toISOString() })
          .eq("user_id", uid).eq("id", p.id);
      } else if (Date.parse(p.started_at) < Date.parse(desde)) {
        await db.from("polar_exercises").update({ status: "kept", next_at: "infinity" }).eq("user_id", uid).eq("id", p.id);
      } else {
        await reenviarPolar(uid, p);
      }
    }
  }

  // 2. Sesiones de la app nuevas: esperan al reloj (si Polar está conectado) o se suben ya
  const { data: nuevasApp } = await db.from("workout_sessions").select("id, ended_at, extra")
    .eq("user_id", uid).is("strava_status", null).in("src", ["app", "widget"]).gte("started_at", desde).limit(50);
  for (const s of nuevasApp ?? []) {
    if ((s.extra as Record<string, unknown>)?.st === false) continue;
    const cuando = polar ? Math.max(ahora, Date.parse(s.ended_at) + ESPERA_RELOJ_MS) : ahora;
    await db.from("workout_sessions").update({ strava_status: "waiting", strava_next_at: new Date(cuando).toISOString() })
      .eq("user_id", uid).eq("id", s.id).is("strava_status", null);
  }
  if (forzar) {
    await db.from("workout_sessions").update({ strava_status: "waiting", strava_next_at: new Date(ahora).toISOString(), strava_attempts: 0, strava_error: null })
      .eq("user_id", uid).eq("id", forzar).or("strava_status.is.null,strava_status.in.(waiting,error)");
  }

  // 3. Subir lo que toca (y recuperar las que se quedaron a medias hace más de 10 minutos)
  const { data: toca } = await db.from("workout_sessions")
    .select("id, title, kind, started_at, ended_at, tz_offset_min, complete, rpe, extra, polar_exercise_id, strava_status, strava_attempts, strava_next_at")
    .eq("user_id", uid)
    .or(`and(strava_status.in.(waiting,error),strava_next_at.lte.${new Date(ahora).toISOString()}),and(strava_status.eq.uploading,updated_at.lt.${new Date(ahora - 600000).toISOString()})`)
    .order("started_at").limit(10);
  for (const s of (toca ?? []) as (FilaSesion & { strava_next_at: string | null })[]) {
    const { data: mia } = await db.from("workout_sessions").update({ strava_status: "uploading" })
      .eq("user_id", uid).eq("id", s.id).eq("strava_status", s.strava_status).select("id");
    if (!mia?.length) continue;
    try {
      await subirSesion(uid, s);
    } catch (e) {
      const n = s.strava_attempts + 1, sig = siguienteIntento(n, Date.now());
      await db.from("workout_sessions").update({
        strava_status: "error", strava_attempts: n, strava_next_at: sig ? new Date(sig).toISOString() : null,
        strava_error: e instanceof SinPermiso ? "Strava o Polar ha quitado el permiso. Vuelve a conectar." : `No se pudo subir: ${(e as Error).message}`,
      }).eq("user_id", uid).eq("id", s.id);
      if (e instanceof SinPermiso) break;
    }
  }
}

/** Para la tarea programada: todas las personas con Strava conectado. */
export async function procesarTodos(): Promise<number> {
  const { data } = await db.from("connections").select("user_id").eq("provider", "strava").eq("status", "connected");
  for (const c of data ?? []) {
    try { await procesar(c.user_id); } catch (e) { console.error("procesar", c.user_id, e); }
  }
  return data?.length ?? 0;
}
