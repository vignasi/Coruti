/* Rutina core · motor de la app (C1): guardado, plan de la sesión, ejercicios sueltos, bandas, favoritas, historial y
   grabación de cada serie. Viene del index.html anterior (1.0.x) SIN cambiar lo que se guarda ni cómo se calcula:
   - buildPlan es la misma lógica que Plan.kt (widget y servicio) y buildFree la de Free.kt (FreePlanTest compara las dos).
   - Las claves (config, free.*, weights, history) son las mismas: el widget, la copia de seguridad y la nube siguen igual.
   En la app los datos van a Android (window.Android); en el navegador (pruebas), a localStorage. */
'use strict';
const A = window.Android || null;
let D = null;

/* ---------- Guardado ---------- */
const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const LV = ['S', 'N', 'F'];
const INT = { S: 'Suave', N: 'Normal', F: 'Fuerte' };
/* app: ajustes que solo usa la página (Config.app en Plan.kt los guarda tal cual): figura, sonido, rutina de core en favoritas */
const DEF_APP = { fig: 'm', tonos: true, mitad: true, coreFav: false, visto: false };
const DEF_CFG = { v: 2, mods: { abdomen: false, pecho: false, espalda: false, brazos: false, gluteo: false }, lv: {}, auto: false, int: 'S', correas: false, mancuernas: false, gomas: false, banda: false, rounds: 3, count: true, taper: false, app: DEF_APP };
/* Misma normalización que Config.fromJson en Plan.kt */
function normCfg(c) {
  c = c && typeof c === 'object' ? c : {};
  const o = { ...DEF_CFG, ...c, mods: { ...DEF_CFG.mods, ...(c.mods || {}) }, lv: { ...(c.lv || {}) }, app: { ...DEF_APP, ...(c.app || {}) } };
  if (!LV.includes(o.int)) o.int = 'S';
  o.rounds = Math.min(6, Math.max(1, Math.round(+o.rounds) || 3));
  if ((+c.v || 1) < 2) o.taper = false; o.v = 2;
  for (const k in o.mods) if (!LV.includes(o.lv[k])) o.lv[k] = o.int;
  if (o.app.fig !== 'f') o.app.fig = 'm';
  return o;
}
const store = {
  cfg() { try { return normCfg(JSON.parse(A ? A.getConfig() : LS.get('rutina.cfg'))); } catch (e) { return normCfg(null); } },
  saveCfg(c) { const s = JSON.stringify(c); try { A ? A.setConfig(s) : LS.set('rutina.cfg', s); } catch (e) {} },
  weights() { try { return JSON.parse(A ? A.getWeights() : LS.get('rutina.weights')) || {}; } catch (e) { return {}; } },
  setWeight(k, v) { try { if (A) A.setWeight(k, v); else { const w = store.weights(); w[k] = v; LS.set('rutina.weights', JSON.stringify(w)); } } catch (e) {} },
  lastDay() { try { return (A ? A.lastDay() : LS.get('rutina.lastDay')) || ''; } catch (e) { return ''; } },
  sessions() { try { return +(A ? A.sessions() : LS.get('rutina.sessions')) || 0; } catch (e) { return 0; } },
  free(k) { try { return A && A.getFree ? A.getFree(k) : LS.get('rutina.' + k); } catch (e) { return null; } },
  setFree(k, v) { try { if (A && A.setFree) A.setFree(k, v); else LS.set('rutina.' + k, v); } catch (e) {} },
  days() { try { const a = JSON.parse(A && A.days ? A.days() : LS.get('rutina.days')); return Array.isArray(a) ? a : []; } catch (e) { return []; } },
  stats() {
    try { if (A) return JSON.parse(A.stats()); } catch (e) {}
    const d = new Set(store.days()), k = x => dayKey(x); let n = 0, t = new Date(); if (!d.has(k(t))) t.setDate(t.getDate() - 1);
    while (d.has(k(t))) { n++; t.setDate(t.getDate() - 1); }
    return { today: d.has(k(new Date())), streak: n, total: d.size };
  },
  /* Ejercicios sueltos: cuenta para la racha sin tocar la alternancia A/B */
  day() { try { if (A) { A.markDay(); A.vibrate(); } else { addDay(); navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 600]); } } catch (e) {} },
  done(rounds, day) { try { if (A) { A.markDone(rounds, day); A.vibrate(); } else { addDay(); LS.set('rutina.lastDay', day); LS.set('rutina.sessions', store.sessions() + 1); } } catch (e) {} },
  history() { try { const a = JSON.parse(A && A.history ? A.history() : LS.get('rutina.history')); return Array.isArray(a) ? a : []; } catch (e) { return []; } },
  saveSession(o) { try { if (A && A.saveSession) A.saveSession(JSON.stringify(o)); else { const a = store.history().filter(x => x.id !== o.id); a.push(o); a.sort((x, y) => x.start - y.start); LS.set('rutina.history', JSON.stringify(a)); } } catch (e) {} },
  setSessionFeedback(id, fb) { try { if (A && A.setSessionFeedback) A.setSessionFeedback(id, JSON.stringify(fb)); else { const a = store.history(); const o = a.find(x => x.id === id); if (o) { o.fb = fb; LS.set('rutina.history', JSON.stringify(a)); } } } catch (e) {} },
};
function addDay() { const d = new Set(store.days()); d.add(dayKey(Date.now())); LS.set('rutina.days', JSON.stringify([...d].sort())); }

/* ---------- Plan de la rutina de core (misma lógica que Plan.kt) ---------- */
const fkg = n => Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
const kgRange = kg => `${fkg(kg[0])}–${fkg(kg[1])} kg por mano`;
function resolve(slot, cfg, level = cfg.int) {
  for (const v of (slot.variants || [slot])) {
    if (v.needs && !cfg[v.needs]) continue;
    const d = v.dose || v[level]; if (!d) continue;
    return { v, d, ex: d.ex || v.ex };
  }
  return null;
}
function activeModules(cfg, lastDay) {
  if (cfg.auto) { const day = lastDay === 'A' ? 'B' : 'A'; return D.modules.filter(m => m.day === day); }
  return D.modules.filter(m => cfg.mods[m.key]);
}
function dayType(mods) { const s = [...new Set(mods.map(m => m.day))]; return s.length === 1 ? s[0] : ''; }
function buildPlan(cfg, lastDay, offset) {
  const mods = activeModules(cfg, lastDay), out = [];
  for (let r = 1; r <= cfg.rounds; r++) {
    if (r > 1) out.push({ k: 'gato', name: 'Descanso', sub: 'Respira y bebe agua', s: D.rest, r, rest: true, say: `Descanso, ${D.rest} segundos` });
    const f = cfg.taper ? D.taper[Math.min(r, D.taper.length) - 1] : 1, items = [];
    D.base.forEach(it => { const x = resolve(it, cfg); if (x) items.push([x, null]); });
    mods.forEach(m => {
      const res = m.slots.map(s => resolve(s, cfg, cfg.lv[m.key] || cfg.int)).filter(Boolean); if (!res.length) return;
      (m.rotate ? [res[(r - 1 + offset) % res.length]] : res).forEach(x => items.push([x, m]));
    });
    D.close.forEach(it => { const x = resolve(it, cfg); if (x) items.push([x, null]); });
    items.forEach(([x, m]) => expand(x, m, f, r, out));
  }
  return out;
}
function expand(x, mod, f, r, out) {
  const { v, d } = x, ex = D.exercises[x.ex];
  let reps = d.reps || 0, secs = d.secs || 0;
  if (mod && f !== 1) { if (reps) reps = Math.max(3, Math.round(reps * f)); if (secs) secs = Math.max(5, Math.round(secs * f)); }
  const s = reps ? Math.round(reps * ex.rep) : secs, dose = reps ? `${reps} reps` : `${secs} s`;
  (v.sides || ['']).forEach((side, i) => {
    const sub = [side, mod ? dose : '', d.note || v.note || ''].filter(Boolean).join(' · ');
    let say;
    if (v.say) say = Array.isArray(v.say) ? v.say[i] : v.say;
    else if (i > 0) say = 'Ahora ' + side.toLowerCase();
    else { say = ex.name + ', ' + (reps ? reps + ' repeticiones' : secs + ' segundos'); if (side) say += ', ' + side.toLowerCase();
      if (d.kg) say += `, de ${fkg(d.kg[0])} a ${fkg(d.kg[1])} kilos`; }
    const base = { k: x.ex, r, kg: d.kg || null, mod: mod ? mod.key : null };
    out.push({ ...base, name: 'Prepárate', sub: ex.name + (sub ? ' · ' + sub : ''), s: D.prep, prep: true, say: 'Prepárate. ' + say });
    out.push({ ...base, name: ex.name, sub, s, reps, hold: !!ex.hold, say, side });
  });
}
const totalOf = st => st.reduce((a, b) => a + b.s, 0);
function modsLabel(mods) { return mods.length ? 'Base + ' + mods.map(m => m.name).join(' + ') : 'Solo la base'; }

/* ---------- Ejercicios sueltos (misma forma de pasos que buildPlan; Free.kt hace lo mismo para el widget) ---------- */
const DEF_FREE = { sel: [], rounds: 4, rest: 75, alt: true, zone: '', needs: '' };
const catOf = k => (D.catalog && D.catalog.ex[k]) || {};
const isHoldEx = k => !!D.exercises[k].hold;
const defN = k => isHoldEx(k) ? (catOf(k).secs || 30) : (catOf(k).reps || 12);
const clampN = (k, n) => isHoldEx(k) ? Math.min(180, Math.max(5, Math.round(n / 5) * 5 || 5)) : Math.min(50, Math.max(1, Math.round(n) || 1));
function normFree(o) {
  o = o && typeof o === 'object' ? o : {}; const f = { ...DEF_FREE, ...o };
  f.sel = (Array.isArray(o.sel) ? o.sel : []).filter(it => it && D.exercises[it.k]).map(it => ({ ...it, k: it.k, n: clampN(it.k, +it.n || defN(it.k)) }));
  f.rounds = Math.min(10, Math.max(1, Math.round(+f.rounds) || 4));
  f.rest = Math.min(180, Math.max(15, Math.round((+f.rest || 75) / 15) * 15));
  f.alt = f.alt !== false;
  return f;
}
const isAlt = f => f.alt && f.sel.length > 1;
/* Bandas grandes (material «gomas» en los datos): tus bandas y cuál usas en cada ejercicio */
const DEF_BANDS = ['Banda 1', 'Banda 2', 'Banda 3', 'Banda 4'];
let BANDS = null, BUSE = null;
function loadBands() {
  try { const a = JSON.parse(store.free('free.bands')); BANDS = Array.isArray(a) ? a.filter(x => typeof x === 'string' && x.trim()).slice(0, 8) : null; } catch (e) { BANDS = null; }
  if (!BANDS || !BANDS.length) BANDS = DEF_BANDS.slice();
  try { const u = JSON.parse(store.free('free.bandUse')); BUSE = u && typeof u === 'object' ? u : {}; } catch (e) { BUSE = {}; }
}
const usesBand = k => catOf(k).needs === 'gomas';
const bandOf = k => { const b = BUSE[k]; return b && BANDS.includes(b) ? b : null; };
function setBand(k, name) { if (name) BUSE[k] = name; else delete BUSE[k]; store.setFree('free.bandUse', JSON.stringify(BUSE)); }
function setBands(a) {
  const old = BANDS; BANDS = a.map(x => x.trim()).filter(Boolean).slice(0, 8); if (!BANDS.length) BANDS = DEF_BANDS.slice();
  /* Si renombras una banda, los ejercicios que la usaban siguen con ella */
  old.forEach((o, i) => { const n = a[i] && a[i].trim(); if (n && n !== o) for (const k in BUSE) if (BUSE[k] === o) BUSE[k] = n; });
  store.setFree('free.bands', JSON.stringify(BANDS)); store.setFree('free.bandUse', JSON.stringify(BUSE));
}
function freeExpand(it, r, out) {
  const ex = D.exercises[it.k], ce = catOf(it.k), hold = isHoldEx(it.k);
  const reps = hold ? 0 : it.n, secs = hold ? it.n : 0, s = reps ? Math.round(reps * ex.rep) : secs, dose = reps ? `${reps} reps` : `${secs} s`;
  (ce.sides || ['']).forEach((side, i) => {
    const sub = [side, dose].filter(Boolean).join(' · ');
    let say;
    if (i > 0) say = 'Ahora ' + side.toLowerCase();
    else { say = ex.name + ', ' + (reps ? reps + ' repeticiones' : secs + ' segundos'); if (side) say += ', ' + side.toLowerCase();
      if (ce.kg) say += `, de ${fkg(ce.kg[0])} a ${fkg(ce.kg[1])} kilos`;
      if (usesBand(it.k) && bandOf(it.k)) say += ', ' + bandOf(it.k); }
    const base = { k: it.k, r, kg: ce.kg || null, mod: null };
    out.push({ ...base, name: 'Prepárate', sub: ex.name + ' · ' + sub, s: D.prep, prep: true, say: 'Prepárate. ' + say });
    out.push({ ...base, name: ex.name, sub, s, reps, hold: hold, say, side });
  });
}
function buildFree(f) {
  const out = [], items = f.sel;
  const rest = r => out.push({ k: 'gato', name: 'Descanso', sub: 'Respira y bebe agua', s: f.rest, r, rest: true, say: `Descanso, ${f.rest} segundos` });
  /* Alternado (superserie): A, B, descanso y otra ronda */
  if (isAlt(f)) for (let r = 1; r <= f.rounds; r++) { if (r > 1) rest(r); items.forEach(it => freeExpand(it, r, out)); }
  /* Series normales: todas las series de un ejercicio, con su descanso, y luego el siguiente */
  else items.forEach(it => { for (let r = 1; r <= f.rounds; r++) { if (out.length) rest(r); freeExpand(it, r, out); } });
  return out;
}

/* ---------- Favoritas ---------- */
function favs() { try { const a = JSON.parse(store.free('free.favs')); return (Array.isArray(a) ? a : []).filter(f => f && f.name && normFree(f).sel.length); } catch (e) { return []; } }
const widgetFav = () => store.free('free.widgetFav') || '';
function saveFavs(a) { store.setFree('free.favs', JSON.stringify(a.slice(0, 20))); }
const autoName = f => f.sel.map(it => D.exercises[it.k].name).join(' + ');
function saveFav(f, name) {
  name = (name || autoName(f)).trim().slice(0, 60);
  const a = favs().filter(x => x.name !== name);
  a.unshift({ name, sel: f.sel.map(it => ({ k: it.k, n: it.n })), rounds: f.rounds, rest: f.rest, alt: f.alt });
  saveFavs(a); return name;
}
function deleteFav(name) { saveFavs(favs().filter(x => x.name !== name)); if (widgetFav() === name) store.setFree('free.widgetFav', ''); }

/* ---------- Fechas y textos ---------- */
const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
const dayKey = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const thisYear = ms => new Date(ms).getFullYear() === new Date().getFullYear();
const dayLong = ms => cap1(new Date(ms).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: thisYear(ms) ? undefined : 'numeric' }));
const dayShort = ms => new Date(ms).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: thisYear(ms) ? undefined : 'numeric' });
const hhmm = ms => new Date(ms).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const durTxt = ms => { const m = Math.round(ms / 60000); return m < 1 ? Math.round(ms / 1000) + ' s' : m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };
const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const minTxt = s => Math.max(1, Math.round(s / 60)) + ' min';

/* ---------- Historial ---------- */
const doseOf = x => x.planSecs ? (x.skipped ? `${x.secs} de ${x.planSecs} s` : `${x.secs} s`) : (x.skipped ? `${x.reps} de ${x.planReps} reps` : `${x.reps} reps`);
const FBT = { up: 'fácil', ok: 'justo', down: 'demasiado' };
function historyList() { return store.history().filter(o => o && Array.isArray(o.sets)).sort((a, b) => b.start - a.start); }
/* La mejor serie: con más kilos (y a igualdad, más repeticiones); sin kilos, más repeticiones o más segundos */
const better = (a, b) => !b || ((a.kg || 0) !== (b.kg || 0) ? (a.kg || 0) > (b.kg || 0) : (a.reps || a.secs) > (b.reps || b.secs));
function exSummary(h) {
  const m = new Map();
  h.forEach(o => o.sets.forEach(x => {
    if (!m.has(x.k)) m.set(x.k, { k: x.k, name: x.name, last: null, lastSets: [], best: null, bestAt: 0 });
    const e = m.get(x.k);
    if (!e.last || o.start > e.last) { e.last = o.start; e.lastSets = []; } if (o.start === e.last) e.lastSets.push(x);
    if (better(x, e.best)) { e.best = x; e.bestAt = o.start; }
  }));
  return [...m.values()].sort((a, b) => b.last - a.last);
}
function lastTxt(e) {
  const L = e.lastSets, hold = !!L[0].planSecs, kgs = [...new Set(L.filter(x => x.kg != null).map(x => x.kg))].sort((a, b) => a - b), bands = [...new Set(L.map(x => x.band).filter(Boolean))];
  return [L.length + (L.length === 1 ? ' serie' : ' series'), L.map(x => hold ? x.secs : x.reps).join('/') + (hold ? ' s' : ' reps'),
    kgs.length ? kgs.map(fkg).join('–') + ' kg' : '', bands.join(', ')].filter(Boolean).join(' · ');
}
function bestTxt(e) { const x = e.best; return (x.planSecs ? x.secs + ' s' : x.reps + ' reps') + (x.kg != null ? ' con ' + fkg(x.kg) + ' kg' : '') + (x.band ? ' · ' + x.band : ''); }

/* ---------- Sonido ---------- */
let actx = null;
const beepLog = [];
function audioOn() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } try { actx && actx.resume(); } catch (e) {} }
function beep(f = 880, d = .12) { beepLog.push({ f, t: performance.now() }); if (!actx) return; try { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; g.gain.value = .15; o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + d); } catch (e) {} }
const sayLog = [];
function say(txt) { if (!txt) return; sayLog.push(txt); if (A) { try { A.speak(txt); } catch (e) {} return; } try { if (!window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'es-ES'; u.rate = 1.05; speechSynthesis.speak(u); } catch (e) {} }
function chime() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, i === 3 ? .6 : .18), i * 190)); }

/* ---------- Animación: fase N desde el inicio del ejercicio (para el tono de cada fase) ---------- */
const cycleOf = ex => ex.phases.reduce((a, b) => a + b.move + b.hold, 0);
function phaseCount(ex, t) {
  const total = cycleOf(ex); let c = Math.floor(t / total), tt = t - c * total, i = 0;
  while (i < ex.phases.length - 1 && tt >= ex.phases[i].move + ex.phases[i].hold) { tt -= ex.phases[i].move + ex.phases[i].hold; i++; }
  return c * ex.phases.length + i;
}

async function loadData() { if (A && A.rutina) return JSON.parse(A.rutina()); const r = await fetch('rutina.json'); return r.json(); }
