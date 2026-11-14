// Comprobaciones del paso 1 (ficha) (docs/diseno/4-ejercicios.md): node ejercicios/comprobar.js
// y del paso 2 (técnica). Falla (código 1) si algo no cumple. El paso 3 (figura 3D) es ejercicios/comprobar3d.js.
const fs = require('fs'), path = require('path');
const F = JSON.parse(fs.readFileSync(path.join(__dirname, 'fichas.json'), 'utf8'));
// rutina.json y los borradores (ejercicios/datos.js): los borradores se comprueban igual aunque no salgan en la app
const {D} = require('./datos').cargar();
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

// ---------- Paso 2 · técnica (ejercicios/tecnicas.json) ----------
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'tecnicas.json'), 'utf8'));
const {APOYO} = require('./reglas3d');
const SUP = ['suelo', 'silla', 'sofa', 'pared'], CUERPO = ['brazo_abajo', 'cabeza'];
const ART = ['rodilla', 'codo', 'cadera', 'hombro'], PUNTOS = ['cabeza', 'cuello', 'pecho', 'espalda', 'pelvis', 'hombro', 'codo', 'muneca', 'cadera', 'rodilla', 'tobillo', 'punta'];
const PARTE = /^(pie|rodilla|mano|codo|brazo|muslo|tobillo)_(izq|der)$|^cabeza$/;
// palabras del texto que piden una condición (si la frase no está en no_medible): se revisa frase por frase
const PIDE = [
  [/\bjunt[oa]s\b/i, ['juntos'], 'juntos'],
  [/separ|anchura de la cadera|abre las? rodillas?/i, ['separados', 'juntos'], 'separados o juntos'],
  [/\d+\s?°|doblad|estirad|medio agachado/i, ['angulo', 'recto', 'inclinacion'], 'un ángulo'],
  [/\brect[oa]\b|en línea|tabla|horizontal|inclinad/i, ['recto', 'inclinacion', 'angulo'], 'recto, inclinación o ángulo'],
  [/quiet|no se mueven?\b/i, ['quieto'], 'quieto'],
];
const DOSIS = /\b(últimas|repeticiones|reps|series|segundos|si cuesta|más fácil|más difícil|sube de nivel|banda más dura|más tensión)\b|\d+\s?s\b/i;
const MATERIAL = [[/mancuerna/i, 'mancuernas'], [/toalla/i, 'toalla'], [/\bbanda|goma/i, ['gomas', 'banda']]];
let frases = 0;
for (const [k, f] of Object.entries(F)) {
  const t = T[k], ex = D.exercises[k];
  if (!t) { mal(k, 'paso 2: falta la técnica'); continue; }
  for (const c of ['inicio', 'fases', 'claves', 'errores', 'respiracion', 'lo_notas_en', 'condiciones'])
    if (t[c] == null || t[c] === '' || (Array.isArray(t[c]) && !t[c].length && c !== 'condiciones')) mal(k, `paso 2: falta ${c}`);
  if ((t.fases || []).length !== ex.phases.length) { mal(k, `paso 2: ${t.fases.length} fases y rutina.json tiene ${ex.phases.length}`); continue; }
  t.fases.forEach((ph, i) => {
    const r = ex.phases[i];
    if (Math.abs(ph.segundos - (r.move + r.hold)) > .01) mal(k, `paso 2: fase ${i + 1} dura ${ph.segundos} s y en rutina.json ${r.move + r.hold}`);
    if ((ph.tono || null) !== (r.tone || null)) mal(k, `paso 2: fase ${i + 1} tono ${ph.tono} ≠ ${r.tone}`);
    if (ph.texto !== r.cap) mal(k, `paso 2: fase ${i + 1} «${ph.texto}» no está en rutina.json (node ejercicios/a_rutina.js)`);
    if (!(ph.apoyos || []).length) mal(k, `paso 2: fase ${i + 1} sin apoyos`);
    for (const a of ph.apoyos || []) { const [p, s = 'suelo'] = a.split('@');
      if (!APOYO[p]) mal(k, `paso 2: apoyo desconocido ${p}`);
      if (!SUP.includes(s) && !CUERPO.includes(s)) mal(k, `paso 2: superficie desconocida ${s}`);
      if (SUP.includes(s) && s !== 'suelo' && !(f.material || []).includes(s) && !(s === 'silla' && (f.material || []).includes('sofa'))) mal(k, `paso 2: se apoya en ${s} y no está en el material`); }
  });
  if (JSON.stringify(t.claves) !== JSON.stringify(ex.cues)) mal(k, 'paso 2: las claves no están en rutina.json (node ejercicios/a_rutina.js)');
  if (t.claves.length < 3 || t.claves.length > 4) mal(k, `paso 2: ${t.claves.length} claves (3–4)`);
  t.claves.forEach(c => { if (DOSIS.test(c)) mal(k, `paso 2: la clave «${c}» es de dosis o de nivel`); });
  // condiciones con el vocabulario
  const tipos = new Set();
  for (const c of t.condiciones) {
    const tipo = ['juntos', 'separados', 'angulo', 'recto', 'quieto', 'altura', 'inclinacion'].find(x => c[x]);
    if (!tipo) { mal(k, `paso 2: condición desconocida ${JSON.stringify(c)}`); continue; }
    tipos.add(tipo);
    if (c.fase != null && [].concat(c.fase).some(i => i < 0 || i >= t.fases.length)) mal(k, `paso 2: condición con fase ${c.fase} que no existe`);
    if (tipo === 'juntos' || tipo === 'separados') { const v = c[tipo], ps = Array.isArray(v) ? v : v.partes; ps.forEach(p => { if (!PARTE.test(p)) mal(k, `paso 2: parte desconocida ${p}`); }); }
    if (tipo === 'angulo') { if (!ART.includes(c.angulo.articulacion)) mal(k, `paso 2: articulación ${c.angulo.articulacion}`);
      if (!(c.angulo.entre[0] < c.angulo.entre[1])) mal(k, 'paso 2: ángulo con rango al revés');
      if (c.angulo.lado && !['izq', 'der', 'alguno'].includes(c.angulo.lado)) mal(k, `paso 2: lado ${c.angulo.lado}`); }
    if (tipo === 'recto') (Array.isArray(c.recto) ? c.recto : c.recto.puntos).forEach(p => { if (!PUNTOS.includes(p)) mal(k, `paso 2: punto ${p}`); });
    if (tipo === 'quieto') { const p = typeof c.quieto === 'string' ? c.quieto : c.quieto.parte; if (!PUNTOS.includes(p)) mal(k, `paso 2: punto ${p}`); }
    if (tipo === 'inclinacion' && c.inclinacion.parte !== 'tronco') mal(k, `paso 2: inclinación de ${c.inclinacion.parte}`);
  }
  // lo que dice el texto, frase por frase, está en apoyos o condiciones (o en no_medible, con el porqué)
  const nm = t.no_medible || [], libre = fr => nm.some(x => fr.includes(x.split(':')[0]));
  const lista = [...t.inicio.split(/(?<=\.)\s+/), ...t.claves, ...t.fases.map(x => x.texto)];
  for (const fr of lista) { frases++;
    for (const [re, quiere, nom] of PIDE) if (re.test(fr) && !libre(fr) && !quiere.some(q => tipos.has(q))) mal(k, `paso 2: «${fr}» pide ${nom} y no hay condición`); }
  nm.forEach(x => { if (!lista.some(fr => fr.includes(x.split(':')[0]))) mal(k, `paso 2: no_medible «${x}» no está en el texto`); });
  // el texto habla del ejercicio: el material que nombra lo usa
  for (const fr of [...t.claves, ...t.fases.map(x => x.texto), t.inicio]) for (const [re, m] of MATERIAL)
    if (re.test(fr) && ![].concat(m).some(x => (f.material || []).includes(x))) mal(k, `paso 2: «${fr}» habla de ${[].concat(m)[0]} y el ejercicio no lo usa`);
}

const n = Object.keys(F).length, ap = Object.values(F).reduce((a, f) => a + (f.apuntes || []).length, 0);
if (fallos.length) { console.log(`Pasos 1 y 2: ${fallos.length} fallos\n- ` + fallos.join('\n- ')); process.exit(1); }
console.log(`Paso 1: ${n} fichas correctas. Paso 2: ${Object.keys(T).length} técnicas correctas (${frases} frases revisadas). Paso 3: node ejercicios/comprobar3d.js`);
