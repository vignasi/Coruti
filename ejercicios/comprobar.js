// Comprobaciones del paso 1 (docs/diseno/4-ejercicios.md): node ejercicios/comprobar.js
// Falla (código 1) si alguna ficha no cumple. Los pasos 2 y 3 añadirán sus comprobaciones aquí.
const fs = require('fs'), path = require('path');
const F = JSON.parse(fs.readFileSync(path.join(__dirname, 'fichas.json'), 'utf8'));
const D = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/src/main/assets/rutina.json'), 'utf8'));
const V = {
  patron: ['puente_cadera', 'bisagra_cadera', 'abduccion_cadera', 'desplazamiento_lateral', 'empuje_horizontal', 'tiron_horizontal', 'flexion_codo', 'extension_codo', 'anti_extension', 'anti_flexion_lateral', 'flexion_tronco', 'movilidad_columna', 'movilidad_hombro', 'estiramiento_cadera'],
  musculo: ['gluteo_mayor', 'gluteo_medio', 'isquios', 'cuadriceps', 'psoas', 'recto_abdominal', 'transverso', 'oblicuos', 'erectores', 'dorsal', 'escapulares', 'deltoides_anterior', 'deltoides_posterior', 'pectoral', 'triceps', 'biceps', 'antebrazo', 'serrato', 'manguito_rotador'],
  posicion: ['boca_arriba', 'boca_abajo', 'de_lado', 'cuadrupedia', 'rodilla_en_suelo', 'sentado_suelo', 'apoyado_silla', 'de_pie', 'de_pie_inclinado', 'de_pie_pared'],
  tipo: ['reps', 'isometrico'], lados: ['bilateral', 'por_lado', 'alterno'],
  material: ['gomas', 'banda', 'mancuernas', 'silla', 'sofa', 'pared', 'toalla'],
  usos: ['core', 'fuerza', 'movilidad', 'calentar', 'recuperar'], carga: ['lumbar', 'rodilla', 'hombro', 'muneca', 'cuello'],
};
const fallos = [];
const mal = (k, t) => fallos.push(`${k}: ${t}`);
for (const [k, f] of Object.entries(F)) {
  const ex = D.exercises[k], c = (D.catalog.ex || {})[k] || {};
  if (!ex) { mal(k, 'no está en rutina.json'); continue; }
  for (const campo of ['nombre', 'zona', 'para_que', 'patron', 'musculos', 'posicion', 'tipo', 'lados', 'material', 'nivel', 'sustitutos', 'carga', 'usos', 'dosis'])
    if (f[campo] == null || f[campo] === '') mal(k, `falta ${campo}`);
  if (f.nombre !== ex.name) mal(k, `nombre «${f.nombre}» ≠ «${ex.name}»`);
  if (f.zona !== c.zone) mal(k, `zona ${f.zona} ≠ ${c.zone}`);
  if (!V.patron.includes(f.patron)) mal(k, `patrón desconocido ${f.patron}`);
  if (!V.posicion.includes(f.posicion)) mal(k, `posición desconocida ${f.posicion}`);
  if (!V.tipo.includes(f.tipo)) mal(k, `tipo ${f.tipo}`);
  if (!V.lados.includes(f.lados)) mal(k, `lados ${f.lados}`);
  const m = f.musculos || {};
  if (!(m.principales || []).length) mal(k, 'sin músculos principales');
  [...(m.principales || []), ...(m.secundarios || [])].forEach(x => { if (!V.musculo.includes(x)) mal(k, `músculo desconocido ${x}`); });
  if ((m.principales || []).some(x => (m.secundarios || []).includes(x))) mal(k, 'un músculo es principal y secundario');
  (f.material || []).forEach(x => { if (!V.material.includes(x)) mal(k, `material desconocido ${x}`); });
  (f.usos || []).forEach(x => { if (!V.usos.includes(x)) mal(k, `uso desconocido ${x}`); });
  if (!(f.usos || []).length) mal(k, 'sin usos');
  if (![1, 2, 3].includes(f.nivel)) mal(k, `nivel ${f.nivel}`);
  for (const z of V.carga) if (![0, 1, 2].includes((f.carga || {})[z])) mal(k, `carga de ${z} sin poner o fuera de 0–2`);
  // relaciones
  for (const r of ['regresion', 'progresion']) if (f[r] != null && (!F[f[r]] || f[r] === k)) mal(k, `${r} apunta a ${f[r]}, que no existe o es él mismo`);
  (f.sustitutos || []).forEach(x => { if (!F[x] || x === k) mal(k, `sustituto ${x} no existe o es él mismo`); });
  if (f.progresion && F[f.progresion] && F[f.progresion].regresion !== k) mal(k, `progresión ${f.progresion}, pero su regresión no es ${k}`);
  if (f.regresion && F[f.regresion] && F[f.regresion].progresion !== k) mal(k, `regresión ${f.regresion}, pero su progresión no es ${k}`);
  if (f.progresion && F[f.progresion] && F[f.progresion].nivel < f.nivel) mal(k, `la progresión ${f.progresion} es de nivel más bajo`);
  // contra rutina.json (lo que ya usa la app)
  if ((f.tipo === 'isometrico') !== !!ex.hold) mal(k, `tipo ${f.tipo} pero en rutina.json hold=${!!ex.hold}`);
  if ((f.lados === 'por_lado') !== !!c.sides) mal(k, `lados ${f.lados} pero el catálogo ${c.sides ? 'va por lados' : 'no va por lados'}`);
  if (c.needs && !(f.material || []).includes(c.needs)) mal(k, `el catálogo pide ${c.needs} y no está en material`);
  ['gomas', 'banda', 'mancuernas'].forEach(x => { if ((f.material || []).includes(x) && c.needs !== x) mal(k, `material ${x} pero el catálogo pide ${c.needs || 'nada'}`); });
  const d = f.dosis || {};
  const base = f.tipo === 'reps' ? d.reps : d.secs, cat = f.tipo === 'reps' ? c.reps : c.secs;
  if (base !== cat) mal(k, `dosis base ${base} ≠ catálogo ${cat}`);
  if (!Array.isArray(d.rango) || d.rango[0] > base || d.rango[1] < base) mal(k, `la dosis base ${base} no está dentro del rango ${d.rango}`);
  if (f.tipo === 'reps' && d.tempo_s !== ex.rep) mal(k, `tempo ${d.tempo_s} ≠ rutina.json ${ex.rep}`);
  if (JSON.stringify(d.kg || null) !== JSON.stringify(c.kg || null)) mal(k, `kilos ${d.kg} ≠ catálogo ${c.kg}`);
}
for (const k of Object.keys(D.exercises)) if (!F[k]) mal(k, 'no tiene ficha');
const n = Object.keys(F).length, ap = Object.values(F).reduce((a, f) => a + (f.apuntes || []).length, 0);
if (fallos.length) { console.log(`Paso 1: ${fallos.length} fallos\n- ` + fallos.join('\n- ')); process.exit(1); }
console.log(`Paso 1: ${n} fichas correctas. Apuntes para los pasos 2 y 3: ${ap}.`);
