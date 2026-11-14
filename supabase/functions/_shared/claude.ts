// B2a · Servidor MCP del conector de Claude: herramientas, comprobaciones y protocolo (JSON-RPC), sin Deno.
// Lo usa la Edge Function «claude» (supabase/functions/claude/index.ts) y se prueba con node (claude.test.ts).
//
// Todo se lee y se escribe con el token de la persona (el que da el inicio de sesión OAuth de Supabase Auth)
// y la clave pública: la seguridad por persona (RLS) de las tablas manda, igual que en la app. Aquí no hay
// clave de servicio ni ningún secreto.

/* ---------------- Acceso a la base de datos (PostgREST con el token de la persona) ---------------- */

export class ErrorDatos extends Error {
  status: number;
  constructor(status: number, msg: string) { super(msg); this.status = status; }
}

/** Una petición a Supabase (ruta relativa: «/rest/v1/…» o «/auth/v1/…»). Lanza ErrorDatos si no va bien. */
export type Rest = (metodo: string, ruta: string, cuerpo?: unknown, cabeceras?: Record<string, string>) => Promise<any>;

export function crearRest(base: string, apikey: string, token: string, f: typeof fetch = fetch): Rest {
  return async (metodo, ruta, cuerpo, cabeceras = {}) => {
    const r = await f(base + ruta, {
      method: metodo,
      headers: {
        apikey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json",
        ...cabeceras,
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    const texto = await r.text();
    let d: any = null;
    try { d = texto ? JSON.parse(texto) : null; } catch { d = texto; }
    if (!r.ok) throw new ErrorDatos(r.status, (d && (d.message || d.msg || d.error_description || d.error)) || `Error ${r.status}`);
    return d;
  };
}

const q = encodeURIComponent;

/* ---------------- Fechas (Europa/Madrid, como la persona) ---------------- */

export const ZONA = "Europe/Madrid";
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** «2026-11-14» del día en Madrid. */
export function hoy(ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}
export function sumarDias(dia: string, n: number): string {
  const d = new Date(dia + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const diaSemana = (dia: string) => DIAS[new Date(dia + "T12:00:00Z").getUTCDay()];
/** Lunes y domingo de la semana de ese día. */
export function semana(dia: string): { desde: string; hasta: string } {
  const w = (new Date(dia + "T12:00:00Z").getUTCDay() + 6) % 7;
  const desde = sumarDias(dia, -w);
  return { desde, hasta: sumarDias(desde, 6) };
}
function esFecha(s: unknown): s is string {
  return typeof s === "string" && FECHA.test(s) && !isNaN(Date.parse(s + "T12:00:00Z")) &&
    new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s;
}
/** Hora local de una sesión con su diferencia con UTC («tz» del móvil, en minutos). */
export function horaLocal(iso: string, tzMin: number): string {
  const d = new Date(Date.parse(iso) + (tzMin || 0) * 60000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

/* ---------------- Material de la persona ---------------- */

/** Material que se marca en los ajustes de la app (config); lo demás (silla, pared, sofá, toalla) se da por hecho. */
export const MATERIAL_AJUSTES = ["correas", "mancuernas", "gomas", "banda"] as const;
export const NOMBRE_MATERIAL: Record<string, string> = {
  correas: "correas de suspensión (TRX)", mancuernas: "mancuernas", gomas: "bandas elásticas grandes",
  banda: "mini banda de glúteo", silla: "silla", pared: "pared", sofa: "sofá", toalla: "toalla",
};

export function materialDe(config: any): Record<string, boolean> {
  const c = config && typeof config === "object" ? config : {};
  return Object.fromEntries(MATERIAL_AJUSTES.map((m) => [m, c[m] === true]));
}
/** Lo que le falta a la persona para hacer un ejercicio (vacío si lo tiene todo). */
export function faltaMaterial(material: string[] | undefined, tiene: Record<string, boolean>): string[] {
  return (material ?? []).filter((m) => (MATERIAL_AJUSTES as readonly string[]).includes(m) && !tiene[m]);
}

/* ---------------- Sesiones listas para empezar (misma forma que una favorita) ---------------- */

export type Ficha = { tipo?: string; material?: string[]; nombre?: string; zona?: string; lados?: string };
export type Catalogo = Record<string, { name: string; ficha: Ficha }>;

/** Lo mismo que clampN/normFree en assets/app/motor.js: segundos de 5 en 5 (5–180) o repeticiones (1–50). */
export function ajustarN(isometrico: boolean, n: number): number {
  return isometrico
    ? Math.min(180, Math.max(5, Math.round(n / 5) * 5 || 5))
    : Math.min(50, Math.max(1, Math.round(n) || 1));
}

export type Sesion = { name?: string; sel: { k: string; n: number; kg?: number; band?: string }[]; rounds: number; rest: number; alt: boolean; notas?: string };

/**
 * Comprueba y deja con la forma de la app una sesión de ejercicios: { sel: [{ k, n, kg?, band? }], rounds, rest, alt }.
 * Devuelve los avisos (material que falta, banda que no existe, números ajustados) para que Claude se los diga a la persona.
 */
export function normalizarSesion(s: any, cat: Catalogo, tiene: Record<string, boolean>, bandas: string[]): { sesion: Sesion; avisos: string[] } {
  if (!s || typeof s !== "object") throw new Error("Falta la sesión ({ ejercicios: [...] })");
  const lista = Array.isArray(s.ejercicios) ? s.ejercicios : Array.isArray(s.sel) ? s.sel : null;
  if (!lista || !lista.length) throw new Error("La sesión necesita al menos un ejercicio");
  if (lista.length > 20) throw new Error("Como mucho 20 ejercicios por sesión");
  const avisos: string[] = [];
  const sel = lista.map((e: any, i: number) => {
    const k = String(e?.clave ?? e?.k ?? "");
    const c = cat[k];
    if (!c) throw new Error(`Ejercicio ${i + 1}: la clave «${k}» no está en el catálogo (mira ver_catalogo)`);
    const iso = c.ficha?.tipo === "isometrico";
    const pedido = Number(iso ? (e.segundos ?? e.n) : (e.repeticiones ?? e.n));
    if (!Number.isFinite(pedido) || pedido <= 0) {
      throw new Error(`${c.name}: falta ${iso ? "«segundos» (es de mantener)" : "«repeticiones»"}`);
    }
    const n = ajustarN(iso, pedido);
    if (n !== pedido) avisos.push(`${c.name}: ${pedido} → ${n} ${iso ? "s" : "repeticiones"} (lo que admite la app)`);
    const falta = faltaMaterial(c.ficha?.material, tiene);
    if (falta.length) avisos.push(`${c.name} necesita ${falta.map((m) => NOMBRE_MATERIAL[m] ?? m).join(" y ")}, que no está marcado en sus ajustes`);
    const it: { k: string; n: number; kg?: number; band?: string } = { k, n };
    const kg = e.kg ?? e.kilos;
    if (kg != null) {
      const v = Number(kg);
      if (!Number.isFinite(v) || v < 0 || v > 200) throw new Error(`${c.name}: kilos no válidos`);
      it.kg = Math.round(v * 4) / 4;
    }
    const band = e.banda ?? e.band;
    if (band != null && band !== "") {
      it.band = String(band).slice(0, 40);
      if (!bandas.includes(it.band)) avisos.push(`${c.name}: la banda «${it.band}» no es ninguna de las suyas (${bandas.join(", ")})`);
    }
    return it;
  });
  const rondas = Number(s.rondas ?? s.rounds ?? 3);
  const descanso = Number(s.descanso ?? s.rest ?? 75);
  const sesion: Sesion = {
    sel,
    rounds: Math.min(10, Math.max(1, Math.round(rondas) || 3)),
    rest: Math.min(180, Math.max(15, Math.round((descanso || 75) / 15) * 15)),
    alt: (s.alternar ?? s.alt) !== false,
  };
  if (sesion.rounds !== rondas) avisos.push(`Rondas: ${rondas} → ${sesion.rounds} (de 1 a 10)`);
  if (sesion.rest !== descanso) avisos.push(`Descanso: ${descanso} → ${sesion.rest} s (de 15 a 180, de 15 en 15)`);
  if (s.notas) sesion.notas = String(s.notas).slice(0, 500);
  return { sesion, avisos };
}

/* ---------------- Medidas ---------------- */

export const UNIDAD_MEDIDA: Record<string, string> = {
  weight: "kg", body_fat: "%", muscle_mass: "kg", water: "%", visceral_fat: "nivel", bone_mass: "kg",
  waist: "cm", hip: "cm", chest: "cm", arm: "cm", thigh: "cm", neck: "cm", calf: "cm",
  resting_hr: "ppm",
};
const LIMITES: Record<string, [number, number]> = { kg: [1, 400], "%": [1, 80], cm: [5, 300], nivel: [0, 60], ppm: [20, 200] };

export function normalizarMedida(m: any, ahora = new Date()) {
  const kind = String(m?.tipo ?? m?.kind ?? "");
  const unit = UNIDAD_MEDIDA[kind];
  if (!unit) throw new Error(`Tipo de medida «${kind}» no válido: ${Object.keys(UNIDAD_MEDIDA).join(", ")}`);
  const value = Number(m.valor ?? m.value);
  const [lo, hi] = LIMITES[unit];
  if (!Number.isFinite(value) || value < lo || value > hi) throw new Error(`${kind}: ${m.valor} ${unit} no parece correcto`);
  let measured_at = ahora.toISOString();
  if (m.fecha) {
    const t = Date.parse(esFecha(m.fecha) ? m.fecha + "T08:00:00+01:00" : m.fecha);
    if (isNaN(t)) throw new Error(`Fecha «${m.fecha}» no válida (AAAA-MM-DD o con hora)`);
    if (t > ahora.getTime() + 3600000) throw new Error("La fecha de la medida no puede ser futura");
    measured_at = new Date(t).toISOString();
  }
  return { kind, value: Math.round(value * 100) / 100, unit, measured_at, source: "claude", note: m.nota ? String(m.nota).slice(0, 300) : null };
}

/* ---------------- Días del plan ---------------- */

const TIPOS_DIA = ["strength", "core", "cardio", "run", "mobility", "rest", "other"];
const NOMBRE_TIPO: Record<string, string> = {
  fuerza: "strength", core: "core", cardio: "cardio", carrera: "run", correr: "run", movilidad: "mobility",
  descanso: "rest", otro: "other",
};
export function tipoDia(t: unknown): string {
  const s = String(t ?? "strength").toLowerCase();
  const v = NOMBRE_TIPO[s] ?? s;
  if (!TIPOS_DIA.includes(v)) throw new Error(`Tipo de día «${t}» no válido: fuerza, core, cardio, carrera, movilidad, descanso u otro`);
  return v;
}

/* ---------------- Contexto de cada llamada ---------------- */

export type Ctx = { rest: Rest; uid: string; email?: string; ahora?: Date };

async function catalogo(rest: Rest): Promise<Catalogo> {
  const filas: any[] = await rest("GET", "/rest/v1/exercise_catalog?select=key,name,ficha&estado=eq.publicado&order=key");
  return Object.fromEntries(filas.map((f) => [f.key, { name: f.name, ficha: f.ficha ?? {} }]));
}
async function estadoApp(rest: Rest): Promise<any> {
  const filas: any[] = await rest("GET", "/rest/v1/app_state?select=data,updated_at");
  return filas[0]?.data ?? {};
}
/** Las bandas de la persona (las que se ven en la app; si no ha puesto nombres, las de serie). */
function bandasDe(estado: any): string[] {
  let b = estado?.free?.bands;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
  const a = Array.isArray(b) ? b.filter((x) => typeof x === "string" && x.trim()) : [];
  return a.length ? a : ["Banda 1", "Banda 2", "Banda 3", "Banda 4"];
}
function objeto(v: any): any {
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return {}; } }
  return v && typeof v === "object" ? v : {};
}

/* ---------------- Herramientas: leer ---------------- */

async function verPerfil(ctx: Ctx) {
  const [perfiles, estado, ultimas, conex] = await Promise.all([
    ctx.rest("GET", "/rest/v1/profiles?select=display_name,sex,birth_year,height_cm,goal,goal_kind"),
    estadoApp(ctx.rest),
    ctx.rest("GET", "/rest/v1/body_measurements?select=kind,value,unit,measured_at&kind=in.(weight,body_fat,waist)&order=measured_at.desc&limit=10"),
    ctx.rest("GET", "/rest/v1/connections?select=provider,status,connected_at"),
  ]);
  const p = perfiles[0] ?? {};
  const config = objeto(estado.config);
  const ultima: Record<string, unknown> = {};
  for (const m of ultimas) if (!ultima[m.kind]) ultima[m.kind] = { valor: Number(m.value), unidad: m.unit, fecha: m.measured_at.slice(0, 10) };
  const tiene = materialDe(config);
  return {
    hoy: hoy(ctx.ahora), dia_semana: diaSemana(hoy(ctx.ahora)), email: ctx.email,
    nombre: p.display_name ?? null, sexo: p.sex ?? null, año_nacimiento: p.birth_year ?? null,
    altura_cm: p.height_cm != null ? Number(p.height_cm) : null,
    objetivo: p.goal ?? null, tipo_objetivo: p.goal_kind ?? null,
    material: Object.fromEntries(Object.entries(tiene).map(([k, v]) => [NOMBRE_MATERIAL[k], v])),
    clave_material: tiene,
    bandas: bandasDe(estado),
    banda_por_ejercicio: objeto(objeto(estado.free).bandUse),
    kilos_por_ejercicio: objeto(estado.weights),
    rutina_core: { intensidad: config.int ?? null, rondas: config.rounds ?? null, modulos: config.mods ?? null, alterna_a_b: config.auto ?? null },
    ultimas_medidas: ultima,
    conexiones: conex.map((c: any) => ({ servicio: c.provider, estado: c.status })),
    nota: Object.keys(estado).length ? undefined : "La app aún no ha subido sus ajustes a la nube: el material y las bandas son los de serie.",
  };
}

async function verMedidas(ctx: Ctx, a: any) {
  let ruta = "/rest/v1/body_measurements?select=id,kind,value,unit,measured_at,source,note&order=measured_at.desc";
  if (a.tipo) ruta += `&kind=eq.${q(String(a.tipo))}`;
  if (a.desde) { if (!esFecha(a.desde)) throw new Error("«desde» tiene que ser AAAA-MM-DD"); ruta += `&measured_at=gte.${a.desde}`; }
  ruta += `&limit=${Math.min(500, Math.max(1, Number(a.limite) || 60))}`;
  const filas: any[] = await ctx.rest("GET", ruta);
  return { medidas: filas.map((m) => ({ id: m.id, tipo: m.kind, valor: Number(m.value), unidad: m.unit, fecha: m.measured_at, origen: m.source, nota: m.note ?? undefined })) };
}

/** Una sesión hecha, resumida: las series agrupadas por ejercicio en su orden. */
export function resumirSesion(w: any, conSeries: boolean) {
  const ex = w.extra ?? {};
  const o: any = {
    id: w.id, fecha: horaLocal(w.started_at, w.tz_offset_min), minutos: Math.round((Date.parse(w.ended_at) - Date.parse(w.started_at)) / 60000),
    tipo: w.kind, origen: w.src, titulo: w.title ?? undefined, dia_ab: w.ab_day || undefined, rondas: w.rounds ?? undefined,
    completa: w.complete,
    pulso: w.hr_avg || ex.hr ? { medio: w.hr_avg ?? ex.hr?.avg, max: w.hr_max ?? ex.hr?.max } : undefined,
    esfuerzo_rpe: w.rpe ?? ex.rpe ?? undefined, sensacion: ex.feel ?? undefined, como_ha_ido: w.feedback ?? undefined,
    strava: w.strava_status ?? ex.strava?.s ?? undefined, plan_day_id: w.plan_day_id ?? undefined,
  };
  const sets: any[] = [...(w.workout_sets ?? [])].sort((a, b) => a.idx - b.idx);
  o.series_hechas = sets.filter((s) => !s.skipped).length;
  if (conSeries) {
    const por = new Map<string, any>();
    for (const s of sets) {
      let e = por.get(s.exercise_key);
      if (!e) { e = { clave: s.exercise_key, nombre: s.exercise_name, series: [] }; por.set(s.exercise_key, e); }
      const x: any = { ronda: s.round };
      if (s.side) x.lado = s.side;
      if (s.plan_secs || s.secs) { x.segundos = s.secs; x.plan_segundos = s.plan_secs; } else { x.repeticiones = s.reps; x.plan_repeticiones = s.plan_reps; }
      if (s.kg != null) x.kg = Number(s.kg);
      if (s.band) x.banda = s.band;
      if (s.hr_avg) x.pulso = { medio: s.hr_avg, max: s.hr_max };
      if (s.skipped) x.saltada = true;
      e.series.push(x);
    }
    o.ejercicios = [...por.values()];
  }
  return o;
}

async function verHistorial(ctx: Ctx, a: any) {
  const lim = Math.min(100, Math.max(1, Number(a.limite) || 15));
  let ruta = "/rest/v1/workout_sessions?select=*,workout_sets(*)&order=started_at.desc&limit=" + lim;
  if (a.desde) { if (!esFecha(a.desde)) throw new Error("«desde» tiene que ser AAAA-MM-DD"); ruta += `&started_at=gte.${a.desde}`; }
  if (a.hasta) { if (!esFecha(a.hasta)) throw new Error("«hasta» tiene que ser AAAA-MM-DD"); ruta += `&started_at=lt.${sumarDias(a.hasta, 1)}`; }
  if (a.ejercicio) ruta += `&workout_sets.exercise_key=eq.${q(String(a.ejercicio))}`;
  const filas: any[] = await ctx.rest("GET", ruta);
  const conSeries = a.series !== false;
  let sesiones = filas.map((w) => resumirSesion(w, conSeries));
  if (a.ejercicio) sesiones = sesiones.filter((s) => !conSeries || s.ejercicios.length);
  return { sesiones, nota: filas.length === lim ? `Hay más: pide con «hasta» anterior a ${sesiones.at(-1)?.fecha.slice(0, 10)}` : undefined };
}

async function verFavoritas(ctx: Ctx) {
  const filas: any[] = await ctx.rest("GET", "/rest/v1/favorites?select=name,position,data&order=position.asc");
  return { favoritas: filas.map((f) => ({ nombre: f.name, ...f.data, name: undefined })) };
}

async function verPlan(ctx: Ctx, a: any) {
  const base = semana(hoy(ctx.ahora));
  const desde = a.desde ?? base.desde, hasta = a.hasta ?? (a.desde ? sumarDias(a.desde, 6) : base.hasta);
  if (!esFecha(desde) || !esFecha(hasta)) throw new Error("Fechas en AAAA-MM-DD");
  const [planes, dias] = await Promise.all([
    ctx.rest("GET", `/rest/v1/plans?select=id,name,source,goal_kind,starts_on,ends_on,active,data,updated_at&or=(active.eq.true,and(starts_on.lte.${hasta},ends_on.gte.${desde}))&order=starts_on.desc.nullslast&limit=20`),
    ctx.rest("GET", `/rest/v1/plan_days?select=id,plan_id,day,position,kind,title,workout,status,session_id&day=gte.${desde}&day=lte.${hasta}&order=day,position`),
  ]);
  return {
    hoy: hoy(ctx.ahora), desde, hasta,
    planes: planes.map((p: any) => ({ id: p.id, nombre: p.name, origen: p.source, activo: p.active, desde: p.starts_on, hasta: p.ends_on, objetivo: p.goal_kind ?? undefined, notas: p.data?.notas })),
    dias: dias.map((d: any) => ({
      id: d.id, plan_id: d.plan_id, dia: d.day, dia_semana: diaSemana(d.day), posicion: d.position, tipo: d.kind,
      titulo: d.title, sesion: d.workout ?? undefined, estado: d.status, sesion_hecha: d.session_id ?? undefined,
    })),
  };
}

async function verCatalogo(ctx: Ctx, a: any) {
  const estado = await estadoApp(ctx.rest);
  const tiene = materialDe(objeto(estado.config));
  if (a.clave) {
    const f: any[] = await ctx.rest("GET", `/rest/v1/exercise_catalog?select=key,name,estado,ficha,tecnica&key=eq.${q(String(a.clave))}`);
    if (!f.length) throw new Error(`No hay ningún ejercicio «${a.clave}»`);
    return { ...f[0], le_falta: faltaMaterial(f[0].ficha?.material, tiene) };
  }
  const filas: any[] = await ctx.rest("GET", "/rest/v1/exercise_catalog?select=key,name,ficha&estado=eq.publicado&order=key");
  let lista = filas.map((x) => {
    const f = x.ficha ?? {};
    const falta = faltaMaterial(f.material, tiene);
    return {
      clave: x.key, nombre: x.name, zona: f.zona, tipo: f.tipo === "isometrico" ? "mantener (segundos)" : "repeticiones",
      lados: f.lados, nivel: f.nivel, patron: f.patron, musculos: f.musculos?.principales, usos: f.usos,
      material: f.material, disponible: falta.length === 0, dosis: f.dosis,
      progresion: f.progresion ?? undefined, regresion: f.regresion ?? undefined, sustitutos: f.sustitutos,
      evitar_si: f.evitar_si || undefined, carga: f.carga,
    };
  });
  if (a.zona) lista = lista.filter((x) => String(x.zona).toLowerCase() === String(a.zona).toLowerCase());
  if (a.solo_disponibles) lista = lista.filter((x) => x.disponible);
  return { material_de_la_persona: tiene, ejercicios: lista };
}

/* ---------------- Herramientas: escribir ---------------- */

async function contextoSesion(ctx: Ctx) {
  const [cat, estado] = await Promise.all([catalogo(ctx.rest), estadoApp(ctx.rest)]);
  return { cat, tiene: materialDe(objeto(estado.config)), bandas: bandasDe(estado) };
}

/** Un día del plan: lo que se guarda en plan_days (la sesión, si hay, ya comprobada). */
function filaDia(d: any, cs: Awaited<ReturnType<typeof contextoSesion>>, avisos: string[]) {
  if (!esFecha(d?.dia)) throw new Error(`Día «${d?.dia}» no válido (AAAA-MM-DD)`);
  const kind = tipoDia(d.tipo);
  const title = String(d.titulo ?? "").trim().slice(0, 120);
  if (!title) throw new Error(`${d.dia}: falta el título`);
  let workout: any = null;
  if (d.sesion) {
    const r = normalizarSesion(d.sesion, cs.cat, cs.tiene, cs.bandas);
    workout = { name: title, ...r.sesion };
    avisos.push(...r.avisos.map((x) => `${d.dia}: ${x}`));
  } else if (kind === "core") {
    workout = { rutina: true };  // la rutina de core de la app, con sus ajustes
  }
  if (d.notas) workout = { ...(workout ?? {}), notas: String(d.notas).slice(0, 500) };
  return { day: d.dia, position: Math.max(0, Math.round(Number(d.posicion) || 0)), kind, title, workout };
}

async function guardarPlan(ctx: Ctx, a: any) {
  const nombre = String(a.nombre ?? "").trim().slice(0, 80);
  if (!nombre) throw new Error("Falta el nombre del plan");
  if (!esFecha(a.desde) || !esFecha(a.hasta) || a.hasta < a.desde) throw new Error("«desde» y «hasta» en AAAA-MM-DD, y hasta ≥ desde");
  if (sumarDias(a.desde, 92) < a.hasta) throw new Error("Un plan como mucho de 3 meses");
  const dias = Array.isArray(a.dias) ? a.dias : [];
  if (dias.length > 120) throw new Error("Demasiados días");
  const cs = await contextoSesion(ctx);
  const avisos: string[] = [];
  const filas: ReturnType<typeof filaDia>[] = dias.map((d: any) => filaDia(d, cs, avisos));
  for (const f of filas) if (f.day < a.desde || f.day > a.hasta) throw new Error(`${f.day} está fuera del plan (${a.desde} – ${a.hasta})`);
  const datos = { notas: a.notas ? String(a.notas).slice(0, 2000) : undefined };

  let planId: string;
  if (a.plan_id) {
    const p: any[] = await ctx.rest("PATCH", `/rest/v1/plans?id=eq.${q(a.plan_id)}`, {
      name: nombre, starts_on: a.desde, ends_on: a.hasta, goal_kind: a.objetivo ?? null, data: datos, active: true,
    }, { Prefer: "return=representation" });
    if (!p.length) throw new Error("Ese plan no existe o no es tuyo");
    planId = p[0].id;
    // Los días pendientes se sustituyen; los hechos o saltados se quedan como están
    await ctx.rest("DELETE", `/rest/v1/plan_days?plan_id=eq.${q(planId)}&status=eq.planned`);
  } else {
    const p: any[] = await ctx.rest("POST", "/rest/v1/plans", {
      name: nombre, source: "claude", goal_kind: a.objetivo ?? null, starts_on: a.desde, ends_on: a.hasta, active: true, data: datos,
    }, { Prefer: "return=representation" });
    planId = p[0].id;
  }
  if (filas.length) {
    try {
      await ctx.rest("POST", "/rest/v1/plan_days", filas.map((f) => ({ ...f, plan_id: planId, status: "planned" })), { Prefer: "return=minimal" });
    } catch (e) {
      if (!a.plan_id) await ctx.rest("DELETE", `/rest/v1/plans?id=eq.${q(planId)}`).catch(() => {});
      throw e;
    }
  }
  // Solo un plan de Claude activo: los otros que se solapan se apagan (no se borran)
  await ctx.rest("PATCH", `/rest/v1/plans?source=eq.claude&active=eq.true&id=neq.${q(planId)}&starts_on=lte.${a.hasta}&ends_on=gte.${a.desde}`, { active: false });
  return { ok: true, plan_id: planId, dias: filas.length, avisos: avisos.length ? avisos : undefined };
}

/** El plan de Claude activo que cubre ese día; si no hay, uno nuevo para su semana. */
async function planParaDia(ctx: Ctx, dia: string): Promise<string> {
  const p: any[] = await ctx.rest("GET", `/rest/v1/plans?select=id&source=eq.claude&active=eq.true&starts_on=lte.${dia}&ends_on=gte.${dia}&order=updated_at.desc&limit=1`);
  if (p.length) return p[0].id;
  const s = semana(dia);
  const n: any[] = await ctx.rest("POST", "/rest/v1/plans", {
    name: `Plan de Claude · semana del ${s.desde}`, source: "claude", starts_on: s.desde, ends_on: s.hasta, active: true, data: {},
  }, { Prefer: "return=representation" });
  return n[0].id;
}

async function guardarDia(ctx: Ctx, a: any) {
  const cs = await contextoSesion(ctx);
  const avisos: string[] = [];
  const fila = filaDia(a, cs, avisos);
  const estado = a.estado ? ({ pendiente: "planned", hecho: "done", saltado: "skipped" } as any)[a.estado] ?? a.estado : undefined;
  if (estado && !["planned", "done", "skipped"].includes(estado)) throw new Error("«estado»: pendiente, hecho o saltado");
  if (a.plan_day_id) {
    const r: any[] = await ctx.rest("PATCH", `/rest/v1/plan_days?id=eq.${q(a.plan_day_id)}`, { ...fila, ...(estado ? { status: estado } : {}) }, { Prefer: "return=representation" });
    if (!r.length) throw new Error("Ese día del plan no existe o no es tuyo");
    return { ok: true, plan_day_id: r[0].id, plan_id: r[0].plan_id, avisos: avisos.length ? avisos : undefined };
  }
  const planId = a.plan_id ?? await planParaDia(ctx, fila.day);
  const r: any[] = await ctx.rest("POST", "/rest/v1/plan_days", { ...fila, plan_id: planId, status: estado ?? "planned" }, { Prefer: "return=representation" });
  return { ok: true, plan_day_id: r[0].id, plan_id: planId, avisos: avisos.length ? avisos : undefined };
}

async function borrarDia(ctx: Ctx, a: any) {
  if (!a.plan_day_id) throw new Error("Falta plan_day_id (míralo en ver_plan)");
  const r: any[] = await ctx.rest("DELETE", `/rest/v1/plan_days?id=eq.${q(a.plan_day_id)}`, undefined, { Prefer: "return=representation" });
  if (!r.length) throw new Error("Ese día del plan no existe o no es tuyo");
  return { ok: true, borrado: { dia: r[0].day, titulo: r[0].title } };
}

const MAX_FAVORITAS = 20;  // como saveFavs en motor.js

async function guardarFavorita(ctx: Ctx, a: any) {
  const nombre = String(a.nombre ?? "").trim().slice(0, 60);
  if (!nombre) throw new Error("Falta el nombre de la favorita");
  const cs = await contextoSesion(ctx);
  const { sesion, avisos } = normalizarSesion(a.sesion, cs.cat, cs.tiene, cs.bandas);
  const actuales: any[] = await ctx.rest("GET", "/rest/v1/favorites?select=name,position&order=position.asc");
  const viejo = a.nombre_anterior ? String(a.nombre_anterior) : nombre;
  const previa = actuales.find((f) => f.name === viejo);
  if (!previa && !actuales.some((f) => f.name === nombre) && actuales.length >= MAX_FAVORITAS) {
    throw new Error(`Ya tiene ${MAX_FAVORITAS} favoritas, el máximo de la app: borra o cambia alguna`);
  }
  const position = previa?.position ?? actuales.find((f) => f.name === nombre)?.position ?? (actuales.reduce((m, f) => Math.max(m, f.position), -1) + 1);
  const data = { name: nombre, ...sesion, zone: "", needs: "" };
  if (previa && viejo !== nombre) await ctx.rest("DELETE", `/rest/v1/favorites?name=eq.${q(viejo)}`);
  await ctx.rest("POST", "/rest/v1/favorites?on_conflict=user_id,name", { name: nombre, position, data }, { Prefer: "resolution=merge-duplicates,return=minimal" });
  return { ok: true, favorita: nombre, nueva: !previa, avisos: avisos.length ? avisos : undefined };
}

async function borrarFavorita(ctx: Ctx, a: any) {
  const r: any[] = await ctx.rest("DELETE", `/rest/v1/favorites?name=eq.${q(String(a.nombre ?? ""))}`, undefined, { Prefer: "return=representation" });
  if (!r.length) throw new Error(`No hay ninguna favorita «${a.nombre}»`);
  return { ok: true, borrada: a.nombre };
}

async function apuntarMedidas(ctx: Ctx, a: any) {
  const lista = Array.isArray(a.medidas) ? a.medidas : [];
  if (!lista.length || lista.length > 30) throw new Error("Entre 1 y 30 medidas");
  const filas = lista.map((m: any) => normalizarMedida(m, ctx.ahora));
  const r: any[] = await ctx.rest("POST", "/rest/v1/body_measurements", filas, { Prefer: "return=representation" });
  return { ok: true, apuntadas: r.map((m) => ({ id: m.id, tipo: m.kind, valor: Number(m.value), unidad: m.unit, fecha: m.measured_at })) };
}

async function borrarMedida(ctx: Ctx, a: any) {
  const r: any[] = await ctx.rest("DELETE", `/rest/v1/body_measurements?id=eq.${q(String(a.id ?? ""))}`, undefined, { Prefer: "return=representation" });
  if (!r.length) throw new Error("Esa medida no existe o no es tuya");
  return { ok: true, borrada: { tipo: r[0].kind, valor: Number(r[0].value), fecha: r[0].measured_at } };
}

/* ---------------- Lista de herramientas (lo que ve Claude) ---------------- */

const FECHA_S = { type: "string", description: "AAAA-MM-DD" };
const SESION_S = {
  type: "object",
  description: "Sesión de ejercicios sueltos, como una favorita de la app. Las claves salen de ver_catalogo. " +
    "Un ejercicio de mantener lleva «segundos» (5–180, de 5 en 5); uno de repeticiones, «repeticiones» (1–50). " +
    "Los de un lado y otro (lados: por_lado) la app los hace a los dos lados sola.",
  properties: {
    ejercicios: {
      type: "array", minItems: 1, maxItems: 20,
      items: {
        type: "object", required: ["clave"],
        properties: {
          clave: { type: "string" }, repeticiones: { type: "integer" }, segundos: { type: "integer" },
          kg: { type: "number", description: "Kilos por mano (mancuernas)" },
          banda: { type: "string", description: "Nombre de una de sus bandas (ver_perfil → bandas)" },
        },
      },
    },
    rondas: { type: "integer", minimum: 1, maximum: 10, default: 3 },
    descanso: { type: "integer", description: "Segundos entre rondas (15–180, de 15 en 15)", default: 75 },
    alternar: { type: "boolean", description: "true: un ejercicio tras otro en circuito; false: todas las rondas de uno y luego el siguiente", default: true },
    notas: { type: "string" },
  },
  required: ["ejercicios"],
};
const DIA_S = {
  type: "object", required: ["dia", "titulo"],
  properties: {
    dia: FECHA_S, titulo: { type: "string", description: "«Fuerza de cuerpo entero», «Descanso», «Carrera suave 30 min»…" },
    tipo: { type: "string", enum: ["fuerza", "core", "cardio", "carrera", "movilidad", "descanso", "otro"], default: "fuerza" },
    sesion: SESION_S, posicion: { type: "integer", description: "Orden si hay varias cosas el mismo día (0, 1…)" },
    notas: { type: "string" },
  },
};

const LEER = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const ESCRIBIR = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
const BORRAR = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false };

type Herramienta = { name: string; title: string; description: string; inputSchema: any; annotations: any; run: (ctx: Ctx, a: any) => Promise<unknown> };

export const HERRAMIENTAS: Herramienta[] = [
  {
    name: "ver_perfil", title: "Perfil, objetivo y material",
    description: "Lo primero que hay que mirar: fecha de hoy, perfil (sexo, año, altura), objetivo, material que tiene " +
      "(mancuernas, bandas elásticas grandes, mini banda, correas TRX), nombres de sus bandas, kilos que usa en cada ejercicio, " +
      "últimas medidas y conexiones (Strava, Polar).",
    inputSchema: { type: "object", properties: {} }, annotations: LEER, run: verPerfil,
  },
  {
    name: "ver_medidas", title: "Peso y medidas",
    description: "Peso y medidas corporales (weight, body_fat, muscle_mass, waist, hip, chest, arm, thigh…), de la más reciente a la más antigua.",
    inputSchema: { type: "object", properties: { tipo: { type: "string" }, desde: FECHA_S, limite: { type: "integer", default: 60 } } },
    annotations: LEER, run: verMedidas,
  },
  {
    name: "ver_historial", title: "Historial de sesiones",
    description: "Sesiones hechas (de la más reciente a la más antigua) con sus series: repeticiones o segundos hechos y planeados, " +
      "kilos, banda, si se saltó, pulso del reloj, esfuerzo (RPE), sensación y cómo le fue cada módulo. " +
      "«ejercicio» filtra por clave para ver la progresión de uno.",
    inputSchema: {
      type: "object",
      properties: {
        desde: FECHA_S, hasta: FECHA_S, limite: { type: "integer", default: 15, maximum: 100 },
        series: { type: "boolean", default: true, description: "false: solo el resumen de cada sesión" },
        ejercicio: { type: "string", description: "Clave de un ejercicio" },
      },
    },
    annotations: LEER, run: verHistorial,
  },
  {
    name: "ver_favoritas", title: "Favoritas",
    description: "Las sesiones favoritas guardadas en la app (ejercicios con repeticiones o segundos, rondas, descanso y si alterna).",
    inputSchema: { type: "object", properties: {} }, annotations: LEER, run: verFavoritas,
  },
  {
    name: "ver_plan", title: "Plan actual",
    description: "Planes activos y los días de un periodo (por defecto, esta semana de lunes a domingo) con su sesión y si se hizo.",
    inputSchema: { type: "object", properties: { desde: FECHA_S, hasta: FECHA_S } }, annotations: LEER, run: verPlan,
  },
  {
    name: "ver_catalogo", title: "Catálogo de ejercicios",
    description: "Los ejercicios que sabe hacer la app (con figura): clave, zona, tipo (repeticiones o mantener), lados, nivel, " +
      "músculos, material y si la persona lo tiene (disponible), dosis recomendada, progresión, regresión, sustitutos y carga en " +
      "articulaciones (0–2). Con «clave», la ficha y la técnica completas de uno. Solo se pueden usar estas claves en las sesiones.",
    inputSchema: {
      type: "object",
      properties: { clave: { type: "string" }, zona: { type: "string" }, solo_disponibles: { type: "boolean", default: false } },
    },
    annotations: LEER, run: verCatalogo,
  },
  {
    name: "guardar_plan", title: "Guardar el plan",
    description: "Crea un plan (normalmente la semana: «lunes fuerza de cuerpo entero, martes descanso…») con sus días, o lo " +
      "cambia si se da plan_id (los días pendientes se sustituyen; los hechos se quedan). Los otros planes de Claude que se " +
      "solapan se desactivan. Un día de tipo core sin sesión es la rutina de core de la app. Llega a la app al sincronizar.",
    inputSchema: {
      type: "object", required: ["nombre", "desde", "hasta", "dias"],
      properties: {
        nombre: { type: "string" }, desde: FECHA_S, hasta: FECHA_S, plan_id: { type: "string", description: "Para cambiar uno que ya existe" },
        objetivo: { type: "string", enum: ["strength", "muscle", "cardio", "mobility", "weight_loss", "health"] },
        notas: { type: "string", description: "Por qué es así, progresión prevista…" }, dias: { type: "array", items: DIA_S },
      },
    },
    annotations: ESCRIBIR, run: guardarPlan,
  },
  {
    name: "guardar_dia", title: "Crear o cambiar la sesión de un día",
    description: "Crea la sesión de un día (p. ej. la de hoy, lista para empezar en la app) o cambia una que ya existe con " +
      "plan_day_id (también para marcarla hecha o saltada). Sin plan_id, va al plan de Claude activo de ese día o a uno nuevo de su semana.",
    inputSchema: {
      type: "object", required: ["dia", "titulo"],
      properties: {
        ...DIA_S.properties, plan_day_id: { type: "string" }, plan_id: { type: "string" },
        estado: { type: "string", enum: ["pendiente", "hecho", "saltado"] },
      },
    },
    annotations: ESCRIBIR, run: guardarDia,
  },
  {
    name: "borrar_dia", title: "Quitar un día del plan",
    description: "Quita una sesión del plan (plan_day_id de ver_plan). No toca el historial.",
    inputSchema: { type: "object", required: ["plan_day_id"], properties: { plan_day_id: { type: "string" } } },
    annotations: BORRAR, run: borrarDia,
  },
  {
    name: "guardar_favorita", title: "Guardar una favorita",
    description: "Crea o cambia una favorita de la app (máximo 20). Con nombre_anterior, la renombra. Sale en Entrenar y en el widget.",
    inputSchema: {
      type: "object", required: ["nombre", "sesion"],
      properties: { nombre: { type: "string" }, nombre_anterior: { type: "string" }, sesion: SESION_S },
    },
    annotations: ESCRIBIR, run: guardarFavorita,
  },
  {
    name: "borrar_favorita", title: "Borrar una favorita",
    description: "Borra una favorita por su nombre.",
    inputSchema: { type: "object", required: ["nombre"], properties: { nombre: { type: "string" } } },
    annotations: BORRAR, run: borrarFavorita,
  },
  {
    name: "apuntar_medidas", title: "Apuntar peso y medidas",
    description: "Apunta una o varias medidas. Tipos y unidades: " +
      Object.entries(UNIDAD_MEDIDA).map(([k, u]) => `${k} (${u})`).join(", ") + ". Sin fecha, ahora.",
    inputSchema: {
      type: "object", required: ["medidas"],
      properties: {
        medidas: {
          type: "array", minItems: 1, maxItems: 30,
          items: {
            type: "object", required: ["tipo", "valor"],
            properties: { tipo: { type: "string", enum: Object.keys(UNIDAD_MEDIDA) }, valor: { type: "number" }, fecha: { type: "string", description: "AAAA-MM-DD o fecha y hora ISO" }, nota: { type: "string" } },
          },
        },
      },
    },
    annotations: ESCRIBIR, run: apuntarMedidas,
  },
  {
    name: "borrar_medida", title: "Borrar una medida",
    description: "Borra una medida apuntada por error (id de ver_medidas).",
    inputSchema: { type: "object", required: ["id"], properties: { id: { type: "string" } } },
    annotations: BORRAR, run: borrarMedida,
  },
];

/* ---------------- Protocolo MCP (JSON-RPC 2.0, sin estado) ---------------- */

export const VERSIONES = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
export const SERVIDOR = { name: "rutina-core", title: "Rutina core", version: "1.0.0" };
const INSTRUCCIONES =
  "Datos de entrenamiento de una persona (app Rutina core). Empieza por ver_perfil (fecha de hoy, objetivo y material) y " +
  "ver_catalogo (solo esas claves sirven en las sesiones). Mira ver_historial para ajustar la carga a lo que hizo de verdad. " +
  "Lo que guardes (planes, sesiones del día, favoritas, medidas) llega a su móvil cuando la app sincroniza. Habla en español.";

type Peticion = { jsonrpc?: string; id?: string | number | null; method?: string; params?: any };

const error = (id: any, code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

/** Responde un mensaje JSON-RPC (null si es una notificación, que no lleva respuesta). */
export async function responder(m: Peticion, ctx: Ctx): Promise<object | null> {
  if (!m || typeof m !== "object" || m.jsonrpc !== "2.0" || typeof m.method !== "string") return error(m?.id, -32600, "Petición no válida");
  const esNotificacion = m.id === undefined;
  if (esNotificacion) return null;
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id: m.id, result });
  switch (m.method) {
    case "initialize": {
      const pedida = m.params?.protocolVersion;
      return ok({
        protocolVersion: VERSIONES.includes(pedida) ? pedida : VERSIONES[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVIDOR, instructions: INSTRUCCIONES,
      });
    }
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: HERRAMIENTAS.map(({ run: _r, ...t }) => t) });
    case "tools/call": {
      const h = HERRAMIENTAS.find((x) => x.name === m.params?.name);
      if (!h) return error(m.id, -32602, `Herramienta desconocida: ${m.params?.name}`);
      try {
        const r = await h.run(ctx, m.params?.arguments ?? {});
        return ok({ content: [{ type: "text", text: JSON.stringify(r, null, 1) }], structuredContent: r });
      } catch (e) {
        const msg = e instanceof ErrorDatos && (e.status === 401 || e.status === 403)
          ? "Sin permiso: vuelve a conectar el conector con tu cuenta de la app" : (e as Error).message;
        return ok({ content: [{ type: "text", text: msg }], isError: true });
      }
    }
    case "resources/list":
      return ok({ resources: [] });
    case "prompts/list":
      return ok({ prompts: [] });
    default:
      return error(m.id, -32601, `Método no disponible: ${m.method}`);
  }
}

/** Un mensaje o un lote. Devuelve null si no hay nada que responder (solo notificaciones). */
export async function responderTodo(cuerpo: unknown, ctx: Ctx): Promise<unknown | null> {
  if (Array.isArray(cuerpo)) {
    if (!cuerpo.length) return error(null, -32600, "Lote vacío");
    const r = (await Promise.all(cuerpo.map((m) => responder(m, ctx)))).filter(Boolean);
    return r.length ? r : null;
  }
  return responder(cuerpo as Peticion, ctx);
}

/* ---------------- Metadatos OAuth (RFC 9728) ---------------- */

export function metadatosRecurso(proyecto: string) {
  return {
    resource: `${proyecto}/functions/v1/claude`,
    authorization_servers: [`${proyecto}/auth/v1`],
    bearer_methods_supported: ["header"],
    scopes_supported: ["openid", "email", "profile"],
    resource_name: "Rutina core",
  };
}
