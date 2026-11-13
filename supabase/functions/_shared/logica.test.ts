// Pruebas de la lógica de S1. Se ejecutan con:  node --experimental-strip-types --test supabase/functions/_shared/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EJERCICIO_STRAVA, EJERCICIO_POR_DEFECTO, esResistencia, duracionIso, horasPolar, pulsoPolar, emparejar,
  jsonFuerza, descripcion, duplicadoDe, siguienteIntento, type PolarExercise, type Sesion,
} from "./logica.ts";

const aqui = new URL(".", import.meta.url);
const VOCABULARIO = new Set(readFileSync(new URL("strava_ejercicios.txt", aqui), "utf8").split("\n").filter(Boolean));
const CATALOGO = JSON.parse(readFileSync(new URL("../../../app/src/main/assets/rutina.json", aqui), "utf8"));

test("cada ejercicio del catálogo tiene su ejercicio de Strava, y existe en la lista de Strava", () => {
  for (const k of Object.keys(CATALOGO.exercises)) assert.ok(EJERCICIO_STRAVA[k], `falta ${k} en EJERCICIO_STRAVA`);
  for (const [k, v] of Object.entries(EJERCICIO_STRAVA)) assert.ok(VOCABULARIO.has(v), `${k} → ${v} no está en la lista de Strava`);
  assert.ok(VOCABULARIO.has(EJERCICIO_POR_DEFECTO));
});

test("carreras, trail y caminatas las sigue subiendo Polar; los entrenos, el servidor", () => {
  for (const [s, d] of [["RUNNING", "RUNNING_ROAD"], ["OTHER", "TRAIL_RUNNING"], ["OTHER", "WALKING"], ["OTHER", "HIKING"],
                        ["CYCLING", "ROAD_BIKING"], ["OTHER", "TREADMILL_RUNNING"]]) assert.equal(esResistencia(s, d), true, d);
  for (const [s, d] of [["OTHER", "STRENGTH_TRAINING"], ["OTHER", "CIRCUIT_TRAINING"], ["OTHER", "CORE"],
                        ["OTHER", "FUNCTIONAL_TRAINING"], ["OTHER", "MOBILITY_DYNAMIC"], [null, null]]) assert.equal(esResistencia(s, d), false, String(d));
});

test("duración ISO", () => {
  assert.equal(duracionIso("PT2H44M"), 9840);
  assert.equal(duracionIso("PT27M30.5S"), 1650.5);
  assert.equal(duracionIso("P1DT1S"), 86401);
  assert.equal(duracionIso("raro"), 0);
});

const polar: PolarExercise = {
  id: "aQlC83", start_time: "2026-11-09T21:29:35", start_time_utc_offset: 60, duration: "PT27M30S",
  sport: "OTHER", detailed_sport_info: "STRENGTH_TRAINING", calories: 142,
  samples: [{ "recording-rate": 5, "sample-type": "0", data: "0,90,95,null,100" }, { "recording-rate": 1, "sample-type": "1", data: "0,0" }],
};
const t0 = Date.parse("2026-11-09T20:29:35Z");  // 21:29:35 en Barcelona (UTC+1)

test("horas y pulso de Polar", () => {
  const h = horasPolar(polar);
  assert.equal(h.start, t0);
  assert.equal(h.end, t0 + 1650000);
  assert.deepEqual(pulsoPolar(polar), { rate: 5, bpm: [null, 90, 95, null, 100] });
  assert.equal(pulsoPolar({ ...polar, samples: [] }), null);
});

test("emparejar: la sesión de la app que cae dentro de la del reloj", () => {
  const p = { start: t0, end: t0 + 1650000 };
  const dentro = { id: "a", start: t0 + 120000, end: t0 + 1500000 };
  const otraHora = { id: "b", start: t0 + 7200000, end: t0 + 8000000 };
  const pocoSolape = { id: "c", start: t0 + 1500000, end: t0 + 5000000 };
  assert.equal(emparejar(p, [otraHora, dentro, pocoSolape])?.id, "a");
  assert.equal(emparejar(p, [otraHora, pocoSolape]), null);
  // Empezó en la app 5 minutos antes que el reloj: también vale
  assert.equal(emparejar(p, [{ id: "d", start: t0 - 300000, end: t0 + 1400000 }])?.id, "d");
});

const sesion: Sesion = {
  id: "s1", title: "Rutina de core · día A", type: "rutina", tz: 60, complete: true, rpe: 7, feel: "bien",
  start: t0 + 60000, end: t0 + 1600000,
  sets: [
    { k: "puente_banda", start: t0 + 70000, end: t0 + 110000, reps: 12, band: "Roja" },
    { k: "plancha", start: t0 + 130000, end: t0 + 160000, reps: 0, secs: 30 },
    { k: "remo_db", start: t0 + 200000, end: t0 + 240000, reps: 10, kg: 12.5 },
    { k: "nuevo_de_claude", start: t0 + 300000, end: t0 + 330000, reps: 8 },
    { k: "flex", start: t0 + 400000, end: t0 + 400500, reps: 0, secs: 0, skipped: true },
  ],
};

test("JSON de fuerza con pulso del reloj", () => {
  const j = jsonFuerza(sesion, polar) as any;
  assert.equal(j.version, "1.0");
  assert.equal(j.start_time, "2026-11-09T20:29:35Z");  // empieza con el reloj, que arrancó antes
  assert.equal(j.utc_offset, 3600);
  assert.equal(j.elapsed_time, 1650);
  assert.equal(j.total_calories, 142);
  assert.equal(j.sets.length, 4);  // la serie sin nada hecho no se sube
  assert.deepEqual(j.sets[0], { exercise_type: "GLUTE_BRIDGE", repetitions: 12, start_time: "2026-11-09T20:30:45Z" });
  assert.deepEqual(j.sets[1], { exercise_type: "PLANK_GENERIC", duration: 30, start_time: "2026-11-09T20:31:45Z" });
  assert.equal(j.sets[2].weight, 12.5);
  assert.equal(j.sets[3].exercise_type, EJERCICIO_POR_DEFECTO);
  assert.deepEqual(j.streams.time, [5, 10, 20]);
  assert.deepEqual(j.streams.heartrate, [90, 95, 100]);
  assert.equal(j.streams.time.length, j.streams.active.length);
  for (const s of j.sets) assert.ok(VOCABULARIO.has(s.exercise_type));
});

test("JSON de fuerza sin reloj: sin pulso ni calorías", () => {
  const j = jsonFuerza(sesion, null) as any;
  assert.equal(j.start_time, "2026-11-09T20:30:35Z");
  assert.equal(j.elapsed_time, 1540);
  assert.equal(j.streams, undefined);
  assert.equal(j.total_calories, undefined);
  assert.equal(j.active_time, 40 + 30 + 40 + 30);  // la serie saltada sin nada hecho no cuenta
});

test("descripción", () => {
  assert.equal(descripcion(sesion), "Esfuerzo 7/10 · Me he sentido bien\nBandas: Roja\nCon Rutina core");
  assert.equal(descripcion({ ...sesion, rpe: null, feel: null, complete: false, sets: [] }), "Sesión incompleta\nCon Rutina core");
});

test("duplicados y reintentos", () => {
  assert.equal(duplicadoDe("Test_Walk.gpx duplicate of activity 21234316"), 21234316);
  assert.equal(duplicadoDe("x.fit duplicate of <a href='/activities/42' target='_blank'>42</a>"), 42);
  assert.equal(duplicadoDe("There was an error"), null);
  assert.equal(siguienteIntento(1, 0), 3600000);
  assert.equal(siguienteIntento(3, 0), 4 * 3600000);
  assert.equal(siguienteIntento(5, 0), null);
});
