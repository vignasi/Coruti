// Pruebas de las reglas del paso 3 sin navegador: node --test ejercicios/reglas3d.test.js
'use strict';
const test = require('node:test'), assert = require('node:assert');
const {comprobar, angulo} = require('./reglas3d');

// muestra mínima: de pie, recto, mirando a +z (medidas en cm, como las da comprobar3d.html)
function dePie(extra = {}) {
  const J = {cabeza: [0, 165, 0], cuello: [0, 150, 0], pecho: [0, 135, 0], espalda: [0, 120, 0], pelvis: [0, 100, 0],
    hombro_izq: [18, 140, 0], hombro_der: [-18, 140, 0], codo_izq: [20, 112, 0], codo_der: [-20, 112, 0],
    muneca_izq: [21, 85, 0], muneca_der: [-21, 85, 0], cadera_izq: [9, 95, 0], cadera_der: [-9, 95, 0],
    rodilla_izq: [9, 52, 0], rodilla_der: [-9, 52, 0], tobillo_izq: [9, 9, 0], tobillo_der: [-9, 9, 0],
    punta_izq: [9, 2, 12], punta_der: [-9, 2, 12]};
  const reg = {cabeza: {suelo: 150, cajas: []}, pie_izq: {suelo: 0.2, cajas: []}, pie_der: {suelo: 0.1, cajas: []},
    talon_izq: {suelo: 0.5, cajas: []}, talon_der: {suelo: 0.5, cajas: []}, muslo_izq: {suelo: 60, cajas: []}};
  return {fase: 0, momento: 'fin', reg, J, fwd: [0, 0, 1], cajas: [], dist: {}, ...extra};
}
const tec = (apoyos, condiciones = []) => ({fases: [{apoyos}], condiciones});

test('de pie con los pies apoyados: sin fallos', () => {
  assert.deepStrictEqual(comprobar(tec(['pies']), [dePie()]), []);
});
test('un apoyo que no toca falla', () => {
  const m = dePie(); m.reg.pie_der.suelo = 5; m.reg.talon_der.suelo = 5;
  assert.match(comprobar(tec(['pies']), [m]).join(), /pies no toca suelo/);
});
test('sin apoyos, flota', () => {
  assert.match(comprobar(tec([]), [dePie()]).join(), /flota/);
});
test('una parte que no es apoyo y toca el suelo falla; si se mete, atraviesa', () => {
  const m = dePie(); m.reg.cabeza.suelo = 0.5;
  assert.match(comprobar(tec(['pies']), [m]).join(), /cabeza toca el suelo/);
  m.reg.cabeza.suelo = -4;
  assert.match(comprobar(tec(['pies']), [m]).join(), /cabeza atraviesa el suelo/);
});
test('ángulos: rodilla recta 0°, codo doblado, condición fuera de rango', () => {
  const m = dePie();
  assert.ok(Math.abs(angulo(m, 'rodilla', '_izq')) < 2);
  m.J.muneca_izq = [20, 112, 28];   // antebrazo hacia delante: codo a 90°
  assert.ok(Math.abs(angulo(m, 'codo', '_izq') - 90) < 2);
  assert.match(comprobar(tec(['pies'], [{angulo: {articulacion: 'codo', lado: 'izq', entre: [0, 30]}}]), [m]).join(), /codo_izq a 90°/);
});
test('rodilla doblada al revés sale negativa (fuera de rango)', () => {
  const m = dePie(); m.J.tobillo_izq = [9, 15, 25];   // la tibia va hacia delante
  assert.ok(angulo(m, 'rodilla', '_izq') < 0);
});
test('juntos y quieto', () => {
  const m = dePie({dist: {'pie_izq|pie_der': 8}});
  assert.match(comprobar(tec(['pies'], [{juntos: ['pie_izq', 'pie_der']}]), [m]).join(), /separados: 8 cm/);
  const b = dePie(); b.J.codo_izq = [20, 112, 9];
  assert.match(comprobar(tec(['pies'], [{quieto: 'codo'}]), [dePie(), b]).join(), /codo_izq se mueve 9.0 cm/);
});
