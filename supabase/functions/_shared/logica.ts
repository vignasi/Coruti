// Lógica de S1 sin red ni base de datos (se prueba con `node --experimental-strip-types --test supabase/functions/_shared/`).
// La usan las Edge Functions «conexiones» y «polar-aviso».

/** Cada ejercicio del catálogo (app/src/main/assets/rutina.json) → su ejercicio en Strava (lista en developers.strava.com/docs/uploads). */
export const EJERCICIO_STRAVA: Record<string, string> = {
  psoas: "KNEELING_HIP_FLEXOR_STRETCH",
  puente: "GLUTE_BRIDGE",
  deadbug: "DEADBUG",
  plancha: "PLANK_GENERIC",
  gato: "CAT_COW",
  crunch_inv: "REVERSE_CRUNCH",
  hollow_k: "CORE_GENERIC",
  plancha_lat: "SIDE_PLANK",
  flex: "PUSH_UP_GENERIC",
  press_db: "DUMBBELL_FLOOR_PRESS",
  press_trx: "CHEST_PRESS",
  angel: "WALL_SLIDE",
  remo_trx: "SUSPENSION_LOW_ROW",
  remo_db: "DUMBBELL_ROW",
  curl_db: "STANDING_DUMBBELL_BICEPS_CURL",
  curl_trx: "SUSPENSION_BICEP_CURL",
  curl_toalla: "CURL_GENERIC",
  ext_db: "DUMBBELL_SKULLCRUSHER",
  ext_trx: "TRICEPS_EXTENSION_GENERIC",
  fondos: "CHAIR_DIPS",
  hollow_kb: "CORE_GENERIC",
  hollow_l: "CORE_GENERIC",
  plancha_lat_k: "SIDE_PLANK",
  flex_incl: "INCLINE_PUSH_UP",
  flex_pies: "DECLINE_PUSH_UP",
  flex_cerr: "DIAMOND_PUSH_UP",
  puente_banda: "GLUTE_BRIDGE",
  press_goma: "CHEST_PRESS",
  curl_goma: "CURL_GENERIC",
  remo_goma: "ROW_GENERIC",
  puente_abd: "GLUTE_BRIDGE",
  paso_lateral: "LATERAL_WALKS_WITH_BAND_AT_ANKLES",
  almeja: "CLAMS",
  almeja_banda: "BANDED_CLAMS",
  remo_incl_banda: "BENT_OVER_ROW",
};
/** Para un ejercicio que aún no está en la tabla (p. ej. uno nuevo que cree Claude): Strava lo muestra como «Total body». */
export const EJERCICIO_POR_DEFECTO = "TOTAL_BODY_GENERIC";

/**
 * Deportes de Polar que siguen yendo de Polar Flow a Strava directamente (carrera, trail, caminatas, bici, natación…).
 * Todo lo demás (fuerza, circuito, core, Freeletics…) lo sube este servidor.
 */
const RESISTENCIA = /RUN|WALK|HIK|TREK|CYCL|BIK|SWIM|SKI|SKAT|PADDL|KAYAK|CANO|ORIENTEER|TRIATHLON/;
export function esResistencia(sport?: string | null, detailed?: string | null): boolean {
  const s = `${detailed ?? ""} ${sport ?? ""}`.toUpperCase();
  if (/TREADMILL|INDOOR_RUN/.test(s)) return true;
  return RESISTENCIA.test(s);
}

/** «PT1H2M3.5S» → segundos. */
export function duracionIso(d: string): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?$/.exec(d ?? "");
  if (!m) return 0;
  return (+(m[1] ?? 0)) * 86400 + (+(m[2] ?? 0)) * 3600 + (+(m[3] ?? 0)) * 60 + parseFloat(m[4] ?? "0");
}

export interface PolarExercise {
  id: string;
  start_time: string;            // hora local, sin zona: «2026-11-12T12:01:20»
  start_time_utc_offset: number; // minutos
  duration: string;              // ISO 8601
  sport?: string;
  detailed_sport_info?: string;
  device?: string;
  calories?: number;
  heart_rate?: { average?: number; maximum?: number };
  samples?: { "recording-rate": number; "sample-type": string; data: string }[];
}

/** Inicio y fin (ms UTC) de una sesión de Polar. */
export function horasPolar(e: PolarExercise): { start: number; end: number } {
  const local = Date.parse(e.start_time.replace(/Z$/, "") + "Z");
  const start = local - (e.start_time_utc_offset ?? 0) * 60000;
  return { start, end: start + Math.round(duracionIso(e.duration) * 1000) };
}

/** Pulso de la sesión de Polar: un valor cada «rate» segundos desde el inicio (sin los ceros del principio). */
export function pulsoPolar(e: PolarExercise): { rate: number; bpm: (number | null)[] } | null {
  const s = (e.samples ?? []).find((x) => String(x["sample-type"]) === "0");
  if (!s || !s.data) return null;
  const bpm = s.data.split(",").map((v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : null; });
  return bpm.some((v) => v != null) ? { rate: Math.max(1, s["recording-rate"] || 1), bpm } : null;
}

export interface Serie {
  k: string; name?: string; start: number; end: number;
  reps?: number; secs?: number; kg?: number | null; band?: string | null; skipped?: boolean;
}
export interface Sesion {
  id: string; title?: string | null; type?: string; start: number; end: number; tz?: number;
  complete?: boolean; rpe?: number | null; feel?: string | null; sets: Serie[];
}

/**
 * ¿Es esta sesión de Polar la misma que la de la app? Se solapan al menos la mitad de la sesión de la app,
 * o la de la app cae dentro de la de Polar con 10 minutos de margen. Devuelve la que más se solapa.
 */
export function emparejar<T extends { start: number; end: number }>(polar: { start: number; end: number }, sesiones: T[]): T | null {
  let mejor: T | null = null, mejorSolape = 0;
  for (const s of sesiones) {
    const dur = Math.max(1, s.end - s.start);
    const solape = Math.min(s.end, polar.end) - Math.max(s.start, polar.start);
    const dentro = s.start >= polar.start - 600000 && s.end <= polar.end + 600000;
    if ((solape >= dur / 2 || dentro) && (!mejor || solape > mejorSolape)) { mejor = s; mejorSolape = solape; }
  }
  return mejor;
}

const SENSACION: Record<string, string> = { mal: "mal", regular: "regular", bien: "bien", muybien: "muy bien" };

/** Texto de la descripción en Strava: esfuerzo, cómo te has sentido y bandas usadas. */
export function descripcion(s: Sesion): string {
  const l: string[] = [];
  const partes: string[] = [];
  if (s.rpe) partes.push(`Esfuerzo ${s.rpe}/10`);
  if (s.feel && SENSACION[s.feel]) partes.push(`Me he sentido ${SENSACION[s.feel]}`);
  if (partes.length) l.push(partes.join(" · "));
  const bandas = [...new Set(s.sets.map((x) => x.band).filter((b): b is string => !!b))];
  if (bandas.length) l.push(`Bandas: ${bandas.join(", ")}`);
  if (s.complete === false) l.push("Sesión incompleta");
  l.push("Con Rutina core");
  return l.join("\n");
}

export function titulo(s: Sesion): string {
  const t = (s.title ?? "").trim();
  return t || (s.type === "sueltos" ? "Ejercicios sueltos" : "Rutina de core");
}

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

/**
 * El archivo JSON de fuerza que acepta Strava (formato «JSON - Strength Training», versión 1.0):
 * una serie por cada serie hecha, con su ejercicio, repeticiones o segundos, kilos y hora; y el pulso del reloj si lo hay.
 */
export function jsonFuerza(s: Sesion, polar?: PolarExercise | null): Record<string, unknown> {
  const hechas = s.sets.filter((x) => (x.reps ?? 0) > 0 || (x.secs ?? 0) > 0);
  const p = polar ? horasPolar(polar) : null;
  const start = p ? Math.min(s.start, p.start) : s.start;
  const end = p ? Math.max(s.end, p.end) : s.end;
  const sets = hechas.map((x) => {
    const o: Record<string, unknown> = { exercise_type: EJERCICIO_STRAVA[x.k] ?? EJERCICIO_POR_DEFECTO };
    if ((x.reps ?? 0) > 0) o.repetitions = x.reps;
    else o.duration = Math.round(x.secs ?? 0);
    if (x.kg != null && x.kg > 0) o.weight = Math.round(x.kg * 100) / 100;
    o.start_time = iso(x.start);
    return o;
  });
  const out: Record<string, unknown> = {
    version: "1.0",
    start_time: iso(start),
    utc_offset: Math.round((s.tz ?? 0) * 60),
    elapsed_time: Math.max(1, Math.round((end - start) / 1000)),
    active_time: Math.max(1, Math.round(hechas.reduce((a, x) => a + Math.max(0, x.end - x.start), 0) / 1000)),
    creator: { name: "Rutina core" },
    sets,
  };
  if (polar?.calories) out.total_calories = Math.round(polar.calories);
  const hr = polar ? pulsoPolar(polar) : null;
  if (hr && p) {
    const time: number[] = [], heartrate: number[] = [], active: boolean[] = [];
    const desde = Math.round((p.start - start) / 1000);
    hr.bpm.forEach((v, i) => {
      if (v == null) return;
      const t = desde + i * hr.rate;
      const ms = start + t * 1000;
      time.push(t); heartrate.push(v);
      active.push(hechas.some((x) => ms >= x.start && ms <= x.end));
    });
    if (time.length) out.streams = { time, heartrate, active };
  }
  return out;
}

/** Strava responde «… duplicate of activity 21234316» si ya tenía esa actividad. */
export function duplicadoDe(error?: string | null): number | null {
  const m = /duplicate of(?: activity)? (?:<a[^>]*>)?(\d+)/i.exec(error ?? "");
  return m ? Number(m[1]) : null;
}

/** Cuándo reintentar tras un error: 1 h, 2 h, 4 h… hasta 5 intentos; después, solo a mano. */
export function siguienteIntento(intentos: number, ahora: number): number | null {
  if (intentos >= 5) return null;
  return ahora + 3600000 * 2 ** Math.max(0, intentos - 1);
}

/** Cuánto se espera a que llegue la sesión del reloj antes de subir sin pulso. */
export const ESPERA_RELOJ_MS = 3 * 3600000;
/** Cuánto se espera a que llegue la sesión de la app antes de reenviar tal cual una sesión de Polar. */
export const ESPERA_APP_MS = 30 * 60000;
