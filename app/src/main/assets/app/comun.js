/* Rutina core · lo común de la interfaz (B3: app.js partido por zonas).
   Iconos, piezas de HTML, estado, las sesiones que se pueden empezar, cómo se pinta una pantalla y las acciones
   que comparten varias zonas. Cada zona (entrenar.js, reproductor.js, ejercicios.js, historial.js, tu.js) añade sus
   pantallas a P, sus acciones a ACC, sus hojas a HOJAS y sus formularios a FORM. inicio.js va el último: escucha los
   toques, conecta con Android y arranca. La lógica de datos está en motor.js; la figura, en fig.js.
   Viene de app.js (C1, desde el prototipo validado de D2 y D3). Solo sale lo que funciona de verdad: lo que llega
   más adelante (Claude, planes, pulso en directo, peso) no sale hasta que exista.
   Los scripts no son módulos: comparten las variables de arriba del todo, así que el orden de index.html importa. */
'use strict';

/* ---------- Iconos (trazo 2, 24×24; los del prototipo) ---------- */
const I = {
  entrenar: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
  ejercicios: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  historial: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M8 14h3M8 17h6"/>',
  tu: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  atras: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor"/>', pausa: '<path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/>',
  parar: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/>',
  estrella: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  estrellaLlena: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="currentColor"/>',
  mas: '<path d="M12 5v14M5 12h14"/>', menos: '<path d="M5 12h14"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  racha: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 2.5 0-3 .5-5.5 1-8z"/>',
  lapiz: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', subir: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  bajar: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>', aviso: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
  reintentar: '<path d="M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5"/>',
  reloj2: '<rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 10v2.5l1.5 1"/>',
  banda: '<ellipse cx="12" cy="12" rx="8" ry="4.5"/><ellipse cx="12" cy="12" rx="5" ry="2"/>',
  sonido: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  figura: '<circle cx="12" cy="5" r="2.2"/><path d="M12 8v6M8 10.5l4-1.5 4 1.5M9 21l3-7 3 7"/>',
  widget: '<rect x="4" y="4" width="16" height="9" rx="2"/><rect x="4" y="15" width="7" height="5" rx="1.5"/><rect x="13" y="15" width="7" height="5" rx="1.5"/>',
  nube: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17.5 18z"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>', mancuerna: '<path d="M6 8v8M9 6v12M15 6v12M18 8v8M9 12h6"/>',
  correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', salir: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
  externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  doble: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  conexion: '<path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0zM12 16v5"/>', papelera: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
};
const ico = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);

/* ---------- Estado ---------- */
let cfg = null, lastDay = '', offset = 0, fr = null;
const S = { ruta: 'entrenar', pila: [], hoja: null, hojaDe: null, toast: null, zona: '', mat: '', ex: null, det: null, favEdit: null, desde: null };
window.FIG_GENERO = () => (cfg && cfg.app.fig === 'f' ? 'f' : 'm');
function reloadState() { cfg = store.cfg(); lastDay = store.lastDay(); offset = store.sessions(); }
function saveCfg() { store.saveCfg(cfg); }
function loadFree() { try { fr = normFree(JSON.parse(store.free('free.last'))); } catch (e) { fr = normFree(null); } }
function saveFree() { store.setFree('free.last', JSON.stringify(fr)); }

/* ---------- Piezas ---------- */
const cab = (titulo) => `<header class="cabecera"><button class="icono-btn" data-act="atras" aria-label="Atrás">${ico('atras')}</button><h1>${esc(titulo)}</h1></header>`;
const origen = (i, t) => `<span class="origen">${ico(i)}${esc(t)}</span>`;
const fig = (k, modo = 'mini', g = '') => { const ex = D.exercises[k]; return `<div class="fig fig-${modo}${modo === 'libre' || modo === 'sig' ? ' libre' : ''}${modo === 'sig' ? ' pequena' : ''}" ${modo === 'mini' || modo === 'sig' ? 'aria-hidden="true"' : `role="img" aria-label="Movimiento de ${esc(ex ? ex.name : k)}"`}><canvas data-fig="${k}" data-modo="${modo}" ${g ? `data-g="${g}"` : ''} width="180" height="112"></canvas><span class="fig-txt">Cargando la figura…</span></div>`; };
const paso = (k, val, etiqueta, menos = 'Menos', mas = 'Más') => `<div class="paso" role="group" aria-label="${esc(etiqueta)}"><button data-act="menos" data-k="${k}" aria-label="${esc(menos)}">${ico('menos')}</button><output aria-live="polite">${esc(val)}</output><button data-act="mas" data-k="${k}" aria-label="${esc(mas)}">${ico('mas')}</button></div>`;
const inter = (id, on, etiqueta, dis = false) => `<input type="checkbox" role="switch" class="interruptor" id="${id}" data-act="sw" data-k="${id}" ${on ? 'checked' : ''} ${dis ? 'disabled' : ''} aria-label="${esc(etiqueta)}">`;
const seg = (k, ops, val, etiqueta) => `<div class="segmentos" role="group" aria-label="${esc(etiqueta)}">${ops.map(([v, t]) => `<button data-act="seg" data-k="${k}" data-v="${v}" aria-pressed="${v === val}">${esc(t)}</button>`).join('')}</div>`;
const item = o => `<button class="item" ${o.go ? `data-go="${o.go}"` : ''} ${o.act ? `data-act="${o.act}"` : ''} ${o.v != null ? `data-v="${esc(o.v)}"` : ''}>${o.icono ? `<span class="item-icono">${ico(o.icono)}</span>` : ''}<span class="crece"><span class="nombre">${esc(o.t)}</span>${o.m ? `<span class="meta">${esc(o.m)}</span>` : ''}</span>${o.der != null ? o.der : ico('chev', 'chev')}</button>`;
const NEEDS = () => ({ '': 'Sin material', ...(D.catalog.needs || {}) });

/* ---------- Sesiones que se pueden empezar ---------- */
function corePasos() { return buildPlan(cfg, lastDay, offset); }
function coreResumen() {
  const am = activeModules(cfg, lastDay), st = corePasos();
  const dia = cfg.auto ? `Hoy toca el día ${lastDay === 'A' ? 'B' : 'A'}` : modsLabel(am);
  return { titulo: 'Rutina de core', meta: `${dia} · ${plural(cfg.rounds, 'ronda', 'rondas')} · ${minTxt(totalOf(st))}`, pasos: st };
}
function favResumen(f) {
  const n = normFree(f), st = buildFree(n);
  return { titulo: f.name, meta: `${plural(n.sel.length, 'ejercicio', 'ejercicios')} · ${n.rounds} ${isAlt(n) ? (n.rounds === 1 ? 'ronda' : 'rondas') : (n.rounds === 1 ? 'serie' : 'series')}${isAlt(n) ? ' alternadas' : ''} · ${minTxt(totalOf(st))}`, pasos: st };
}
/* La sesión de «Hoy»: la que hace el widget (favorita con ★ o rutina de core), así la app y el widget dicen lo mismo */
function sesionHoy() { const w = widgetFav(), f = w && favs().find(x => x.name === w); return f ? { tipo: 'fav', fav: f, ...favResumen(f) } : { tipo: 'core', ...coreResumen() }; }

/* ---------- Pantallas ---------- */
const P = {};
const TABS = [['entrenar', 'Entrenar'], ['ejercicios', 'Ejercicios'], ['historial', 'Historial'], ['tu', 'Tú']];
const TAB_DE = { entrar: 'tu', material: 'tu', bandas: 'tu', sonido: 'tu', figura: 'tu', widgetconf: 'tu', copia: 'tu', conexiones: 'tu', strava: 'tu', polar: 'tu', core: 'entrenar', nueva: 'entrenar', elegir: 'entrenar', final: 'entrenar', ficha: 'ejercicios', detalle: 'historial', marcas: 'historial' };
/* Lo que piden varias zonas a la vez: acciones (ACC), hojas inferiores (HOJAS) y formularios (FORM) */
const ACC = {}, HOJAS = {}, FORM = {};

/* Material que tienes (Rutina de core y Tú) */
const MAT_TXT = () => { const m = [cfg.gomas && 'bandas grandes', cfg.banda && 'mini banda', cfg.mancuernas && 'mancuernas'].filter(Boolean); return m.length ? cap1(m.join(', ')) : 'Sin material'; };

/* Filtros de zona y material (Ejercicios y Elegir) */
const filtros = () => `
  <div class="chips" role="group" aria-label="Zona">${D.catalog.zones.map(z => `<button class="chip" data-act="zona" data-v="${esc(z)}" aria-pressed="${S.zona === z}">${esc(z)}</button>`).join('')}</div>
  <div class="chips" role="group" aria-label="Material">${Object.entries(NEEDS()).filter(([k]) => k !== 'correas').map(([k, v]) => `<button class="chip" data-act="mat" data-v="${k || 'none'}" aria-pressed="${S.mat === (k || 'none')}">${esc(v)}</button>`).join('')}</div>`;
const filtrar = () => Object.keys(D.exercises).filter(k => { const c = catOf(k); if (c.needs === 'correas') return false;
  return (!S.zona || c.zone === S.zona) && (!S.mat || (S.mat === 'none' ? !c.needs : c.needs === S.mat)); })
  .sort((a, b) => D.exercises[a].name.localeCompare(D.exercises[b].name, 'es'));

/* ---------- Cuenta, Strava y Polar: lo que miran Historial, Tú y el final ---------- */
function nube() { try { return A && A.cloudState ? JSON.parse(A.cloudState()) : null; } catch (e) { return null; } }
/* ---------- Strava y Polar (S1): estados, conexiones y lo que sale en el historial y al terminar ---------- */
const FEEL = [['mal', 'Mal'], ['regular', 'Regular'], ['bien', 'Bien'], ['muybien', 'Muy bien']];
const STRAVA = { done: ['bien', 'check', 'En Strava'], waiting: ['aviso', 'reloj', 'Pendiente'], uploading: ['aviso', 'reloj', 'Subiendo'],
  error: ['error', 'aviso', 'No se pudo subir'], duplicate: ['aviso', 'doble', 'Ya estaba en Strava'], no: ['neutro', 'nube', 'Sin enviar'] };
const estado = k => { const [c, i, t] = STRAVA[k]; return `<span class="estado ${c}">${ico(i)}${esc(t)}</span>`; };
function conn(p, st = nube()) { const c = st && st.signedIn && st.conn ? st.conn[p] : null; return c && c.status ? c : null; }
const conectado = (p, st) => { const c = conn(p, st); return !!c && c.status === 'connected'; };
/* El estado de Strava de una sesión: el que puso el servidor o, si aún no ha llegado, lo que va a pasar */
function stravaDe(o, sc = conn('strava')) {
  if (o.strava && STRAVA[o.strava.s]) return o.strava.s;
  if (!sc || sc.status !== 'connected' || (o.src && o.src !== 'app' && o.src !== 'widget')) return null;
  return o.st !== false && o.start >= Date.parse(sc.connected_at || 0) ? 'waiting' : 'no';
}

/* ---------- Hojas inferiores comunes ---------- */
/* La banda: se elige en Sesión nueva y en el reproductor */
Object.assign(HOJAS, {
  banda: () => { const k = S.hojaDe, cur = bandOf(k); return `<h2 class="h2">¿Qué banda llevas?</h2><p class="meta">${esc(D.exercises[k].name)}. La próxima vez sale la que elijas.</p><div class="lista">${BANDS.map(b => `<button class="item" data-act="ponbanda" data-v="${esc(b)}" role="radio" aria-checked="${b === cur}"><span class="item-icono">${ico('banda')}</span><span class="crece"><span class="nombre">${esc(b)}</span></span>${b === cur ? ico('check', 'chev') : '<span style="width:20px"></span>'}</button>`).join('')}</div><p class="meta">Los nombres se cambian en Tú → Mis bandas.</p>`; },
});

/* ---------- Pintar ---------- */
function ir(ruta, sinPila) { if (!sinPila && S.ruta !== ruta) S.pila.push(S.ruta); S.ruta = ruta; S.hoja = null; pintar(true); }
function pintar(arriba = true) {
  const id = P[S.ruta] ? S.ruta : 'entrenar', p = P[id], movil = document.getElementById('movil');
  const sc = movil.querySelector('.pantalla'), y = sc && !arriba ? sc.scrollTop : 0;
  const tab = TABS.some(t => t[0] === id) ? id : TAB_DE[id];
  const foco = !arriba && document.activeElement && document.activeElement.dataset ? [document.activeElement.dataset.act, document.activeElement.dataset.k, document.activeElement.dataset.v, document.activeElement.id] : null;
  movil.innerHTML = p.render() +
    (!p.sinPestanas ? `<nav class="pestanas" aria-label="Secciones">${TABS.map(([k, t]) => `<button data-act="tab" data-v="${k}" ${tab === k ? 'aria-current="page"' : ''}><span class="pastilla-icono">${ico(k)}</span>${t}</button>`).join('')}</nav>` : '') +
    (S.hoja && HOJAS[S.hoja] ? `<div class="velo" data-act="velo"><div class="hoja" role="dialog" aria-modal="true" aria-labelledby="hoja-t"><span class="asa"></span>${HOJAS[S.hoja]().replace('<h2 class="h2">', '<h2 class="h2" id="hoja-t">')}</div></div>` : '') +
    (S.toast ? `<div class="aviso-toast" role="status">${ico('check').replace('<svg', '<svg style="width:20px;height:20px;flex:none"')}${esc(S.toast)}</div>` : '');
  const nsc = movil.querySelector('.pantalla'); if (nsc) nsc.scrollTop = y;
  const hoja = movil.querySelector('.hoja');
  if (hoja) { const inp = hoja.querySelector('input'); if (inp) inp.focus(); else if (!hoja.contains(document.activeElement)) { hoja.tabIndex = -1; hoja.focus(); } }
  else if (arriba) { const h = movil.querySelector('h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
  else if (foco) { const sel = foco[3] ? '#' + CSS.escape(foco[3]) : `[data-act="${foco[0]}"]${foco[1] ? `[data-k="${CSS.escape(foco[1])}"]` : ''}${foco[2] ? `[data-v="${CSS.escape(foco[2])}"]` : ''}`; const e = foco[0] || foco[3] ? movil.querySelector(sel) : null; if (e) e.focus({ preventScroll: true }); }
  if (window.FIG) window.FIG.pintar(movil);
}
let toastT;
function toast(m) { S.toast = m; pintar(false); clearTimeout(toastT); toastT = setTimeout(() => { S.toast = null; pintar(false); }, 2200); }

/* ---------- Acciones comunes ----------
   cambiar (− y +), seg (segmentos) y sw (interruptores) reparten por la clave del control, de todas las zonas. */
function cambiar(k, d) {
  if (k === 'core.rondas') { cfg.rounds = lim(cfg.rounds + d, 1, 6); saveCfg(); }
  else if (k === 'f.rondas') { fr.rounds = lim(fr.rounds + d, 1, 10); saveFree(); }
  else if (k === 'f.desc') { fr.rest = lim(fr.rest + d * 15, 15, 180); saveFree(); }
  else if (k.startsWith('n.')) { const it = fr.sel[+k.slice(2)]; if (it) { it.n = clampN(it.k, it.n + d * (isHoldEx(it.k) ? 5 : 1)); saveFree(); } }
  else if (k === 'esfuerzo') { const f = S.final; f.rpe = f.rpe ? lim(f.rpe + d, 1, 10) : 7; if (f.id) store.setSessionFields(f.id, { rpe: f.rpe }); }
  else if (k === 'kg') { const s = R.pasos[R.idx].prep ? R.pasos[R.idx + 1] : R.pasos[R.idx]; R.w = { k: s.k, v: lim(kgDe(s) + d * 0.5, 0.5, 60) }; guardarKg(); }
}
Object.assign(ACC, {
  tab: b => { S.pila = []; S.favEdit = null; ir(b.dataset.v, true); return 'nav'; },
  atras: () => { atras(); return 'nav'; },
  mas: b => cambiar(b.dataset.k, 1), menos: b => cambiar(b.dataset.k, -1),
  seg: b => { const k = b.dataset.k, v = b.dataset.v;
    if (k.startsWith('nivel.')) { cfg.lv[k.slice(6)] = v; saveCfg(); }
    else if (k.startsWith('fb.')) marcarFb(k.slice(3), v);
    else if (k === 'sentir') { S.final.feel = v; if (S.final.id) store.setSessionFields(S.final.id, { feel: v }); } },
  sw: b => { const k = b.dataset.k, on = b.checked;
    if (k === 'core-auto') cfg.auto = on; else if (k === 'core-taper') cfg.taper = on;
    else if (k.startsWith('mod-')) cfg.mods[k.slice(4)] = on;
    else if (k === 'f-alt') { fr.alt = on; saveFree(); return; }
    else if (k.startsWith('m-')) cfg[k.slice(2)] = on;
    else if (k === 'fin-strava') { S.final.st = on; if (S.final.id) store.setSessionFields(S.final.id, { st: on ? null : false }); return; }
    else if (k === 'st-fwd') { S.fwd = on; S.connMsg = 'Guardando…'; S.connOk = true; try { A.connForward(on); } catch (e) {} return; }
    else if (k === 's-tonos') cfg.app.tonos = on; else if (k === 's-mitad') cfg.app.mitad = on; else if (k === 's-count') cfg.count = on;
    saveCfg(); },
  zona: b => { S.zona = S.zona === b.dataset.v ? '' : b.dataset.v; },
  mat: b => { S.mat = S.mat === b.dataset.v ? '' : b.dataset.v; },
  widgetfav: b => { const name = b.dataset.v, ya = widgetFav() === name;
    if (!name) { store.setFree('free.widgetFav', ''); toast('El widget hace la rutina de core'); return 'nada'; }
    store.setFree('free.widgetFav', ya ? '' : name); toast(ya ? 'El widget vuelve a la rutina de core' : `«${name}» sale en el widget y en Hoy`); return 'nada'; },
  hoja: b => { S.hoja = b.dataset.v; },
  hojabanda: b => { S.hojaDe = b.dataset.v; S.hoja = 'banda'; },
  ponbanda: b => { const k = S.hojaDe, cur = bandOf(k), nb = b.dataset.v === cur ? '' : b.dataset.v; setBand(k, nb);
    /* lo que se dice en las rondas que faltan también cambia */
    if (R) R.pasos.slice(R.idx + 1).forEach(t => { if (t.k !== k) return; if (cur && t.say.endsWith(', ' + cur)) t.say = t.say.slice(0, -(cur.length + 2)); if (nb && t.say.startsWith('Prepárate. ' + D.exercises[k].name + ',')) t.say += ', ' + nb; });
    S.hoja = null; },
  cerrar: () => { if (R) R.pausa = false; S.hoja = null; },
  velo: (b, ev) => { if (ev.target !== b) return 'nada'; if (R) R.pausa = false; S.hoja = null; },
});
function atras() {
  if (S.hoja) { if (R) R.pausa = false; S.hoja = null; pintar(false); return true; }
  if (S.ruta === 'reproductor') { R.pausa = true; S.hoja = 'pausa'; pintar(false); return true; }
  if (S.ruta === 'final') { ACC.finvolver(); return true; }
  if (S.pila.length) { const r = S.pila.pop(); if (S.ruta === 'nueva') S.favEdit = null; S.ruta = r; pintar(true); return true; }
  if (S.ruta !== 'entrenar') { S.ruta = 'entrenar'; pintar(true); return true; }
  return false;
}
window.atras = atras;
