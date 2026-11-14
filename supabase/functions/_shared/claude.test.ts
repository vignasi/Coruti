// Pruebas del servidor del conector de Claude (B2a), sin red:
// node --experimental-strip-types --test supabase/functions/_shared/claude.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ajustarN, crearRest, ErrorDatos, faltaMaterial, hoy, horaLocal, materialDe, metadatosRecurso, normalizarMedida,
  normalizarSesion, responder, responderTodo, resumirSesion, semana, sumarDias, tipoDia, HERRAMIENTAS, type Ctx, type Rest,
} from "./claude.ts";

const CAT = {
  flex: { name: "Flexiones", ficha: { tipo: "reps", material: [] } },
  plancha: { name: "Plancha", ficha: { tipo: "isometrico", material: [] } },
  press_db: { name: "Press con mancuernas", ficha: { tipo: "reps", material: ["mancuernas"] } },
  remo_goma: { name: "Remo con banda", ficha: { tipo: "reps", material: ["gomas"] } },
  fondos: { name: "Fondos", ficha: { tipo: "reps", material: ["silla"] } },
};
const TODO = { correas: false, mancuernas: true, gomas: true, banda: false };
const BANDAS = ["Roja", "Negra"];

/* ---------------- Fechas ---------------- */

test("hoy y la semana van en hora de Madrid, de lunes a domingo", () => {
  assert.equal(hoy(new Date("2026-11-14T23:30:00Z")), "2026-11-15");  // ya es domingo en Madrid
  assert.deepEqual(semana("2026-11-15"), { desde: "2026-11-09", hasta: "2026-11-15" });
  assert.deepEqual(semana("2026-11-16"), { desde: "2026-11-16", hasta: "2026-11-22" });
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(horaLocal("2026-11-14T17:05:00Z", 60), "2026-11-14 18:05");
});

/* ---------------- Material y sesiones ---------------- */

test("material: solo cuenta lo que se marca en la app", () => {
  assert.deepEqual(materialDe({ mancuernas: true, gomas: "sí" }), { correas: false, mancuernas: true, gomas: false, banda: false });
  assert.deepEqual(faltaMaterial(["mancuernas", "silla"], materialDe({})), ["mancuernas"]);
  assert.deepEqual(faltaMaterial(["silla", "pared"], materialDe({})), []);
});

test("ajustarN hace lo mismo que clampN de motor.js", () => {
  assert.equal(ajustarN(true, 32), 30);
  assert.equal(ajustarN(true, 400), 180);
  assert.equal(ajustarN(true, 1), 5);
  assert.equal(ajustarN(false, 80), 50);
  assert.equal(ajustarN(false, 0.2), 1);
});

test("una sesión queda con la forma de una favorita y avisa de lo que no cuadra", () => {
  const { sesion, avisos } = normalizarSesion({
    ejercicios: [
      { clave: "flex", repeticiones: 12 },
      { clave: "plancha", segundos: 42 },
      { clave: "press_db", repeticiones: 10, kg: 8.1 },
      { clave: "remo_goma", repeticiones: 15, banda: "Azul" },
    ],
    rondas: 12, descanso: 70, alternar: false,
  }, CAT, { ...TODO, mancuernas: false }, BANDAS);
  assert.deepEqual(sesion, {
    sel: [{ k: "flex", n: 12 }, { k: "plancha", n: 40 }, { k: "press_db", n: 10, kg: 8 }, { k: "remo_goma", n: 15, band: "Azul" }],
    rounds: 10, rest: 75, alt: false,
  });
  assert.equal(avisos.length, 5);
  assert.ok(avisos.some((a) => a.includes("mancuernas")));
  assert.ok(avisos.some((a) => a.includes("«Azul»")));
});

test("una sesión con una clave que no existe o sin dosis no se guarda", () => {
  assert.throws(() => normalizarSesion({ ejercicios: [{ clave: "burpee", repeticiones: 10 }] }, CAT, TODO, BANDAS), /burpee/);
  assert.throws(() => normalizarSesion({ ejercicios: [{ clave: "plancha", repeticiones: 10 }] }, CAT, TODO, BANDAS), /segundos/);
  assert.throws(() => normalizarSesion({ ejercicios: [] }, CAT, TODO, BANDAS), /al menos/);
  assert.throws(() => normalizarSesion(null, CAT, TODO, BANDAS), /Falta/);
});

/* ---------------- Medidas y tipos de día ---------------- */

test("medidas: unidad por tipo, límites y fechas", () => {
  const ahora = new Date("2026-11-14T10:00:00Z");
  assert.deepEqual(normalizarMedida({ tipo: "weight", valor: 78.456 }, ahora),
    { kind: "weight", value: 78.46, unit: "kg", measured_at: "2026-11-14T10:00:00.000Z", source: "claude", note: null });
  assert.equal(normalizarMedida({ tipo: "waist", valor: 84, fecha: "2026-11-10" }, ahora).unit, "cm");
  assert.throws(() => normalizarMedida({ tipo: "weight", valor: 7800 }, ahora), /no parece/);
  assert.throws(() => normalizarMedida({ tipo: "peso", valor: 78 }, ahora), /no válido/);
  assert.throws(() => normalizarMedida({ tipo: "weight", valor: 78, fecha: "2027-01-01" }, ahora), /futura/);
});

test("tipos de día en español o como en la tabla", () => {
  assert.equal(tipoDia("fuerza"), "strength");
  assert.equal(tipoDia("descanso"), "rest");
  assert.equal(tipoDia("run"), "run");
  assert.equal(tipoDia(undefined), "strength");
  assert.throws(() => tipoDia("yoga"), /no válido/);
});

/* ---------------- Historial ---------------- */

test("una sesión hecha se resume con sus series agrupadas por ejercicio", () => {
  const o = resumirSesion({
    id: "s1", kind: "sueltos", src: "app", title: "Pecho", ab_day: "", rounds: 2, complete: true,
    started_at: "2026-11-13T17:00:00Z", ended_at: "2026-11-13T17:25:00Z", tz_offset_min: 60, feedback: null,
    hr_avg: 120, hr_max: 150, rpe: null, extra: { rpe: 7, feel: "bien" }, strava_status: "done",
    workout_sets: [
      { idx: 1, exercise_key: "press_db", exercise_name: "Press", round: 1, side: null, reps: 10, plan_reps: 10, secs: 0, plan_secs: 0, kg: "8.00", band: null, skipped: false },
      { idx: 0, exercise_key: "plancha", exercise_name: "Plancha", round: 1, side: null, reps: 0, plan_reps: 0, secs: 30, plan_secs: 30, kg: null, band: null, skipped: false },
      { idx: 2, exercise_key: "press_db", exercise_name: "Press", round: 2, side: null, reps: 6, plan_reps: 10, secs: 0, plan_secs: 0, kg: "8.00", band: null, skipped: true },
    ],
  }, true);
  assert.equal(o.fecha, "2026-11-13 18:00");
  assert.equal(o.minutos, 25);
  assert.deepEqual(o.pulso, { medio: 120, max: 150 });
  assert.equal(o.esfuerzo_rpe, 7);
  assert.equal(o.series_hechas, 2);
  assert.deepEqual(o.ejercicios.map((e: any) => e.clave), ["plancha", "press_db"]);
  assert.deepEqual(o.ejercicios[1].series[1], { ronda: 2, repeticiones: 6, plan_repeticiones: 10, kg: 8, saltada: true });
  assert.equal(resumirSesion({ ...o, started_at: "2026-11-13T17:00:00Z", ended_at: "2026-11-13T17:01:00Z", workout_sets: [] }, false).ejercicios, undefined);
});

/* ---------------- Base de datos simulada (PostgREST mínimo, ya filtrado por persona) ---------------- */

type Fila = Record<string, any>;
function falsaDb(inicio: Record<string, Fila[]> = {}) {
  const t: Record<string, Fila[]> = {
    profiles: [], app_state: [], body_measurements: [], connections: [], favorites: [], plans: [], plan_days: [],
    workout_sessions: [], exercise_catalog: [], ...structuredClone(inicio),
  };
  const llamadas: string[] = [];
  let n = 0;
  const cumple = (f: Fila, k: string, v: string) => {
    const [op, ...r] = v.split("."); const x = r.join(".");
    if (k === "or" || k === "select" || k === "order" || k === "limit" || k === "on_conflict" || k.includes(".")) return true;
    const a = f[k];
    if (op === "eq") return String(a) === x;
    if (op === "neq") return String(a) !== x;
    if (op === "gte") return a != null && String(a) >= x;
    if (op === "lte") return a != null && String(a) <= x;
    if (op === "lt") return a != null && String(a) < x;
    if (op === "in") return x.slice(1, -1).split(",").includes(String(a));
    return true;
  };
  const rest: Rest = async (metodo, ruta, cuerpo, cab = {}) => {
    llamadas.push(`${metodo} ${ruta}`);
    const u = new URL("http://x" + ruta);
    const tabla = u.pathname.split("/").pop()!;
    if (!(tabla in t)) throw new ErrorDatos(404, `No existe ${tabla}`);
    const filtros = [...u.searchParams].filter(([k]) => !["select", "order", "limit", "or", "on_conflict"].includes(k));
    const pasa = (f: Fila) => filtros.every(([k, v]) => cumple(f, k, v));
    const lim = Number(u.searchParams.get("limit")) || Infinity;
    if (metodo === "GET") return t[tabla].filter(pasa).slice(0, lim).map((f) => structuredClone(f));
    if (metodo === "POST") {
      const filas = (Array.isArray(cuerpo) ? cuerpo : [cuerpo]) as Fila[];
      const hechas = filas.map((f) => {
        const conflicto = u.searchParams.get("on_conflict");
        if (conflicto) {
          const claves = conflicto.split(",").filter((c) => c !== "user_id");
          const prev = t[tabla].find((p) => claves.every((c) => p[c] === f[c]));
          if (prev) { Object.assign(prev, f); return prev; }
        }
        const nueva = { id: `id${++n}`, ...f, updated_at: new Date(1e12 + n).toISOString() };
        t[tabla].push(nueva);
        return nueva;
      });
      return (cab.Prefer ?? "").includes("return=representation") ? structuredClone(hechas) : null;
    }
    if (metodo === "PATCH") {
      const tocadas = t[tabla].filter(pasa);
      tocadas.forEach((f) => Object.assign(f, cuerpo));
      return structuredClone(tocadas);
    }
    if (metodo === "DELETE") {
      const fuera = t[tabla].filter(pasa);
      t[tabla] = t[tabla].filter((f) => !fuera.includes(f));
      return structuredClone(fuera);
    }
    throw new Error(metodo);
  };
  return { t, rest, llamadas };
}

const CATALOGO_DB = Object.entries(CAT).map(([key, v]) => ({ key, name: v.name, estado: "publicado", ficha: v.ficha, tecnica: { fases: [] } }));
const ESTADO = [{ data: { config: { mancuernas: true, gomas: true }, weights: { press_db: 8 }, free: { bands: ["Roja", "Negra"], bandUse: { remo_goma: "Roja" } } } }];
const AHORA = new Date("2026-11-14T09:00:00Z");  // sábado

async function llamar(db: ReturnType<typeof falsaDb>, name: string, args: unknown = {}) {
  const ctx: Ctx = { rest: db.rest, uid: "u1", email: "a@b.c", ahora: AHORA };
  const r: any = await responder({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, ctx);
  if (r.result.isError) throw new Error(r.result.content[0].text);
  assert.deepEqual(JSON.parse(r.result.content[0].text), JSON.parse(JSON.stringify(r.result.structuredContent)));
  return r.result.structuredContent;
}

/* ---------------- Protocolo ---------------- */

test("initialize, tools/list, ping, notificaciones, lotes y errores de JSON-RPC", async () => {
  const ctx: Ctx = { rest: falsaDb().rest, uid: "u1" };
  const ini: any = await responder({ jsonrpc: "2.0", id: 0, method: "initialize", params: { protocolVersion: "2025-06-18" } }, ctx);
  assert.equal(ini.result.protocolVersion, "2025-06-18");
  assert.ok(ini.result.capabilities.tools);
  const otra: any = await responder({ jsonrpc: "2.0", id: 0, method: "initialize", params: { protocolVersion: "1999-01-01" } }, ctx);
  assert.equal(otra.result.protocolVersion, "2025-11-25");
  assert.equal(await responder({ jsonrpc: "2.0", method: "notifications/initialized" }, ctx), null);
  assert.equal(await responderTodo([{ jsonrpc: "2.0", method: "notifications/initialized" }], ctx), null);

  const lista: any = await responder({ jsonrpc: "2.0", id: 2, method: "tools/list" }, ctx);
  const nombres = lista.result.tools.map((t: any) => t.name);
  assert.deepEqual(nombres, HERRAMIENTAS.map((h) => h.name));
  for (const t of lista.result.tools) {
    assert.equal(t.run, undefined);
    assert.equal(t.inputSchema.type, "object");
    assert.ok(t.description.length > 20, t.name);
    assert.match(t.name, /^[a-z_]{1,64}$/);
  }
  for (const n of ["ver_perfil", "ver_medidas", "ver_historial", "ver_favoritas", "ver_plan", "ver_catalogo",
    "guardar_plan", "guardar_dia", "guardar_favorita", "apuntar_medidas"]) assert.ok(nombres.includes(n), n);

  const lote: any = await responderTodo([{ jsonrpc: "2.0", id: "a", method: "ping" }, { jsonrpc: "2.0", id: "b", method: "nada" }], ctx);
  assert.deepEqual(lote[0], { jsonrpc: "2.0", id: "a", result: {} });
  assert.equal(lote[1].error.code, -32601);
  assert.equal(((await responder({ id: 3, method: "ping" } as any, ctx)) as any).error.code, -32600);
  const mala: any = await responder({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "borrar_todo" } }, ctx);
  assert.equal(mala.error.code, -32602);
});

test("un error de la herramienta vuelve como isError, y sin permiso pide volver a conectar", async () => {
  const rest: Rest = async () => { throw new ErrorDatos(401, "JWT expired"); };
  const r: any = await responder({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "ver_favoritas" } }, { rest, uid: "u1" });
  assert.equal(r.result.isError, true);
  assert.match(r.result.content[0].text, /vuelve a conectar/);
  const db = falsaDb({ exercise_catalog: CATALOGO_DB });
  await assert.rejects(llamar(db, "guardar_favorita", { nombre: "X", sesion: { ejercicios: [{ clave: "no", repeticiones: 3 }] } }), /no está en el catálogo/);
  assert.ok(!db.llamadas.some((l) => l.startsWith("POST")), "no escribe nada si la sesión no vale");
});

/* ---------------- Herramientas contra la base simulada ---------------- */

test("ver_perfil junta perfil, material, bandas, kilos y la última medida de cada tipo", async () => {
  const db = falsaDb({
    profiles: [{ display_name: "Ignasi", sex: "male", birth_year: 1985, height_cm: "178.0", goal: "fuerza", goal_kind: "strength" }],
    app_state: ESTADO,
    body_measurements: [
      { kind: "weight", value: "79.0", unit: "kg", measured_at: "2026-11-12T07:00:00Z" },
      { kind: "weight", value: "80.0", unit: "kg", measured_at: "2026-11-01T07:00:00Z" },
    ],
    connections: [{ provider: "strava", status: "connected" }],
  });
  const p = await llamar(db, "ver_perfil");
  assert.equal(p.hoy, "2026-11-14");
  assert.equal(p.dia_semana, "sábado");
  assert.equal(p.altura_cm, 178);
  assert.deepEqual(p.clave_material, { correas: false, mancuernas: true, gomas: true, banda: false });
  assert.deepEqual(p.bandas, ["Roja", "Negra"]);
  assert.deepEqual(p.kilos_por_ejercicio, { press_db: 8 });
  assert.deepEqual(p.ultimas_medidas.weight, { valor: 79, unidad: "kg", fecha: "2026-11-12" });
  assert.equal(p.nota, undefined);
  const vacio = await llamar(falsaDb(), "ver_perfil");
  assert.deepEqual(vacio.bandas, ["Banda 1", "Banda 2", "Banda 3", "Banda 4"]);
  assert.ok(vacio.nota);
});

test("ver_catalogo marca lo que puede hacer con su material, filtra y da la ficha completa", async () => {
  const db = falsaDb({ exercise_catalog: CATALOGO_DB, app_state: [{ data: { config: { gomas: true } } }] });
  const c = await llamar(db, "ver_catalogo");
  assert.equal(c.ejercicios.length, 5);
  assert.equal(c.ejercicios.find((x: any) => x.clave === "press_db")!.disponible, false);
  assert.equal(c.ejercicios.find((x: any) => x.clave === "fondos")!.disponible, true);
  assert.equal((await llamar(db, "ver_catalogo", { solo_disponibles: true })).ejercicios.length, 4);
  const uno = await llamar(db, "ver_catalogo", { clave: "press_db" });
  assert.deepEqual(uno.le_falta, ["mancuernas"]);
  assert.ok(uno.tecnica);
  await assert.rejects(llamar(db, "ver_catalogo", { clave: "nada" }), /No hay/);
});

test("guardar_dia crea la sesión de hoy en un plan de Claude de esta semana, y luego la cambia", async () => {
  const db = falsaDb({ exercise_catalog: CATALOGO_DB, app_state: ESTADO });
  const r = await llamar(db, "guardar_dia", {
    dia: "2026-11-14", titulo: "Pecho y core", tipo: "fuerza",
    sesion: { ejercicios: [{ clave: "press_db", repeticiones: 10, kg: 8 }, { clave: "plancha", segundos: 30 }], rondas: 3, descanso: 60 },
  });
  assert.equal(db.t.plans.length, 1);
  assert.deepEqual({ ...db.t.plans[0], id: 0, updated_at: 0 }, {
    id: 0, updated_at: 0, name: "Plan de Claude · semana del 2026-11-09", source: "claude", starts_on: "2026-11-09", ends_on: "2026-11-15", active: true, data: {},
  });
  const d = db.t.plan_days[0];
  assert.equal(d.plan_id, r.plan_id);
  assert.equal(d.status, "planned");
  assert.deepEqual(d.workout, { name: "Pecho y core", sel: [{ k: "press_db", n: 10, kg: 8 }, { k: "plancha", n: 30 }], rounds: 3, rest: 60, alt: true });
  assert.equal(r.avisos, undefined);

  // Otra el mismo día va al mismo plan
  await llamar(db, "guardar_dia", { dia: "2026-11-14", titulo: "Rutina de core", tipo: "core", posicion: 1 });
  assert.equal(db.t.plans.length, 1);
  assert.deepEqual(db.t.plan_days[1].workout, { rutina: true });

  // Cambiarla y marcarla hecha
  await llamar(db, "guardar_dia", { plan_day_id: r.plan_day_id, dia: "2026-11-14", titulo: "Solo plancha", sesion: { ejercicios: [{ clave: "plancha", segundos: 45 }] }, estado: "hecho" });
  assert.equal(db.t.plan_days[0].title, "Solo plancha");
  assert.equal(db.t.plan_days[0].status, "done");
  await assert.rejects(llamar(db, "guardar_dia", { plan_day_id: "otra", dia: "2026-11-14", titulo: "X" }), /no existe/);

  const v = await llamar(db, "ver_plan");
  assert.equal(v.desde, "2026-11-09");
  assert.equal(v.dias.length, 2);
  assert.equal(v.dias[0].dia_semana, "sábado");

  await llamar(db, "borrar_dia", { plan_day_id: r.plan_day_id });
  assert.equal(db.t.plan_days.length, 1);
});

test("guardar_plan crea la semana, apaga el plan de Claude anterior y al cambiarlo respeta los días hechos", async () => {
  const db = falsaDb({
    exercise_catalog: CATALOGO_DB, app_state: ESTADO,
    plans: [{ id: "viejo", source: "claude", active: true, starts_on: "2026-11-09", ends_on: "2026-11-15", name: "Viejo" },
      { id: "mio", source: "user", active: true, starts_on: "2026-11-09", ends_on: "2026-11-30", name: "Mío" }],
  });
  const semanaNueva = {
    nombre: "Semana fuerza", desde: "2026-11-16", hasta: "2026-11-22", objetivo: "strength", notas: "Subir kilos si sale fácil",
    dias: [
      { dia: "2026-11-16", tipo: "fuerza", titulo: "Cuerpo entero", sesion: { ejercicios: [{ clave: "flex", repeticiones: 10 }, { clave: "remo_goma", repeticiones: 12, banda: "Roja" }] } },
      { dia: "2026-11-17", tipo: "descanso", titulo: "Descanso" },
      { dia: "2026-11-18", tipo: "core", titulo: "Rutina de core" },
    ],
  };
  const r = await llamar(db, "guardar_plan", semanaNueva);
  assert.equal(r.dias, 3);
  assert.equal(db.t.plan_days.length, 3);
  assert.equal(db.t.plan_days[1].workout, null);
  assert.equal(db.t.plans.find((p) => p.id === "viejo")!.active, true, "no se solapa: sigue activo");
  assert.equal(db.t.plans.find((p) => p.id === "mio")!.active, true, "los planes de la persona no se tocan");

  // Uno que se solapa con el viejo lo apaga
  await llamar(db, "guardar_plan", { nombre: "Esta semana", desde: "2026-11-14", hasta: "2026-11-15", dias: [] });
  assert.equal(db.t.plans.find((p) => p.id === "viejo")!.active, false);
  assert.equal(db.t.plans.find((p) => p.id === "mio")!.active, true);

  // Cambiar el plan: el lunes ya está hecho y se queda
  db.t.plan_days[0].status = "done";
  await llamar(db, "guardar_plan", { ...semanaNueva, plan_id: r.plan_id, dias: [{ dia: "2026-11-19", titulo: "Carrera suave", tipo: "carrera" }] });
  const delPlan = db.t.plan_days.filter((d) => d.plan_id === r.plan_id);
  assert.deepEqual(delPlan.map((d) => [d.day, d.status]), [["2026-11-16", "done"], ["2026-11-19", "planned"]]);
  assert.equal(delPlan[1].kind, "run");

  await assert.rejects(llamar(db, "guardar_plan", { ...semanaNueva, dias: [{ dia: "2026-12-01", titulo: "Fuera" }] }), /fuera del plan/);
  await assert.rejects(llamar(db, "guardar_plan", { ...semanaNueva, desde: "2026-11-22", hasta: "2026-11-16" }), /hasta/);
  await assert.rejects(llamar(db, "guardar_plan", { ...semanaNueva, plan_id: "ajeno" }), /no es tuyo/);
});

test("si fallan los días, el plan nuevo no se queda a medias", async () => {
  const db = falsaDb({ exercise_catalog: CATALOGO_DB });
  const rest: Rest = async (m, ruta, c, h) => {
    if (m === "POST" && ruta.startsWith("/rest/v1/plan_days")) throw new ErrorDatos(400, "El plan no es tuyo");
    return db.rest(m, ruta, c, h);
  };
  const r: any = await responder({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "guardar_plan", arguments: { nombre: "P", desde: "2026-11-16", hasta: "2026-11-22", dias: [{ dia: "2026-11-16", titulo: "A" }] } } }, { rest, uid: "u1", ahora: AHORA });
  assert.equal(r.result.isError, true);
  assert.equal(db.t.plans.length, 0);
});

test("favoritas: crear, cambiar, renombrar sin perder el sitio, máximo 20 y borrar", async () => {
  const db = falsaDb({ exercise_catalog: CATALOGO_DB, app_state: ESTADO, favorites: [{ name: "Brazos", position: 0, data: { name: "Brazos" } }] });
  const s = { ejercicios: [{ clave: "flex", repeticiones: 10 }], rondas: 4, descanso: 90 };
  const r = await llamar(db, "guardar_favorita", { nombre: "Pecho rápido", sesion: s });
  assert.equal(r.nueva, true);
  const f = db.t.favorites.find((x) => x.name === "Pecho rápido")!;
  assert.equal(f.position, 1);
  assert.deepEqual(f.data, { name: "Pecho rápido", sel: [{ k: "flex", n: 10 }], rounds: 4, rest: 90, alt: true, zone: "", needs: "" });

  await llamar(db, "guardar_favorita", { nombre: "Pecho rápido", sesion: { ...s, rondas: 5 } });
  assert.equal(db.t.favorites.length, 2);
  assert.equal(db.t.favorites.find((x) => x.name === "Pecho rápido")!.data.rounds, 5);

  await llamar(db, "guardar_favorita", { nombre: "Pecho", nombre_anterior: "Pecho rápido", sesion: s });
  assert.deepEqual(db.t.favorites.map((x) => [x.name, x.position]).sort(), [["Brazos", 0], ["Pecho", 1]]);

  const v = await llamar(db, "ver_favoritas");
  assert.deepEqual(v.favoritas.map((x: any) => x.nombre), ["Brazos", "Pecho"]);

  for (let i = 0; i < 18; i++) db.t.favorites.push({ name: `F${i}`, position: i + 2, data: {} });
  await assert.rejects(llamar(db, "guardar_favorita", { nombre: "La 21", sesion: s }), /20/);
  await llamar(db, "guardar_favorita", { nombre: "F3", sesion: s });  // cambiar una que ya está sí deja

  await llamar(db, "borrar_favorita", { nombre: "Pecho" });
  assert.ok(!db.t.favorites.some((x) => x.name === "Pecho"));
  await assert.rejects(llamar(db, "borrar_favorita", { nombre: "Pecho" }), /No hay/);
});

test("apuntar_medidas, ver_medidas y borrar_medida", async () => {
  const db = falsaDb();
  const r = await llamar(db, "apuntar_medidas", { medidas: [{ tipo: "weight", valor: 78.4 }, { tipo: "waist", valor: 85, fecha: "2026-11-13", nota: "en ayunas" }] });
  assert.equal(r.apuntadas.length, 2);
  assert.ok(db.t.body_measurements.every((m) => m.source === "claude"));
  assert.equal((await llamar(db, "ver_medidas", { tipo: "waist" })).medidas.length, 1);
  await assert.rejects(llamar(db, "apuntar_medidas", { medidas: [{ tipo: "weight", valor: 78 }, { tipo: "weight", valor: -1 }] }), /no parece/);
  assert.equal(db.t.body_measurements.length, 2, "si una no vale, no se apunta ninguna");
  await llamar(db, "borrar_medida", { id: r.apuntadas[0].id });
  assert.equal(db.t.body_measurements.length, 1);
});

test("ver_historial pide las sesiones con sus series, en orden y con filtros", async () => {
  const db = falsaDb({
    workout_sessions: [{
      id: "s1", kind: "rutina", src: "widget", title: null, ab_day: "A", rounds: 3, complete: true,
      started_at: "2026-11-13T07:00:00Z", ended_at: "2026-11-13T07:20:00Z", tz_offset_min: 60, extra: {},
      workout_sets: [{ idx: 0, exercise_key: "plancha", exercise_name: "Plancha", round: 1, secs: 30, plan_secs: 30, reps: 0, plan_reps: 0, skipped: false }],
    }],
  });
  const h = await llamar(db, "ver_historial", { desde: "2026-11-01", hasta: "2026-11-13" });
  assert.equal(h.sesiones.length, 1);
  assert.equal(h.sesiones[0].dia_ab, "A");
  assert.ok(db.llamadas.at(-1)!.includes("started_at=lt.2026-11-14"));
  assert.ok(db.llamadas.at(-1)!.includes("select=*,workout_sets(*)"));
  await assert.rejects(llamar(db, "ver_historial", { desde: "13/11/2026" }), /AAAA-MM-DD/);
});

/* ---------------- Acceso y metadatos ---------------- */

test("crearRest manda la clave pública y el token de la persona, y convierte los errores", async () => {
  let visto: any = null;
  const f = (async (url: string, init: any) => {
    visto = { url, ...init };
    return url.includes("mal") ? new Response(JSON.stringify({ message: "new row violates row-level security policy" }), { status: 403 })
      : new Response(JSON.stringify([{ a: 1 }]), { status: 200 });
  }) as unknown as typeof fetch;
  const rest = crearRest("https://p.supabase.co", "sb_publishable_x", "tok", f);
  assert.deepEqual(await rest("GET", "/rest/v1/favorites"), [{ a: 1 }]);
  assert.equal(visto.url, "https://p.supabase.co/rest/v1/favorites");
  assert.equal(visto.headers.apikey, "sb_publishable_x");
  assert.equal(visto.headers.Authorization, "Bearer tok");
  await assert.rejects(rest("POST", "/rest/v1/mal", {}), (e: any) => e instanceof ErrorDatos && e.status === 403 && /row-level/.test(e.message));
});

test("los metadatos dicen que el inicio de sesión es Supabase Auth del proyecto", () => {
  const m = metadatosRecurso("https://jlyqtxihsorqczlxvbly.supabase.co");
  assert.equal(m.resource, "https://jlyqtxihsorqczlxvbly.supabase.co/functions/v1/claude");
  assert.deepEqual(m.authorization_servers, ["https://jlyqtxihsorqczlxvbly.supabase.co/auth/v1"]);
});
