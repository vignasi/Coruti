// Reglas del paso 3 (docs/diseno/4-ejercicios.md) sobre las medidas de ejercicios/comprobar3d.html.
// comprobar(tecnica, muestras) → lista de fallos (texto). Sin navegador: se prueba con node --test ejercicios/reglas3d.test.js
'use strict';

const TOCA = 2;          // cm: un apoyo toca su superficie si está a menos de esto
const ROZA = 1;          // cm: una parte que no es apoyo y está a menos de esto, toca (y no debería)
const METE = 1.5;        // cm: lo que se mete en el suelo o en un mueble más de esto, lo atraviesa
const METE_BLANDO = 3;  // cm: lo mismo en las partes blandas que se aplastan al apoyarse (culo, muslo, barriga, pecho)
const BLANDAS = /^(cadera|muslo|barriga|pecho|espalda_baja)/;
const RANGO = {rodilla: [-5, 150], codo: [-5, 155], cadera: [-35, 150], hombro: [0, 185]};
const LADOS = ['_izq', '_der'];

/* Cada apoyo: qué regiones del cuerpo cuentan (por lado), si hacen falta los dos lados y qué más puede rozar sin fallar */
const APOYO = {
  cabeza: {r: ['cabeza'], roza: ['cuello']},
  espalda_alta: {r: ['espalda_alta'], roza: ['cuello', 'brazo', 'codo']},
  espalda_baja: {r: ['espalda_baja']},
  cadera: {r: ['cadera']},
  lado_cuerpo: {r: ['espalda_alta', 'pecho', 'espalda_baja', 'barriga', 'cadera', 'muslo@abajo'], roza: ['brazo@abajo', 'codo@abajo']},
  brazo_abajo: {r: ['brazo@abajo', 'codo@abajo', 'antebrazo@abajo', 'mano@abajo']},
  pierna_abajo: {r: ['muslo@abajo', 'rodilla@abajo', 'espinilla@abajo', 'pie@abajo', 'talon@abajo', 'punta@abajo']},
  brazos: {r: ['brazo', 'codo', 'antebrazo', 'mano'], dos: true},
  antebrazos: {r: ['antebrazo', 'codo'], dos: true, roza: ['mano', 'brazo']},
  antebrazo: {r: ['antebrazo', 'codo'], roza: ['mano', 'brazo']},
  codos: {r: ['codo'], dos: true, roza: ['brazo', 'antebrazo']},
  manos: {r: ['mano'], dos: true},
  mano: {r: ['mano']},
  rodillas: {r: ['rodilla'], dos: true, roza: ['espinilla']},
  rodilla: {r: ['rodilla'], roza: ['espinilla']},
  espinillas: {r: ['espinilla'], dos: true, roza: ['rodilla', 'pie', 'punta']},
  pies: {r: ['pie', 'talon', 'punta'], dos: true},
  pie: {r: ['pie', 'talon', 'punta']},
  puntas_pies: {r: ['punta'], dos: true, roza: ['pie']},
  talones: {r: ['talon'], dos: true, roza: ['pie']},
};
const MUEBLES = ['suelo', 'silla', 'sofa', 'pared'];

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = a => Math.hypot(...a), nrm = a => { const l = len(a) || 1e-9; return a.map(x => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(nrm(a), nrm(b))))) * 180 / Math.PI;
const mid = (a, b) => a.map((x, i) => (x + b[i]) / 2);

/* Lado de abajo (tumbado de lado): el del hombro más bajo */
const abajo = m => m.J.hombro_izq[1] < m.J.hombro_der[1] ? '_izq' : '_der';
/* Regiones de un apoyo, con lado: devuelve grupos (cada grupo tiene que tocar) */
function grupos(nombre, m) {
  const a = APOYO[nombre]; if (!a) return null;
  const ab = abajo(m), exp = r => r.endsWith('@abajo') ? [r.replace('@abajo', ab)] : ['cabeza', 'cuello', 'espalda_alta', 'pecho', 'espalda_baja', 'barriga', 'cadera'].includes(r) ? [r] : LADOS.map(l => r + l);
  if (a.dos) return LADOS.map(l => a.r.map(r => ['cabeza', 'espalda_alta', 'pecho', 'espalda_baja', 'barriga', 'cadera'].includes(r) ? r : r + l));
  return [a.r.flatMap(exp)];
}
function permitidas(nombre, m) {
  const a = APOYO[nombre], ab = abajo(m), out = new Set();
  (grupos(nombre, m) || []).flat().forEach(r => out.add(r));
  (a.roza || []).forEach(r => r === 'cuello' ? out.add(r) : (a.r.some(x => x.endsWith('@abajo')) ? [ab] : LADOS).forEach(l => out.add(r.replace('@abajo', '') + l)));
  return out;
}
/* Distancia de una región a una superficie (suelo o el mueble de ese tipo más cercano) */
function dSup(m, reg, sup) {
  const o = m.reg[reg]; if (!o) return Infinity;
  if (sup === 'suelo') return o.suelo;
  let d = Infinity; m.cajas.forEach((t, j) => { if (t === sup) d = Math.min(d, o.cajas[j]); }); return d;
}

/* Ángulos (grados) a partir de las articulaciones */
function angulo(m, art, lado) {
  const J = m.J, l = lado;
  const tronco = sub(mid(J.cadera_izq, J.cadera_der), J.pecho);          // hacia abajo por el tronco
  if (art === 'rodilla') {
    const muslo = sub(J['rodilla' + l], J['cadera' + l]), tibia = sub(J['tobillo' + l], J['rodilla' + l]);
    const a = ang(muslo, tibia), lat = nrm(sub(J.cadera_der, J.cadera_izq));
    // hacia dónde dobla: la tibia va hacia atrás del muslo; si va hacia delante, es una rodilla al revés
    const s = dot(cross(muslo, tibia), lat);
    return s > 0 && a > 5 ? -a : a;
  }
  if (art === 'codo') return ang(sub(J['codo' + l], J['hombro' + l]), sub(J['muneca' + l], J['codo' + l]));
  if (art === 'cadera') {
    const muslo = sub(J['rodilla' + l], J['cadera' + l]), a = ang(tronco, muslo);
    return dot(muslo, m.fwd) < 0 && a > 5 ? -a : a;                     // pierna por detrás del tronco: extensión
  }
  if (art === 'hombro') return ang(tronco, sub(J['codo' + l], J['hombro' + l]));
  throw new Error('articulación desconocida ' + art);
}
const punto = (m, n) => {
  if (m.J[n]) return m.J[n];
  if (m.J[n + '_izq']) return mid(m.J[n + '_izq'], m.J[n + '_der']);
  throw new Error('punto desconocido ' + n);
};

function aplica(c, mu) {
  if (c.fase == null) return true;
  const f = [].concat(c.fase);
  return f.includes(mu.fase) && mu.momento === 'fin';
}

function comprobar(tec, muestras) {
  const fallos = [], mal = (mu, t) => fallos.push(`fase ${mu.fase + 1}${mu.momento === 'mitad' ? ' (a mitad)' : ''}: ${t}`);
  const nf = tec.fases.length;
  for (const mu of muestras) {
    // apoyos que tocan: en la fase; a mitad del movimiento, los que están antes y después
    const ahora = tec.fases[mu.fase].apoyos || [], antes = tec.fases[(mu.fase - 1 + nf) % nf].apoyos || [];
    const pide = mu.momento === 'fin' ? ahora : ahora.filter(a => antes.includes(a));
    const deja = mu.momento === 'fin' ? ahora : [...new Set([...ahora, ...antes])];
    if (!ahora.length) mal(mu, 'sin apoyos: el cuerpo flota');
    const perm = {}; MUEBLES.forEach(s => perm[s] = new Set());
    for (const a of deja) {
      const [parte, sobre = 'suelo'] = a.split('@');
      if (!APOYO[parte]) { mal(mu, `apoyo desconocido ${parte}`); continue; }
      if (MUEBLES.includes(sobre)) permitidas(parte, mu).forEach(r => perm[sobre].add(r));
    }
    for (const a of pide) {
      const [parte, sobre = 'suelo'] = a.split('@');
      if (!APOYO[parte]) continue;
      for (const gr of grupos(parte, mu)) {
        let d;
        if (MUEBLES.includes(sobre)) d = Math.min(...gr.map(r => dSup(mu, r, sobre)));
        else {   // sobre otra parte del cuerpo (cabeza@brazo_abajo)
          const ab = abajo(mu), otra = sobre.replace(/_abajo$/, ab).replace(/s(?=_|$)/, '');
          const ks = Object.keys(mu.dist).filter(k => { const [x, y] = k.split('|'); return y === otra && (parte === 'cabeza' ? x === 'cabeza' : true); });
          d = ks.length ? Math.min(...ks.map(k => mu.dist[k] ?? Infinity)) : Infinity;
        }
        if (!(d <= TOCA)) mal(mu, `${parte} no toca ${sobre} (a ${isFinite(d) ? d.toFixed(1) + ' cm' : '—'})`);
      }
    }
    // nada más toca, y nada atraviesa
    for (const r in mu.reg) {
      const o = mu.reg[r];
      const mete = BLANDAS.test(r) ? METE_BLANDO : METE;
      if (o.suelo < -mete) mal(mu, `${r} atraviesa el suelo (${o.suelo} cm)`);
      else if (o.suelo <= ROZA && !perm.suelo.has(r)) mal(mu, `${r} toca el suelo y no es un apoyo (${o.suelo} cm)`);
      o.cajas.forEach((d, j) => { const t = mu.cajas[j];
        if (d < -mete) mal(mu, `${r} atraviesa ${t} (${d} cm)`);
        else if (d <= ROZA && !perm[t].has(r)) mal(mu, `${r} toca ${t} y no es un apoyo (${d} cm)`); });
    }
    // rangos de las articulaciones
    for (const art in RANGO) for (const l of LADOS) {
      const a = angulo(mu, art, l), [lo, hi] = RANGO[art];
      if (a < lo || a > hi) mal(mu, `${art}${l} fuera de rango: ${a.toFixed(0)}° (normal ${lo}–${hi}°)`);
    }
    // condiciones
    for (const c of tec.condiciones || []) {
      if (!aplica(c, mu)) continue;
      if (c.juntos || c.separados) {
        const tipo = c.juntos ? 'juntos' : 'separados', v = c[tipo], [a, b] = Array.isArray(v) ? v : v.partes;
        const d = mu.dist[a + '|' + b];
        const lim = Array.isArray(v) ? (tipo === 'juntos' ? 3 : 10) : v.cm;
        if (d == null) mal(mu, `${tipo}: no se ha medido ${a}–${b}`);
        else if (tipo === 'juntos' ? d > lim : d < lim) mal(mu, `${a} y ${b} ${tipo === 'juntos' ? 'separados' : 'demasiado juntos'}: ${d} cm (${tipo === 'juntos' ? 'máx.' : 'mín.'} ${lim})`);
      }
      if (c.angulo) {
        const {articulacion, entre, lado} = c.angulo;
        const ls = lado === 'izq' || lado === 'der' ? ['_' + lado] : LADOS, as = ls.map(l => angulo(mu, articulacion, l)), ok = a => a >= entre[0] && a <= entre[1];
        if (lado === 'alguno' ? !as.some(ok) : !as.every(ok))
          mal(mu, `${articulacion}${lado === 'alguno' ? ' (ninguno de los dos)' : ls.length < 2 ? ls[0] : as.every(ok) ? '' : as.findIndex(a => !ok(a)) ? '_der' : '_izq'} a ${as.map(a => a.toFixed(0) + '°').join(' / ')} (pide ${entre[0]}–${entre[1]}°)`);
      }
      if (c.inclinacion) {
        // grados respecto a la vertical: 0 de pie, 90 tumbado o horizontal
        const {parte, entre} = c.inclinacion, J = mu.J;
        const v = parte === 'tronco' ? sub(J.cuello, mid(J.cadera_izq, J.cadera_der)) : null;
        if (!v) throw new Error('inclinación de ' + parte);
        const a = ang(v, [0, 1, 0]);
        if (a < entre[0] || a > entre[1]) mal(mu, `${parte} inclinado ${a.toFixed(0)}° (pide ${entre[0]}–${entre[1]}°)`);
      }
      if (c.recto) {
        const pts = Array.isArray(c.recto) ? c.recto : c.recto.puntos, tol = c.recto.tol || 10;
        const [a, b, d] = pts.map(n => punto(mu, n)), x = 180 - ang(sub(a, b), sub(d, b));
        if (x > tol) mal(mu, `${pts.join('–')} no está recto: ${x.toFixed(0)}° (máx. ${tol}°)`);
      }
      if (c.altura) {
        const {parte, sobre = 'suelo', entre} = c.altura;
        let h;
        if (mu.reg[parte] || mu.reg[parte + '_izq']) h = Math.min(...[parte, parte + '_izq', parte + '_der'].filter(r => mu.reg[r]).map(r => dSup(mu, r, sobre)));
        else h = punto(mu, parte)[1];
        if (h < entre[0] || h > entre[1]) mal(mu, `${parte} a ${h.toFixed(1)} cm de ${sobre} (pide ${entre[0]}–${entre[1]})`);
      }
    }
  }
  // quieto: la articulación no se mueve más de 5 cm en todo el ejercicio
  for (const c of tec.condiciones || []) if (c.quieto) {
    const n = typeof c.quieto === 'string' ? c.quieto : c.quieto.parte, cm = c.quieto.cm || 5;
    for (const l of LADOS) {
      const P = muestras.map(mu => mu.J[n + l] || mu.J[n]);
      let max = 0; P.forEach(a => P.forEach(b => { max = Math.max(max, len(sub(a, b))); }));
      if (max > cm) fallos.push(`${n}${l} se mueve ${max.toFixed(1)} cm (máx. ${cm})`);
    }
  }
  return [...new Set(fallos)];
}

module.exports = {comprobar, angulo, APOYO, RANGO, TOCA, ROZA, METE};
