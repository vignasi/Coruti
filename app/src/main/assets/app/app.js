/* Rutina core · la app (C1), construida desde el prototipo validado (docs/diseno/prototipo/, D2 y D3).
   Pantallas con cuatro pestañas (Entrenar · Ejercicios · Historial · Tú), el reproductor a pantalla completa y el final.
   La lógica de datos está en motor.js; la figura, en fig.js. Solo lo que funciona de verdad: lo que llega más adelante
   (Claude, planes, Strava, pulso, peso) no sale hasta que exista. */
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
  externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>', papelera: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
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
const dosisDe = k => { const c = catOf(k), ex = D.exercises[k]; return (isHoldEx(k) ? `${c.secs || 30} s` : `${c.reps || 12} reps`) + (c.sides ? ' por lado' : ''); };

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
const TAB_DE = { entrar: 'tu', material: 'tu', bandas: 'tu', sonido: 'tu', figura: 'tu', widgetconf: 'tu', copia: 'tu', core: 'entrenar', nueva: 'entrenar', elegir: 'entrenar', final: 'entrenar', ficha: 'ejercicios', detalle: 'historial', marcas: 'historial' };

P.entrenar = { render: () => {
  const st = store.stats(), hoy = sesionHoy(), dias = new Set(store.days());
  const hoyD = new Date(), lunes = new Date(hoyD); lunes.setDate(hoyD.getDate() - ((hoyD.getDay() + 6) % 7));
  const semana = [...'LMXJVSD'].map((l, i) => { const d = new Date(lunes); d.setDate(lunes.getDate() + i); const k = dayKey(d), hecho = dias.has(k), esHoy = k === dayKey(hoyD);
    return `<span class="dia ${hecho ? 'hecho' : ''} ${esHoy ? 'hoy-d' : ''}" role="listitem" aria-label="${esc(cap1(d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })))}${hecho ? ', hecho' : ''}${esHoy ? ', hoy' : ''}"><span class="letra" aria-hidden="true">${l}</span><span class="marca" aria-hidden="true">${hecho ? ico('check') : ''}</span></span>`; }).join('');
  const lista = favs(), wf = widgetFav();
  const filaFav = (id, t, m, enW, accion) => `<div class="item" style="cursor:default">
      <button class="icono-btn ${enW ? 'activo' : ''}" data-act="widgetfav" data-v="${esc(id)}" aria-pressed="${enW}" aria-label="${enW ? `${esc(t)}: es la del widget` : `Poner ${esc(t)} en el widget`}">${ico(enW ? 'estrellaLlena' : 'estrella')}</button>
      <button class="crece" style="border:0;background:none;text-align:left;cursor:pointer;padding:0;color:inherit" data-act="${accion}" data-v="${esc(id)}"><span class="nombre">${esc(t)}</span><span class="meta">${esc(m)}${enW ? ' · en el widget' : ''}</span></button>
      <button class="icono-btn activo" data-act="empezarfav" data-v="${esc(id)}" aria-label="Empezar ${esc(t)}">${ico('play')}</button></div>`;
  const filas = (cfg.app.coreFav ? [filaFav('', 'Rutina de core', coreResumen().meta, !wf, 'vercore')] : [])
    .concat(lista.map(f => filaFav(f.name, f.name, favResumen(f).meta, wf === f.name, 'verfav')));
  return `<div class="pantalla">
    <div class="fila-titulo"><h1 class="titulo-pantalla">${esc(cap1(hoyD.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })))}</h1><span class="origen meta">${ico('racha')}Racha: ${st.streak ? plural(st.streak, 'día', 'días') : '—'}</span></div>
    <section class="hoy ${st.today ? 'hecha' : ''}" aria-labelledby="hoy-t">
      <div class="fila-titulo"><span class="etiqueta">${st.today ? 'Hoy ya has entrenado' : 'Hoy'}</span>${hoy.tipo === 'fav' ? origen('estrella', 'Favorita') : origen('entrenar', 'Rutina de core')}</div>
      <h2 id="hoy-t">${esc(hoy.titulo)}</h2>
      <p class="meta">${esc(hoy.meta)}</p>
      <button class="btn btn-grande" data-act="empezarhoy">${ico('play')}${st.today ? 'Hacer otra' : 'Empezar'}</button>
      <button class="btn btn-texto hoy-ver" data-act="verhoy">Ver la sesión ${ico('chev')}</button>
    </section>
    <section class="seccion" aria-labelledby="sem-t">
      <div class="fila-titulo"><h2 id="sem-t">Esta semana</h2><span class="meta">${plural(st.total, 'día hecho', 'días hechos')} en total</span></div>
      <div class="semana" role="list">${semana}</div>
    </section>
    <section class="seccion" aria-labelledby="fav-t">
      <h2 id="fav-t">Favoritas</h2>
      ${filas.length ? `<div class="lista">${filas.join('')}</div><p class="meta">Con ★ eliges la que hace el widget y la que sale en Hoy.</p>`
        : '<p class="meta">Cuando guardes una sesión como favorita, sale aquí y la empiezas con un toque.</p>'}
    </section>
    <section class="seccion"><h2 class="h2">Otra sesión</h2>
      <div class="lista">
        ${item({ t: 'Sesión nueva', m: 'Elige ejercicios, repeticiones y rondas', act: 'nueva', icono: 'mas' })}
        ${item({ t: 'Rutina de core', m: 'Base de core y módulos de fuerza', go: 'core', icono: 'entrenar' })}
      </div>
    </section>
  </div>`; } };

const MAT_TXT = () => { const m = [cfg.gomas && 'bandas grandes', cfg.banda && 'mini banda', cfg.mancuernas && 'mancuernas'].filter(Boolean); return m.length ? cap1(m.join(', ')) : 'Sin material'; };
P.core = { titulo: 'Rutina de core', render: () => {
  const am = activeModules(cfg, lastDay), pasos = corePasos(), nd = lastDay === 'A' ? 'B' : 'A';
  const base = [...D.base, ...D.close].map(s => D.exercises[(s.variants ? s.variants[s.variants.length - 1] : s).ex].name.toLowerCase());
  const r1 = pasos.filter(s => s.r === 1 && !s.prep && !s.rest);
  return `${cab('Rutina de core')}
  <div class="pantalla">
    <p class="meta">Siempre: ${esc(base.join(', '))}. Con los módulos que actives, más fuerza.</p>
    <div class="lista"><label class="item" for="core-auto"><span class="crece"><span class="nombre">Alternar día A y día B</span><span class="meta">${cfg.auto ? `Hoy toca el día ${nd}: ${esc(D.modules.filter(m => m.day === nd).map(m => m.name).join(' + '))}` : 'Día A = Abdomen + Pecho · día B = Espalda + Brazos + Glúteo'}</span></span>${inter('core-auto', cfg.auto, 'Alternar día A y día B')}</label></div>
    <section class="seccion"><h2>Módulos de fuerza</h2>${cfg.auto ? '<p class="meta">Los elige la alternancia. Quítala para elegirlos tú.</p>' : ''}
      <div class="lista">${D.modules.map(m => { const on = am.some(x => x.key === m.key); return `<div style="padding:var(--e3) var(--e4);display:flex;flex-direction:column;gap:var(--e2)"><label class="fila" for="mod-${m.key}"><span class="crece"><span class="nombre" style="font-weight:700">${esc(m.name)}</span> <span class="meta">· día ${m.day}</span></span>${inter('mod-' + m.key, on, m.name, cfg.auto)}</label>${on ? seg('nivel.' + m.key, LV.map(l => [l, INT[l]]), cfg.lv[m.key], 'Nivel de ' + m.name) : ''}</div>`; }).join('')}</div>
      <p class="meta">Cada módulo sube o baja de nivel solo según lo que marques al terminar.</p>
    </section>
    <div class="lista">
      <div class="item" style="cursor:default"><span class="crece"><span class="nombre">Rondas</span></span>${paso('core.rondas', cfg.rounds, 'Rondas', 'Una ronda menos', 'Una ronda más')}</div>
      <label class="item" for="core-taper"><span class="crece"><span class="nombre">Menos repeticiones en cada ronda</span><span class="meta">Para días con poco tiempo: módulos al 100 %, 80 % y 60 %</span></span>${inter('core-taper', cfg.taper, 'Menos repeticiones en cada ronda')}</label>
    </div>
    <section class="seccion"><div class="fila-titulo"><h2>Cada ronda</h2><span class="meta">${plural(r1.length, 'serie', 'series')}</span></div>
      <div class="lista">${r1.map(s => `<button class="item" data-act="ficha" data-v="${s.k}"><span style="width:88px;flex:none">${fig(s.k)}</span><span class="crece"><span class="nombre">${esc(s.name)}</span><span class="meta">${esc(s.reps ? s.reps + ' reps' : s.s + ' s')}${s.side ? ' · ' + esc(s.side.toLowerCase()) : ''}</span></span>${ico('chev', 'chev')}</button>`).join('')}</div>
      <p class="meta">Con tu material: ${esc(MAT_TXT())}. Se cambia en Tú → Material.</p></section>
    <button class="btn btn-principal btn-grande" data-act="empezarcore">${ico('play')}Empezar · ${minTxt(totalOf(pasos))}</button>
    <button class="btn btn-texto" data-act="corefav">${ico(cfg.app.coreFav ? 'estrellaLlena' : 'estrella')}${cfg.app.coreFav ? 'Está en favoritas (quitar)' : 'Guardar como favorita'}</button>
  </div>`; } };

P.nueva = { titulo: 'Sesión nueva', render: () => {
  const sel = fr.sel, alt = isAlt(fr), pasos = buildFree(fr);
  return `${cab(S.favEdit ? S.favEdit : 'Sesión nueva')}
  <div class="pantalla">
    <section class="seccion"><div class="fila-titulo"><h2>Ejercicios</h2><span class="meta">${sel.length ? (alt ? 'Alternados, en este orden' : 'En este orden') : ''}</span></div>
      ${sel.length ? `<div class="lista">${sel.map((it, i) => { const ex = D.exercises[it.k], hold = isHoldEx(it.k), c = catOf(it.k);
        return `<div class="fila-sel">${alt ? `<span class="letra-ab" aria-hidden="true">${String.fromCharCode(65 + i)}</span>` : ''}<span class="crece"><span class="nombre">${esc(ex.name)}</span><span class="meta">${hold ? 'segundos' : 'repeticiones'}${c.sides ? ' por lado' : ''}</span>
          ${usesBand(it.k) ? `<button class="chip" style="align-self:flex-start;margin-top:var(--e1)" data-act="hojabanda" data-v="${it.k}">${ico('banda')}${esc(bandOf(it.k) || 'Elegir banda')}</button>` : ''}</span>
          ${paso('n.' + i, hold ? it.n + ' s' : it.n, (hold ? 'Segundos de ' : 'Repeticiones de ') + ex.name, hold ? '5 segundos menos' : 'Una repetición menos', hold ? '5 segundos más' : 'Una repetición más')}
          <button class="icono-btn" data-act="quitar" data-v="${i}" aria-label="Quitar ${esc(ex.name)}">${ico('cerrar')}</button></div>`; }).join('')}</div>`
        : '<p class="meta">Aún no hay ninguno. Añade uno o varios del catálogo.</p>'}
      <button class="btn btn-secundario" data-go="elegir">${ico('mas')}Añadir ejercicios</button>
    </section>
    <div class="lista">
      <div class="item" style="cursor:default"><span class="crece"><span class="nombre">${alt ? 'Rondas' : 'Series de cada uno'}</span></span>${paso('f.rondas', fr.rounds, alt ? 'Rondas' : 'Series', 'Una menos', 'Una más')}</div>
      <div class="item" style="cursor:default"><span class="crece"><span class="nombre">Descanso</span></span>${paso('f.desc', fr.rest + ' s', 'Descanso', '15 segundos menos', '15 segundos más')}</div>
      <label class="item" for="f-alt"><span class="crece"><span class="nombre">Alternados</span><span class="meta">${sel.length > 1 ? (fr.alt ? 'A, B, descanso y otra ronda' : 'Todas las series de uno y luego el siguiente') : 'Con uno solo, series normales'}</span></span>${inter('f-alt', fr.alt, 'Alternados', sel.length < 2)}</label>
    </div>
    <button class="btn btn-principal btn-grande" data-act="empezarnueva" ${sel.length ? '' : 'disabled'}>${ico('play')}Empezar${sel.length ? ' · ' + minTxt(totalOf(pasos)) : ''}</button>
    ${S.favEdit ? `<button class="btn btn-secundario" data-act="guardarcambios" ${sel.length ? '' : 'disabled'}>${ico('estrellaLlena')}Guardar cambios en la favorita</button>
      <button class="btn btn-texto" data-act="hoja" data-v="borrarfav" style="color:var(--error)">${ico('papelera')}Borrar la favorita</button>`
      : `<button class="btn btn-texto" data-act="hoja" data-v="guardarfav" ${sel.length ? '' : 'disabled'}>${ico('estrella')}Guardar como favorita</button>`}
  </div>`; } };

/* Filtros de zona y material (Ejercicios y Elegir) */
const filtros = () => `
  <div class="chips" role="group" aria-label="Zona">${D.catalog.zones.map(z => `<button class="chip" data-act="zona" data-v="${esc(z)}" aria-pressed="${S.zona === z}">${esc(z)}</button>`).join('')}</div>
  <div class="chips" role="group" aria-label="Material">${Object.entries(NEEDS()).filter(([k]) => k !== 'correas').map(([k, v]) => `<button class="chip" data-act="mat" data-v="${k || 'none'}" aria-pressed="${S.mat === (k || 'none')}">${esc(v)}</button>`).join('')}</div>`;
const filtrar = () => Object.keys(D.exercises).filter(k => { const c = catOf(k); if (c.needs === 'correas') return false;
  return (!S.zona || c.zone === S.zona) && (!S.mat || (S.mat === 'none' ? !c.needs : c.needs === S.mat)); })
  .sort((a, b) => D.exercises[a].name.localeCompare(D.exercises[b].name, 'es'));

P.elegir = { titulo: 'Elegir ejercicios', render: () => { const l = filtrar(), n = fr.sel.length; return `${cab('Elegir ejercicios')}
  <div class="pantalla">
    <div class="pila">${filtros()}</div>
    <p class="meta" aria-live="polite">${plural(l.length, 'ejercicio', 'ejercicios')}</p>
    <div class="rejilla">${l.map(k => { const on = fr.sel.some(it => it.k === k), ex = D.exercises[k]; return `<button class="miniatura" data-act="elegir" data-v="${k}" aria-pressed="${on}">${fig(k)}<span class="check" aria-hidden="true">${on ? ico('check') : ''}</span><span class="nombre">${esc(ex.name)}</span><span class="meta">${esc(NEEDS()[catOf(k).needs || ''])}</span></button>`; }).join('') || '<p class="meta">Ninguno con estos filtros. Quita alguno.</p>'}</div>
  </div>
  <div style="padding:var(--e3) var(--e4);border-top:1px solid var(--linea);background:var(--capa)"><button class="btn btn-principal btn-grande" data-act="atras">${n ? `Listo · ${plural(n, 'ejercicio', 'ejercicios')}` : 'Volver'}</button></div>`; } };

P.ejercicios = { render: () => { const l = filtrar(); return `
  <div class="pantalla">
    <h1 class="titulo-pantalla">Ejercicios</h1>
    <div class="pila">${filtros()}</div>
    <p class="meta" aria-live="polite">${plural(l.length, 'ejercicio', 'ejercicios')}</p>
    <div class="rejilla">${l.map(k => `<button class="miniatura" data-act="ficha" data-v="${k}">${fig(k)}<span class="nombre">${esc(D.exercises[k].name)}</span><span class="meta">${esc(dosisDe(k))}</span></button>`).join('') || '<p class="meta">Ninguno con estos filtros. Quita alguno.</p>'}</div>
  </div>`; } };

/* Ficha: el movimiento entero, los pasos, las claves, la dosis, el material, vídeos y tus marcas */
P.ficha = { render: () => { const k = S.ex, ex = D.exercises[k], c = catOf(k), m = exSummary(historyList()).find(e => e.k === k), w = store.weights()[k];
  const pasos = []; ex.phases.forEach(ph => { if (ph.cap && !pasos.includes(ph.cap)) pasos.push(ph.cap); });
  return `${cab(ex.name)}
  <div class="pantalla">
    ${fig(k, 'grande')}
    <div class="fila envuelve"><span class="estado neutro">${esc(c.zone || '')}</span><span class="estado neutro">${esc(NEEDS()[c.needs || ''])}</span>${c.sides ? '<span class="estado neutro">Por lado</span>' : ''}</div>
    <div class="pila"><span class="etiqueta">Dosis orientativa</span><p class="h2">${esc(ex.info || dosisDe(k))}</p>${c.kg ? `<p class="meta">${esc(kgRange(c.kg))}</p>` : ''}</div>
    ${pasos.length > 1 ? `<section class="seccion"><h2>Movimiento</h2><ol class="pila" style="margin:0;padding-left:1.4em">${pasos.map(t => `<li>${esc(t)}</li>`).join('')}</ol></section>` : ''}
    <section class="seccion"><h2>Claves</h2><ul class="pila" style="margin:0;padding-left:1.4em">${ex.cues.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>
    <section class="seccion"><h2>Tus marcas</h2>
      ${m ? `<div class="lista"><div class="item" style="cursor:default"><span class="crece"><span class="meta">Última vez · ${esc(dayShort(m.last))}</span><span class="nombre">${esc(lastTxt(m))}</span></span></div>
        <div class="item" style="cursor:default"><span class="crece"><span class="meta">Mejor · ${esc(dayShort(m.bestAt))}</span><span class="nombre">${esc(bestTxt(m))}</span></span></div></div>`
        : '<p class="meta">Aún no lo has hecho. Cuando lo hagas, aquí verás la última vez y tu mejor marca.</p>'}
      ${w != null ? `<p class="meta">Últimos kilos usados: ${fkg(w)} kg</p>` : ''}${usesBand(k) && bandOf(k) ? `<p class="meta">Tu banda: ${esc(bandOf(k))}</p>` : ''}
    </section>
    <a class="btn btn-texto" href="https://www.youtube.com/results?search_query=${encodeURIComponent(ex.vid || ex.name)}" target="_blank" rel="noopener" aria-label="Ver vídeos de ${esc(ex.name)} en YouTube (se abre fuera de la app)">${ico('externo')}Ver vídeos en YouTube</a>
    <button class="btn btn-principal btn-grande" data-act="anadir" data-v="${k}">${ico('mas')}${fr.sel.some(it => it.k === k) ? 'Ya está en tu sesión: abrirla' : 'Añadir a una sesión'}</button>
  </div>`; } };

/* Historial: sesiones por días (de la app y del widget; las paradas a mitad, «Incompleta»), detalle y marcas por ejercicio */
P.historial = { render: () => { const h = historyList(), n = S.hver || 30;
  if (!h.length) return `<div class="pantalla"><h1 class="titulo-pantalla">Historial</h1>
    <div class="tarjeta"><h2 class="h2">Aquí saldrán tus sesiones</h2><p>Cada sesión que termines, desde la app o el widget, se guarda con sus series, kilos y bandas. Si paras a mitad, también, como incompleta.</p><button class="btn btn-secundario" data-go="copia">${ico('subir')}Importar una copia</button></div></div>`;
  const dias = []; h.slice(0, n).forEach(o => { const k = dayKey(o.start); if (!dias.length || dias[dias.length - 1].k !== k) dias.push({ k, t: dayLong(o.start), s: [] }); dias[dias.length - 1].s.push(o); });
  return `<div class="pantalla">
    <div class="fila-titulo"><h1 class="titulo-pantalla">Historial</h1><button class="btn btn-texto" data-go="marcas">Por ejercicio</button></div>
    <p class="meta">${plural(h.length, 'sesión', 'sesiones')} desde el ${esc(dayShort(h[h.length - 1].start))}</p>
    ${dias.map(d => `<section class="seccion"><h2 class="etiqueta">${esc(d.t)}</h2><div class="lista">${d.s.map(o => `<button class="item" data-act="det" data-v="${esc(o.id)}">
      <span class="item-icono">${ico(o.src === 'widget' ? 'widget' : 'entrenar')}</span>
      <span class="crece"><span class="nombre">${esc(o.title || (o.type === 'sueltos' ? 'Ejercicios sueltos' : 'Rutina'))}</span>
        <span class="meta">${esc([hhmm(o.start), durTxt(o.end - o.start), plural(o.sets.length, 'serie', 'series'), o.src === 'widget' ? 'desde el widget' : ''].filter(Boolean).join(' · '))}</span>
        ${o.complete ? '' : '<span class="estado neutro" style="align-self:flex-start;margin-top:2px">Incompleta</span>'}</span>${ico('chev', 'chev')}</button>`).join('')}</div></section>`).join('')}
    ${h.length > n ? '<button class="btn btn-secundario" data-act="hmas">Ver más</button>' : ''}
  </div>`; } };

P.detalle = { render: () => { const o = historyList().find(x => x.id === S.det); if (!o) return `${cab('Sesión')}<div class="pantalla"><p>No se encuentra la sesión.</p></div>`;
  const g = new Map(); o.sets.forEach(x => { if (!g.has(x.k)) g.set(x.k, []); g.get(x.k).push(x); });
  const W = o.type === 'sueltos' ? 'Serie' : 'Ronda', kg = o.sets.some(x => x.kg != null), bd = o.sets.some(x => x.band);
  return `${cab(dayLong(o.start))}
  <div class="pantalla">
    <div class="pila"><h1 class="titulo-pantalla">${esc(o.title || 'Sesión')}</h1>
      <p class="meta">${hhmm(o.start)} – ${hhmm(o.end)} · ${durTxt(o.end - o.start)} · ${plural(o.sets.length, 'serie', 'series')} · ${o.type === 'sueltos' ? 'Ejercicios sueltos' : 'Rutina de core'}${o.src === 'widget' ? ' · desde el widget' : ''}</p>
      ${o.complete ? '' : '<span class="estado neutro" style="align-self:flex-start">Incompleta · no cuenta para la racha</span>'}</div>
    ${[...g.values()].map(l => `<section class="seccion"><h2>${esc(l[0].name)}</h2><div style="overflow-x:auto" tabindex="0" role="region" aria-label="Series de ${esc(l[0].name)}"><table class="tabla"><thead><tr><th>Hora</th><th>${W}</th><th class="n">Hecho</th>${kg ? '<th class="n">Kilos</th>' : ''}${bd ? '<th>Banda</th>' : ''}</tr></thead><tbody>
      ${l.map(x => `<tr><td>${hhmm(x.start)}</td><td>${x.r}${x.side ? ' · ' + esc(x.side.toLowerCase()) : ''}</td><td class="n">${esc(doseOf(x))}${x.skipped ? ' <span class="meta">(saltada)</span>' : ''}</td>${kg ? `<td class="n">${x.kg != null ? fkg(x.kg) : '–'}</td>` : ''}${bd ? `<td>${esc(x.band || '–')}</td>` : ''}</tr>`).join('')}</tbody></table></div></section>`).join('')}
    ${o.fb && Object.keys(o.fb).length ? `<section class="seccion"><h2>Cómo te fue</h2><p>${esc(Object.entries(o.fb).map(([k, v]) => { const m = D.modules.find(x => x.key === k); return (m ? m.name : k) + ': ' + FBT[v]; }).join(' · '))}</p></section>` : ''}
  </div>`; } };

P.marcas = { render: () => { const l = exSummary(historyList()); return `${cab('Por ejercicio')}
  <div class="pantalla"><p class="meta">La última vez y la mejor (la de más kilos; sin kilos, la de más repeticiones o segundos).</p>
  ${l.length ? `<div class="lista">${l.map(e => `<button class="item" data-act="ficha" data-v="${e.k}"><span class="crece"><span class="nombre">${esc(e.name)}</span><span class="meta">Última · ${esc(dayShort(e.last))}: ${esc(lastTxt(e))}</span><span class="meta">Mejor · ${esc(dayShort(e.bestAt))}: ${esc(bestTxt(e))}</span></span>${ico('chev', 'chev')}</button>`).join('')}</div>` : '<p>Aún no hay series guardadas.</p>'}</div>`; } };

/* ---------- Tú: cuenta y ajustes ---------- */
function nube() { try { return A && A.cloudState ? JSON.parse(A.cloudState()) : null; } catch (e) { return null; } }
function nubeTxt(st) { const i = [];
  if (st.busy) i.push('Sincronizando…'); else if (st.lastSync) i.push('Sincronizado el ' + dayShort(st.lastSync) + ' a las ' + hhmm(st.lastSync));
  if (st.pending) i.push(plural(st.pending, 'sesión sin subir', 'sesiones sin subir'));
  return [st.msg, ...i].filter(Boolean).join(' · '); }
P.tu = { render: () => { const st = nube(), wf = widgetFav();
  return `<div class="pantalla">
    <h1 class="titulo-pantalla">Tú</h1>
    <section class="seccion"><h2 class="etiqueta">Cuenta</h2>
      ${!st ? '<p class="meta">La cuenta solo funciona en la app del móvil.</p>'
        : st.signedIn ? `<div class="lista"><div class="item" style="cursor:default"><span class="item-icono">${ico('correo')}</span><span class="crece"><span class="nombre" style="overflow-wrap:anywhere">${esc(st.email)}</span><span class="meta">Tus datos se guardan en la nube y se sincronizan al terminar cada sesión y al abrir la app</span></span></div>
          <button class="item" data-act="sincronizar" ${st.busy ? 'disabled' : ''}><span class="item-icono">${ico('reintentar')}</span><span class="crece"><span class="nombre">Sincronizar ahora</span><span class="meta" aria-live="polite">${esc(nubeTxt(st))}</span></span></button>
          <button class="item" data-act="hoja" data-v="salir"><span class="item-icono">${ico('salir')}</span><span class="crece"><span class="nombre">Salir</span><span class="meta">Tus datos se quedan en este móvil</span></span></button></div>`
        : `<div class="lista">${item({ t: 'Entrar', m: 'Para no perder nada y tenerlo también en otro móvil', go: 'entrar', icono: 'correo' })}</div>`}
    </section>
    <section class="seccion"><h2 class="etiqueta">Ajustes</h2><div class="lista">
      ${item({ t: 'Material', m: MAT_TXT(), go: 'material', icono: 'mancuerna' })}
      ${item({ t: 'Mis bandas', m: BANDS.join(', '), go: 'bandas', icono: 'banda' })}
      ${item({ t: 'Sonido y voz', m: [cfg.app.tonos && 'Tonos', cfg.count && 'cuenta en voz alta', cfg.app.mitad && 'aviso a la mitad'].filter(Boolean).join(', ') || 'Solo la voz con el nombre', go: 'sonido', icono: 'sonido' })}
      ${item({ t: 'Figura', m: cfg.app.fig === 'f' ? 'Mujer' : 'Hombre', go: 'figura', icono: 'figura' })}
      ${item({ t: 'Widget', m: wf && favs().some(f => f.name === wf) ? 'Favorita: ' + wf : 'Rutina de core', go: 'widgetconf', icono: 'widget' })}
      ${item({ t: 'Copia de seguridad', m: st && st.signedIn ? 'En la nube · también a un archivo' : 'A un archivo: exportar e importar', go: 'copia', icono: 'nube' })}
    </div></section>
  </div>`; } };

P.entrar = { sinPestanas: true, render: () => `${cab('Entrar')}
  <div class="pantalla">
    <div class="pila" style="gap:var(--e3)"><h1 class="titulo-pantalla">Rutina core</h1><p>Entra con tu email para guardar tus sesiones en la nube y tenerlas en otro móvil. Te llega un código, sin contraseña.</p></div>
    ${S.codigo ? `<form class="pila" style="gap:var(--e4)" data-form="codigo">
      <p>Código enviado a <strong style="overflow-wrap:anywhere">${esc(S.email)}</strong>. Si no llega en 2 minutos, mira en spam.</p>
      <div class="campo"><label for="codigo">Código del email</label><input id="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="10" required style="font-size:var(--t4);letter-spacing:.3em;text-align:center"></div>
      <button class="btn btn-principal btn-grande" type="submit" ${S.enviando ? 'disabled' : ''}>Entrar</button>
      <button class="btn btn-texto" type="button" data-act="otrocodigo">Enviar otro código o cambiar el email</button>
    </form>` : `<form class="pila" style="gap:var(--e4)" data-form="email">
      <div class="campo"><label for="email">Email</label><input id="email" type="email" autocomplete="email" inputmode="email" value="${esc(S.email || '')}" required></div>
      <button class="btn btn-principal btn-grande" type="submit" ${S.enviando ? 'disabled' : ''}>Enviarme un código</button>
    </form>`}
    <p class="mensaje ${S.nubeOk === false ? 'error' : ''}" role="status" aria-live="polite">${esc(S.nubeMsg || '')}</p>
    <button class="btn btn-texto" data-act="atras">Seguir sin cuenta</button>
    <p class="meta">Sin cuenta, todo se queda solo en este móvil. Puedes entrar más tarde desde Tú.</p>
  </div>` };

P.material = { render: () => `${cab('Material')}
  <div class="pantalla"><p class="meta">Cada ejercicio de la rutina de core sale en la versión para el material que tienes.</p>
  <div class="lista">${[['gomas', 'Bandas grandes', 'Bucles largos y cerrados, sin asas'], ['banda', 'Mini banda', 'El bucle pequeño por encima de las rodillas'], ['mancuernas', 'Mancuernas', '']].map(([k, t, m]) => `<label class="item" for="m-${k}"><span class="crece"><span class="nombre">${t}</span>${m ? `<span class="meta">${m}</span>` : ''}</span>${inter('m-' + k, cfg[k], t)}</label>`).join('')}</div></div>` };

P.bandas = { render: () => `${cab('Mis bandas')}
  <div class="pantalla"><p class="meta">Ponles un nombre que las distinga (color o dureza). La app recuerda cuál usas en cada ejercicio.</p>
  <div class="lista">${BANDS.map((b, i) => `<div class="item" style="cursor:default"><span class="item-icono">${ico('banda')}</span><div class="campo crece"><label class="oculto-visual" for="banda-${i}">Nombre de la banda ${i + 1}</label><input id="banda-${i}" data-banda="${i}" value="${esc(b)}" maxlength="30" autocomplete="off"></div>${BANDS.length > 1 ? `<button class="icono-btn" data-act="quitabanda" data-v="${i}" aria-label="Quitar ${esc(b)}">${ico('papelera')}</button>` : ''}</div>`).join('')}</div>
  ${BANDS.length < 8 ? `<button class="btn btn-secundario" data-act="nuevabanda">${ico('mas')}Añadir banda</button>` : ''}</div>` };

P.sonido = { render: () => `${cab('Sonido y voz')}
  <div class="pantalla"><div class="lista">
    <label class="item" for="s-tonos"><span class="crece"><span class="nombre">Tonos en cada repetición</span><span class="meta">Agudo al subir o empujar, grave al bajar</span></span>${inter('s-tonos', cfg.app.tonos, 'Tonos en cada repetición')}</label>
    <label class="item" for="s-count"><span class="crece"><span class="nombre">Contar en voz alta</span></span>${inter('s-count', cfg.count, 'Contar en voz alta')}</label>
    <label class="item" for="s-mitad"><span class="crece"><span class="nombre">Avisar a la mitad</span><span class="meta">En los ejercicios de mantener</span></span>${inter('s-mitad', cfg.app.mitad, 'Avisar a la mitad')}</label>
  </div>
  <p class="meta">La voz siempre dice el ejercicio en «Prepárate» y al empezar cada serie. La pantalla no se apaga durante la sesión.</p></div>` };

P.figura = { render: () => `${cab('Figura')}
  <div class="pantalla">
    <section class="seccion"><h2>Quién hace los ejercicios</h2>
      <div class="rejilla">${[['m', 'Hombre'], ['f', 'Mujer']].map(([g, t]) => `<button class="miniatura" data-act="figsexo" data-v="${g}" aria-pressed="${cfg.app.fig === g}">${fig('remo_incl_banda', 'mini', g)}<span class="check" aria-hidden="true">${cfg.app.fig === g ? ico('check') : ''}</span><span class="nombre">${t}</span></button>`).join('')}</div>
      <p class="meta">Es la misma figura en toda la app.</p></section>
    <section class="seccion"><h2>Vista previa</h2>${fig(S.figPrev || 'puente', 'grande')}
      <div class="chips" role="group" aria-label="Ejercicio de la vista previa">${['puente', 'plancha', 'remo_incl_banda', 'almeja'].filter(k => D.exercises[k]).map(k => `<button class="chip" data-act="figprev" data-v="${k}" aria-pressed="${(S.figPrev || 'puente') === k}">${esc(D.exercises[k].name)}</button>`).join('')}</div>
      <p class="meta">En grande salen la zona que trabaja (punto ámbar), la flecha del movimiento y la banda. En las miniaturas, solo la postura.${window.FIG && !window.FIG.tres() ? ' Este móvil no puede mostrar la figura 3D: sale la dibujada.' : ''}</p></section>
  </div>` };

P.widgetconf = { render: () => { const wf = widgetFav(), l = favs(), cur = wf && l.some(f => f.name === wf) ? wf : '';
  return `${cab('Widget')}
  <div class="pantalla"><p class="meta">Lo que empieza el widget al tocar Empezar, y lo que sale en Hoy. También se cambia desde el propio widget grande.</p>
  <div class="lista" role="radiogroup" aria-label="Qué hace el widget">${[['', 'Rutina de core', coreResumen().meta], ...l.map(f => [f.name, f.name, 'Favorita · ' + favResumen(f).meta])].map(([v, t, m]) => `<button class="item" data-act="widgetfav" data-v="${esc(v)}" role="radio" aria-checked="${cur === v}"><span class="crece"><span class="nombre">${esc(t)}</span><span class="meta">${esc(m)}</span></span>${cur === v ? ico('check', 'chev') : '<span style="width:20px"></span>'}</button>`).join('')}</div>
  ${l.length ? '' : '<p class="meta">Guarda una sesión como favorita para poder ponerla en el widget.</p>'}</div>`; } };

P.copia = { render: () => { const st = nube(); return `${cab('Copia de seguridad')}
  <div class="pantalla">
    ${st && st.signedIn ? `<div class="tarjeta"><div class="fila"><span class="item-icono">${ico('nube')}</span><span class="crece"><span class="nombre" style="font-weight:700">En la nube</span><span class="meta" style="display:block">${esc(nubeTxt(st) || 'Con tu cuenta')}</span></span></div><p class="meta">Con tu cuenta, cada sesión se guarda al terminar.</p></div>` : ''}
    <section class="seccion"><h2>A un archivo</h2><p class="meta">Historial, favoritas, bandas, pesos, ajustes y racha en un archivo JSON. Guárdalo en Drive o en el ordenador. Importar lo combina con lo que ya hay, sin duplicar ni borrar.</p>
    <button class="btn btn-secundario" data-act="exportar">${ico('bajar')}Exportar</button>
    <button class="btn btn-secundario" data-act="importar">${ico('subir')}Importar</button>
    <p class="mensaje ${S.copiaOk === false ? 'error' : ''}" role="status" aria-live="polite">${esc(S.copiaMsg || '')}</p></section>
  </div>`; } };

/* ---------- Reproductor ----------
   La figura ocupa la pantalla; abajo, donde no se pisa: clave, nombre, cantidad, línea pequeña, banda o kilos, rayas y «Luego».
   Repeticiones: no pasan solas. La app marca el ritmo (tonos, voz) y cuenta el tiempo hacia arriba; tocas al acabar.
   Segundos, «Prepárate» y descansos: cuenta atrás y pasan solos; tocar adelanta.
   Tocar = hecho, siguiente · deslizar a la derecha = anterior (a la izquierda = siguiente) · pausa = seguir, anterior o parar. */
let R = null;
const isEx = st => st && !st.prep && !st.rest;
function iniciar(tipo, pasos, titulo, favName) {
  if (!pasos.length) return;
  audioOn();
  R = { tipo, pasos, titulo, favName: favName || null, idx: 0, left: pasos[0].s, el: 0, pausa: false, last: performance.now(), cue: { ph: -1, rep: -1, half: false }, tick: 0, w: null, swipe: null, ignorar: false,
    mods: tipo === 'rutina' ? activeModules(cfg, lastDay) : [] };
  recStart(); S.pila = []; S.hoja = null;
  ir('reproductor', true);
  say(pasos[0].say);
  anunciar();
}
function anunciar() { const s = R.pasos[R.idx], el = document.getElementById('anuncio'); if (!el) return;
  el.textContent = s.prep ? `Prepárate: ${D.exercises[s.k].name}. Empieza en ${s.s} segundos` : s.rest ? `Descanso de ${s.s} segundos` : `${s.name}${s.sub ? '. ' + s.sub : ''}`; }
/* Cambio de paso: lo que se dice y suena (la voz dice el nombre al empezar cada serie, D3) */
function entrar(i) {
  R.idx = i; const s = R.pasos[i]; R.left = s.s; R.el = 0; R.cue = { ph: -1, rep: -1, half: false };
  if (s.rest || s.prep) { beep(520, .25); say(s.say); }
  else { const n = D.exercises[s.k].name; if (s.reps) say(cfg.count ? `${n}. ${D.numbers[0] || 'Uno'}` : `${n}. Empieza`); else { beep(988, .35); say(`${n}. Empieza`); } R.cue.rep = 0; }
  recTrack(); anunciar(); pintarRepro();
}
function siguiente(auto) {
  if (!R) return;
  const s = R.pasos[R.idx];
  if (isEx(s)) { recClose(auto === 'corte' ? 'corte' : 'hecho'); guardarKg(); }
  if (!cfg.app.visto) { cfg.app.visto = true; saveCfg(); }
  if (R.idx >= R.pasos.length - 1) return terminar();
  entrar(R.idx + 1);
}
function anterior() {
  if (!R) return;
  let j = -1; for (let i = R.idx - 1; i >= 0; i--) if (isEx(R.pasos[i])) { j = i; break; }
  if (j < 0) j = 0;
  if (rec) { rec.cur = null; rec.sets = rec.sets.filter(x => x.i < j); }
  entrar(j);
}
/* Sonido durante el ejercicio: tono agudo al subir, grave al bajar, cuenta en voz alta, «mitad» y pitidos finales */
function cues(st, before) {
  const ex = D.exercises[st.k];
  if (st.reps) {
    const el = R.el; if (el >= st.s) return;               // el ritmo guía acaba; espera al toque
    const k = phaseCount(ex, el); if (k !== R.cue.ph) { R.cue.ph = k; const ph = ex.phases[k % ex.phases.length]; if (ph.tone && cfg.app.tonos) beep(ph.tone === 'up' ? 880 : 440, .15); }
    const n = Math.floor(el / ex.rep); if (n !== R.cue.rep && n < st.reps) { R.cue.rep = n; if (cfg.count) say(n === st.reps - 1 ? 'Última' : (D.numbers[n] || String(n + 1))); }
    return;
  }
  const el = st.s - R.left;
  if (isEx(st) && cfg.app.mitad && !R.cue.half && st.s >= 10 && el >= st.s / 2) { R.cue.half = true; say('Mitad'); }
  const after = Math.ceil(R.left); if (after !== before && after <= 3 && after > 0) beep(740, .08);
}
function tick(now) {
  requestAnimationFrame(tick);
  if (!R || S.ruta !== 'reproductor') return;
  const dt = Math.min(0.5, (now - R.last) / 1000); R.last = now;
  if (R.pausa || S.hoja) return;
  const st = R.pasos[R.idx];
  if (isEx(st) && st.reps) { R.el += dt; recTrack(); cues(st); }
  else { const before = Math.ceil(R.left); R.left -= dt; R.el += dt; if (R.left <= 0) { siguiente('auto'); return; } cues(st, before); }
  if (now - R.tick > 200) { R.tick = now; textosRepro(); }
}
/* Instante de la figura del reproductor: en la serie va con el tiempo de la serie (los tonos y la figura coinciden) */
window.FIG_T = () => { if (!R) return null; const s = R.pasos[R.idx]; if (!isEx(s)) return null; return { t: s.reps ? R.el : s.s - R.left, clamp: !!s.hold }; };
window.FIG_FASE = st => { if (!R || !st || !st.phase) return; const s = R.pasos[R.idx]; if (!isEx(s)) return; const el = document.getElementById('r-clave'); if (el && el.textContent !== st.phase.cap) el.textContent = st.phase.cap || ''; };

function cantidadDe(s) {
  if (s.rest) return [`<span class="repro-cantidad acc">${mmss(R.left)}</span>`, 'Toca para seguir ya'];
  if (s.prep) return [`<span class="repro-cantidad acc">${Math.ceil(R.left)}</span>`, null];
  if (s.reps) { const ex = D.exercises[s.k], guia = Math.min(s.reps, Math.floor(R.el / ex.rep) + 1);
    return [`<span class="repro-cantidad">${s.reps}<span class="unidad">reps</span></span>`, `${R.el < s.s ? `Ritmo ${guia} de ${s.reps}` : 'Toca al acabar'} · ${mmss(R.el)}`]; }
  return [`<span class="repro-cantidad">${mmss(R.left)}</span>`, `de ${mmss(s.s)}${s.side ? ' · ' + s.side.toLowerCase() : ''}`];
}
function posDe(s) {
  const W = R.tipo === 'suelto' && !isAlt(fr) ? 'Serie' : 'Ronda', N = Math.max(...R.pasos.map(x => x.r));
  const ej = R.pasos.filter(x => x.r === s.r && isEx(x)), k = R.pasos.slice(0, R.idx + 1).filter(x => x.r === s.r && isEx(x)).length + (s.prep ? 1 : 0);
  return `${W} ${s.r} de ${N}` + (s.rest ? '' : ` · ejercicio ${Math.max(1, k)} de ${ej.length}`);
}
function rayas() {
  const g = new Map();
  R.pasos.forEach((p, i) => { if (p.prep) return; const r = p.rest ? p.r - 1 : p.r; if (!g.has(r)) g.set(r, []); g.get(r).push(i); });
  const cur = R.pasos[R.idx].prep ? R.idx + 1 : R.idx;
  return `<div class="rayas" aria-hidden="true">${[...g.values()].map(l => `<span class="grupo" style="--n:${l.length}">${l.map(i => `<i class="${i < cur ? 'hecho' : i === cur ? 'ahora' : ''} ${R.pasos[i].rest ? 'desc' : ''}"></i>`).join('')}</span>`).join('')}</div>`;
}
function luegoDe() {
  const s = R.pasos[R.idx], rest = R.pasos.slice(R.idx + 1), nx = rest.find(x => !x.prep);
  if (!nx) return 'Es el último';
  if (s.rest) return `Empiezas con: <strong>${esc(nx.name)}</strong>`;
  if (nx.rest && !s.prep) return `Luego: <strong>descanso de ${nx.s} s</strong>`;
  const e = rest.find(x => isEx(x) && R.pasos.indexOf(x) > (s.prep ? R.idx + 1 : R.idx));
  return e ? `Luego: <strong>${esc(e.name)}</strong>` : 'Es el último';
}
function chipsDe(s) {
  if (s.rest) return '';
  let h = '';
  if (usesBand(s.k)) h += `<button class="chip" data-act="hojabanda" data-v="${s.k}">${ico('banda')}${esc(bandOf(s.k) ? 'Banda: ' + bandOf(s.k) : 'Elegir banda')}</button>`;
  if (s.kg) h += `<button class="chip" data-act="hoja" data-v="kg">${ico('mancuerna')}${fkg(kgDe(s))} kg</button>`;
  return h ? `<div class="repro-chips">${h}</div>` : '';
}
function kgDe(s) { if (R.w && R.w.k === s.k) return R.w.v; const w = store.weights()[s.k]; return w != null ? w : s.kg[0]; }
function guardarKg() { if (R && R.w) { store.setWeight(R.w.k, R.w.v); } }
P.reproductor = { sinPestanas: true, render: () => {
  const s = R.pasos[R.idx], ex = D.exercises[s.k], desc = !!s.rest;
  const nx = R.pasos.slice(R.idx + 1).find(isEx), figK = desc ? (nx ? nx.k : s.k) : s.k;
  const [cant, abajo] = cantidadDe(s), fase = desc ? 'descanso' : s.prep ? 'prepara' : 'serie';
  const dosis = s.reps ? `${s.reps} reps` : `${s.s} s`, sigEx = R.pasos[R.idx + 1];
  return `<div class="repro ${fase}" data-act="tap" ${nx ? `data-luego="${nx.k}"` : ''}>
    <button class="oculto-visual" data-act="tap">${desc ? 'Terminar el descanso' : s.prep ? 'Empezar ya' : 'Hecho: pasar al siguiente'}</button>
    <div class="repro-figura">${fig(figK, desc ? 'sig' : 'libre')}
      <div class="repro-arriba"><button class="icono-btn redondo" data-act="pausa" aria-label="Pausa">${ico('pausa')}</button><span class="repro-pos">${esc(posDe(s))}</span></div>
    </div>
    <div class="repro-info">
      ${desc ? '<span class="aviso-fase">Descanso</span>' : s.prep ? `<span class="aviso-fase">Prepárate · ${esc(isEx(sigEx) ? (sigEx.reps ? sigEx.reps + ' reps' : sigEx.s + ' s') : '')}</span>` : `<p class="repro-clave" id="r-clave">${esc(ex.cues[0] || '')}</p>`}
      <div class="repro-linea"><h1 class="repro-nombre">${desc ? 'Respira' : esc(ex.name)}${!desc && s.side ? `<span class="meta" style="display:block;font-weight:400">${esc(s.side)}</span>` : ''}</h1><span id="r-cant">${cant}</span></div>
      ${abajo != null ? `<div class="repro-linea"><span class="repro-reloj" id="r-reloj">${esc(abajo)}</span></div>` : ''}
      ${chipsDe(s.prep ? R.pasos[R.idx + 1] || s : s)}
      ${rayas()}
      <p class="repro-luego">${luegoDe()}</p>
      ${!cfg.app.visto ? '<p class="repro-pista">Toca la pantalla al acabar · desliza a la derecha para volver</p>' : ''}
    </div>
  </div>`; } };
function textosRepro() {
  if (!R || S.ruta !== 'reproductor') return;
  const s = R.pasos[R.idx], [cant, abajo] = cantidadDe(s);
  const c = document.getElementById('r-cant'); if (c && c.innerHTML !== cant) c.innerHTML = cant;
  const a = document.getElementById('r-reloj'); if (a && abajo != null && a.textContent !== abajo) a.textContent = abajo;
}
function pintarRepro() { if (S.ruta === 'reproductor') pintar(false); }
function terminar() {
  recSave(true);
  const free = R.tipo === 'suelto';
  chime(); setTimeout(() => say((free ? 'Ejercicios terminados' : 'Rutina terminada') + '. Buen trabajo.'), 900);
  if (free) store.day(); else { store.done(cfg.rounds, dayType(R.mods)); lastDay = store.lastDay(); offset = store.sessions(); }
  R.fin = { titulo: R.titulo, series: lastRec ? lastRec.sets.length : 0, dur: lastRec ? lastRec.end - lastRec.start : 0, mods: R.mods, fb: {}, id: lastRecId, tipo: R.tipo, favName: R.favName };
  S.final = R.fin; R = null; S.hoja = null;
  ir('final', true);
}
function parar() { recSave(false); const n = lastRec ? lastRec.sets.length : 0; R = null; S.hoja = null; S.pila = []; ir('entrenar', true); toast(n ? `Guardada como incompleta (${plural(n, 'serie', 'series')})` : 'Parada. No se ha guardado: no llegaste a hacer ninguna serie'); }

/* Al terminar: cómo te ha ido cada módulo. Fácil = sube de nivel la próxima vez; demasiado = baja (como antes) */
P.final = { sinPestanas: true, render: () => { const f = S.final, st = store.stats(); return `
  <div class="pantalla">
    <div class="pila" style="align-items:flex-start;gap:var(--e3)">
      <span class="item-icono" style="width:56px;height:56px;background:var(--accion);color:var(--sobre-accion);border-radius:50%">${ico('check')}</span>
      <h1 class="titulo-pantalla">Sesión hecha</h1>
      <p class="h2" style="font-weight:400">${ico('racha').replace('<svg', '<svg style="width:20px;height:20px;vertical-align:-3px"')} Racha: ${plural(st.streak, 'día', 'días')}</p>
      <p class="meta">${esc(f.titulo)} · ${durTxt(f.dur)} · ${plural(f.series, 'serie', 'series')}</p>
    </div>
    ${f.mods.length ? `<section class="seccion"><h2>¿Cómo te ha ido?</h2><p class="meta">Las 2–3 últimas repeticiones de cada serie tienen que costar. La próxima vez cada módulo sube o baja de nivel.</p>
      ${f.mods.map(m => `<div class="pila"><span><strong>${esc(m.name)}</strong> <span class="meta">· hoy en ${INT[f.lv0 ? f.lv0[m.key] : cfg.lv[m.key]]}</span></span>${seg('fb.' + m.key, [['up', 'Fácil'], ['ok', 'Justo'], ['down', 'Demasiado']], f.fb[m.key] || '', 'Cómo te ha ido ' + m.name)}<span class="meta" aria-live="polite">${esc(fbTxt(f, m))}</span></div>`).join('')}</section>` : ''}
    <div class="lista"><div class="item" style="cursor:default"><span class="item-icono">${ico('reloj2')}</span><span class="crece"><span class="nombre">En el reloj Polar</span><span class="meta">Guarda la grabación como «Entrenamiento en circuito»</span></span></div></div>
    <button class="btn btn-principal btn-grande" data-act="finvolver">Guardar y volver</button>
    <button class="btn btn-texto" data-act="repetir">${ico('reintentar')}Repetir la sesión</button>
  </div>`; } };
function fbTxt(f, m) {
  const k = f.fb[m.key]; if (!k) return ''; const i = LV.indexOf(f.lv0[m.key]);
  return k === 'up' ? (i < 2 ? 'La próxima vez sube a ' + INT[LV[i + 1]] : 'Ya estás en Fuerte: añade una ronda') : k === 'down' ? (i > 0 ? 'La próxima vez baja a ' + INT[LV[i - 1]] : 'Ya estás en Suave: baja el rango o descansa más') : 'Se queda igual: es el nivel bueno';
}
function marcarFb(key, k) {
  const f = S.final; if (!f.lv0) f.lv0 = { ...cfg.lv };
  const i = LV.indexOf(f.lv0[key]); cfg.lv[key] = k === 'up' && i < 2 ? LV[i + 1] : k === 'down' && i > 0 ? LV[i - 1] : f.lv0[key];
  f.fb[key] = k; saveCfg(); if (f.id) store.setSessionFeedback(f.id, f.fb);
}

/* ---------- Historial: cada serie con su hora de inicio y fin (misma forma que History.kt y SessionRecorder) ---------- */
let rec = null, lastRecId = null, lastRec = null;
function recStart() {
  const free = R.tipo === 'suelto';
  rec = { id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8), v: 1, type: free ? 'sueltos' : 'rutina', src: 'app',
    title: free ? R.titulo : modsLabel(R.mods), day: free ? '' : dayType(R.mods), rounds: Math.max(...R.pasos.map(x => x.r)),
    start: Date.now(), tz: -new Date().getTimezoneOffset(), sets: [], cur: null };
}
/* Abre la serie cuando de verdad empieza */
function recTrack() { const st = R && R.pasos[R.idx]; if (rec && isEx(st) && (!rec.cur || rec.cur.i !== R.idx)) rec.cur = { i: R.idx, start: Date.now() }; }
/* Cierra la serie: «hecho» (tocas al acabar o se acaba el tiempo) o «corte» (paras a mitad). Si no llegó a 1 s, no se apunta */
function recClose(modo) {
  if (!rec || !rec.cur) return; const c = rec.cur, st = R.pasos[c.i]; rec.cur = null; if (!st) return;
  const ex = D.exercises[st.k], hold = !st.reps, el = hold ? Math.max(0, Math.min(st.s, st.s - R.left)) : R.el;
  if (el < 1) return;
  const skipped = hold ? st.s - el > 0.5 : modo === 'corte';
  let kg = null; if (st.kg) kg = kgDe(st);
  rec.sets.push({ k: st.k, name: ex.name, r: st.r, side: st.side || '', start: c.start, end: Date.now(),
    reps: hold ? 0 : (skipped ? Math.min(st.reps, Math.floor(el / ex.rep)) : st.reps), planReps: st.reps || 0,
    secs: hold ? (skipped ? Math.round(el) : st.s) : 0, planSecs: hold ? st.s : 0,
    kg, band: usesBand(st.k) ? bandOf(st.k) : null, mod: st.mod || null, skipped, i: c.i });
}
/* Guarda la sesión: terminada, o a medias si se hizo al menos una serie (no cuenta para la racha) */
function recSave(complete) {
  lastRecId = null; lastRec = null; if (!rec) return;
  if (!complete) recClose('corte');
  const o = { ...rec, end: Date.now(), complete, sets: rec.sets.map(({ i, ...x }) => x) }; delete o.cur; rec = null;
  lastRec = o; if (!o.sets.length) return; store.saveSession(o); lastRecId = o.id;
}

/* ---------- Hojas inferiores ---------- */
const HOJAS = {
  pausa: () => `<h2 class="h2">En pausa</h2><button class="btn btn-principal btn-grande" data-act="cerrar">${ico('play')}Seguir</button><button class="btn btn-secundario" data-act="anterior">${ico('atras')}Ejercicio anterior</button><button class="btn btn-texto" data-act="hoja" data-v="parar">${ico('parar')}Parar la sesión</button>`,
  parar: () => `<h2 class="h2">¿Parar la sesión?</h2><p>Se guarda como incompleta con las series hechas. No cuenta para la racha.</p><button class="btn btn-peligro btn-grande" data-act="pararya">${ico('parar')}Parar y guardar</button><button class="btn btn-principal btn-grande" data-act="cerrar">Seguir entrenando</button>`,
  banda: () => { const k = S.hojaDe, cur = bandOf(k); return `<h2 class="h2">¿Qué banda llevas?</h2><p class="meta">${esc(D.exercises[k].name)}. La próxima vez sale la que elijas.</p><div class="lista">${BANDS.map(b => `<button class="item" data-act="ponbanda" data-v="${esc(b)}" role="radio" aria-checked="${b === cur}"><span class="item-icono">${ico('banda')}</span><span class="crece"><span class="nombre">${esc(b)}</span></span>${b === cur ? ico('check', 'chev') : '<span style="width:20px"></span>'}</button>`).join('')}</div><p class="meta">Los nombres se cambian en Tú → Mis bandas.</p>`; },
  kg: () => { const s = R.pasos[R.idx].prep ? R.pasos[R.idx + 1] : R.pasos[R.idx]; return `<h2 class="h2">Kilos de ${esc(D.exercises[s.k].name)}</h2><div class="fila"><span class="crece meta">Orientativo: ${esc(kgRange(s.kg))}</span>${paso('kg', fkg(kgDe(s)) + ' kg', 'Kilos', 'Medio kilo menos', 'Medio kilo más')}</div><p class="meta">Se recuerda para la próxima vez.</p><button class="btn btn-principal btn-grande" data-act="cerrar">Listo</button>`; },
  guardarfav: () => `<h2 class="h2">Guardar como favorita</h2><form class="pila" style="gap:var(--e4)" data-form="fav"><div class="campo"><label for="fav-n">Nombre</label><input id="fav-n" maxlength="40" autocomplete="off" placeholder="${esc(autoName(fr))}"></div><button class="btn btn-principal btn-grande" type="submit">${ico('estrella')}Guardar</button></form>`,
  salir: () => `<h2 class="h2">¿Salir de la cuenta?</h2><p>Tus datos se quedan en este móvil. Si queda algo sin subir, se sube antes.</p><button class="btn btn-peligro btn-grande" data-act="salirya">${ico('salir')}Salir</button><button class="btn btn-principal btn-grande" data-act="cerrar">Seguir con la cuenta</button>`,
  borrarfav: () => `<h2 class="h2">¿Borrar «${esc(S.favEdit)}»?</h2><p>Se quita de favoritas${widgetFav() === S.favEdit ? ' y el widget vuelve a la rutina de core' : ''}. Tu historial no cambia.</p><button class="btn btn-peligro btn-grande" data-act="borrarya">${ico('papelera')}Borrar</button><button class="btn btn-principal btn-grande" data-act="cerrar">No borrar</button>`,
};

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

/* ---------- Acciones ---------- */
function abrirFav(name) { const f = favs().find(x => x.name === name); if (!f) return; const n = normFree(f); fr = { ...fr, sel: n.sel, rounds: n.rounds, rest: n.rest, alt: n.alt }; saveFree(); S.favEdit = name; ir('nueva'); }
function empezarFav(name) {
  if (!name) return iniciar('rutina', corePasos(), 'Rutina de core');
  const f = favs().find(x => x.name === name); if (!f) return; const n = normFree(f);
  fr = { ...fr, sel: n.sel, rounds: n.rounds, rest: n.rest, alt: n.alt }; saveFree();
  iniciar('suelto', buildFree(fr), f.name, f.name);
}
function cambiar(k, d) {
  if (k === 'core.rondas') { cfg.rounds = lim(cfg.rounds + d, 1, 6); saveCfg(); }
  else if (k === 'f.rondas') { fr.rounds = lim(fr.rounds + d, 1, 10); saveFree(); }
  else if (k === 'f.desc') { fr.rest = lim(fr.rest + d * 15, 15, 180); saveFree(); }
  else if (k.startsWith('n.')) { const it = fr.sel[+k.slice(2)]; if (it) { it.n = clampN(it.k, it.n + d * (isHoldEx(it.k) ? 5 : 1)); saveFree(); } }
  else if (k === 'kg') { const s = R.pasos[R.idx].prep ? R.pasos[R.idx + 1] : R.pasos[R.idx]; R.w = { k: s.k, v: lim(kgDe(s) + d * 0.5, 0.5, 60) }; guardarKg(); }
}
const ACC = {
  tab: b => { S.pila = []; S.favEdit = null; ir(b.dataset.v, true); return 'nav'; },
  atras: () => { atras(); return 'nav'; },
  mas: b => cambiar(b.dataset.k, 1), menos: b => cambiar(b.dataset.k, -1),
  seg: b => { const k = b.dataset.k, v = b.dataset.v;
    if (k.startsWith('nivel.')) { cfg.lv[k.slice(6)] = v; saveCfg(); }
    else if (k.startsWith('fb.')) marcarFb(k.slice(3), v); },
  sw: b => { const k = b.dataset.k, on = b.checked;
    if (k === 'core-auto') cfg.auto = on; else if (k === 'core-taper') cfg.taper = on;
    else if (k.startsWith('mod-')) cfg.mods[k.slice(4)] = on;
    else if (k === 'f-alt') { fr.alt = on; saveFree(); return; }
    else if (k.startsWith('m-')) cfg[k.slice(2)] = on;
    else if (k === 's-tonos') cfg.app.tonos = on; else if (k === 's-mitad') cfg.app.mitad = on; else if (k === 's-count') cfg.count = on;
    saveCfg(); },
  zona: b => { S.zona = S.zona === b.dataset.v ? '' : b.dataset.v; },
  mat: b => { S.mat = S.mat === b.dataset.v ? '' : b.dataset.v; },
  elegir: b => { const k = b.dataset.v, i = fr.sel.findIndex(it => it.k === k); if (i >= 0) fr.sel.splice(i, 1); else fr.sel.push({ k, n: defN(k) }); saveFree(); },
  quitar: b => { fr.sel.splice(+b.dataset.v, 1); saveFree(); },
  nueva: () => { S.favEdit = null; ir('nueva'); return 'nav'; },
  ficha: b => { S.ex = b.dataset.v; ir('ficha'); return 'nav'; },
  anadir: b => { const k = b.dataset.v; if (!fr.sel.some(it => it.k === k)) { fr.sel.push({ k, n: defN(k) }); saveFree(); toast('Añadido a la sesión'); } S.favEdit = null; ir('nueva'); return 'nav'; },
  widgetfav: b => { const name = b.dataset.v, ya = widgetFav() === name;
    if (!name) { store.setFree('free.widgetFav', ''); toast('El widget hace la rutina de core'); return 'nada'; }
    store.setFree('free.widgetFav', ya ? '' : name); toast(ya ? 'El widget vuelve a la rutina de core' : `«${name}» sale en el widget y en Hoy`); return 'nada'; },
  verfav: b => { abrirFav(b.dataset.v); return 'nav'; }, vercore: () => { ir('core'); return 'nav'; },
  empezarfav: b => { empezarFav(b.dataset.v); return 'nav'; },
  empezarhoy: () => { const h = sesionHoy(); empezarFav(h.tipo === 'fav' ? h.fav.name : ''); return 'nav'; },
  verhoy: () => { const h = sesionHoy(); if (h.tipo === 'fav') abrirFav(h.fav.name); else ir('core'); return 'nav'; },
  empezarcore: () => { iniciar('rutina', corePasos(), 'Rutina de core'); return 'nav'; },
  empezarnueva: () => { if (!fr.sel.length) return 'nada'; iniciar('suelto', buildFree(fr), S.favEdit || autoName(fr), S.favEdit); return 'nav'; },
  corefav: () => { cfg.app.coreFav = !cfg.app.coreFav; saveCfg(); toast(cfg.app.coreFav ? 'La rutina de core está en favoritas' : 'Quitada de favoritas'); return 'nada'; },
  guardarcambios: () => { const name = S.favEdit; const a = favs(), i = a.findIndex(x => x.name === name); const nf = { name, sel: fr.sel.map(it => ({ k: it.k, n: it.n })), rounds: fr.rounds, rest: fr.rest, alt: fr.alt };
    if (i >= 0) a[i] = nf; else a.unshift(nf); saveFavs(a); toast('Favorita guardada'); return 'nada'; },
  borrarya: () => { deleteFav(S.favEdit); const n = S.favEdit; S.favEdit = null; S.hoja = null; atras(); toast(`«${n}» borrada`); return 'nav'; },
  det: b => { S.det = b.dataset.v; ir('detalle'); return 'nav'; },
  hmas: () => { S.hver = (S.hver || 30) + 30; },
  hoja: b => { S.hoja = b.dataset.v; },
  sincronizar: () => { try { A.cloudSync(); } catch (e) {} setTimeout(() => pintar(false), 300); },
  salirya: () => { S.hoja = null; try { A.cloudSignOut(); } catch (e) {} },
  otrocodigo: () => { S.codigo = false; S.nubeMsg = ''; },
  quitabanda: b => { const a = BANDS.slice(); a.splice(+b.dataset.v, 1); setBands(a); },
  nuevabanda: () => { setBands([...BANDS, 'Banda ' + (BANDS.length + 1)]); setTimeout(() => { const e = document.getElementById('banda-' + (BANDS.length - 1)); if (e) { e.focus(); e.select(); } }, 30); },
  figsexo: b => { cfg.app.fig = b.dataset.v; saveCfg(); if (window.FIG) window.FIG.precargar(cfg.app.fig); },
  figprev: b => { S.figPrev = b.dataset.v; },
  exportar: () => { S.copiaMsg = ''; if (A && A.exportData) { A.exportData(); return 'nada'; } exportarNavegador(); },
  importar: () => { S.copiaMsg = ''; if (A && A.importData) { A.importData(); return 'nada'; } S.copiaMsg = 'Importar solo funciona en la app del móvil.'; S.copiaOk = false; },
  hojabanda: b => { S.hojaDe = b.dataset.v; S.hoja = 'banda'; },
  ponbanda: b => { const k = S.hojaDe, cur = bandOf(k), nb = b.dataset.v === cur ? '' : b.dataset.v; setBand(k, nb);
    /* lo que se dice en las rondas que faltan también cambia */
    if (R) R.pasos.slice(R.idx + 1).forEach(t => { if (t.k !== k) return; if (cur && t.say.endsWith(', ' + cur)) t.say = t.say.slice(0, -(cur.length + 2)); if (nb && t.say.startsWith('Prepárate. ' + D.exercises[k].name + ',')) t.say += ', ' + nb; });
    S.hoja = null; },
  cerrar: () => { if (R) R.pausa = false; S.hoja = null; },
  velo: (b, ev) => { if (ev.target !== b) return 'nada'; if (R) R.pausa = false; S.hoja = null; },
  pausa: () => { R.pausa = true; S.hoja = 'pausa'; },
  anterior: () => { R.pausa = false; S.hoja = null; anterior(); return 'nada'; },
  pararya: () => { parar(); return 'nav'; },
  tap: () => { if (R && R.ignorar) { R.ignorar = false; return 'nada'; } siguiente(); return 'nada'; },
  finvolver: () => { const f = S.final; S.final = null; S.pila = []; ir('entrenar', true); toast(f && f.series ? 'Guardada en el historial' : 'Hecha'); return 'nav'; },
  repetir: () => { const f = S.final; if (f.tipo === 'rutina') iniciar('rutina', corePasos(), 'Rutina de core'); else iniciar('suelto', buildFree(fr), f.titulo, f.favName); return 'nav'; },
};
function atras() {
  if (S.hoja) { if (R) R.pausa = false; S.hoja = null; pintar(false); return true; }
  if (S.ruta === 'reproductor') { R.pausa = true; S.hoja = 'pausa'; pintar(false); return true; }
  if (S.ruta === 'final') { ACC.finvolver(); return true; }
  if (S.pila.length) { const r = S.pila.pop(); if (S.ruta === 'nueva') S.favEdit = null; S.ruta = r; pintar(true); return true; }
  if (S.ruta !== 'entrenar') { S.ruta = 'entrenar'; pintar(true); return true; }
  return false;
}
window.atras = atras;
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-go],[data-act]'); if (!t || t.disabled) return;
  if (t.dataset.act === 'tap' && ev.target.closest('button,a,input') && ev.target.closest('button,a,input') !== t) return;
  if (t.dataset.go) { ir(t.dataset.go); return; }
  const f = ACC[t.dataset.act]; if (!f || t.dataset.act === 'sw') return;
  const r = f(t, ev); if (r !== 'nav' && r !== 'nada') pintar(false);
});
document.addEventListener('change', ev => { const t = ev.target; if (t.dataset && t.dataset.act === 'sw') { ACC.sw(t); pintar(false); }
  if (t.dataset && t.dataset.banda != null) { const a = BANDS.slice(); a[+t.dataset.banda] = t.value; setBands(a); pintar(false); } });
document.addEventListener('submit', ev => { ev.preventDefault();
  if (ev.target.dataset.form === 'email') { const em = document.getElementById('email').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { S.nubeMsg = 'Escribe un email válido.'; S.nubeOk = false; return pintar(false); }
    S.email = em; S.enviando = true; S.nubeMsg = 'Enviando el código…'; S.nubeOk = true; pintar(false); try { A.cloudSendCode(em); } catch (e) { S.enviando = false; S.nubeMsg = 'La cuenta solo funciona en la app del móvil.'; S.nubeOk = false; pintar(false); } return; }
  if (ev.target.dataset.form === 'codigo') { const c = document.getElementById('codigo').value.replace(/\s/g, '');
    if (!/^\d{6,10}$/.test(c)) { S.nubeMsg = 'El código son las cifras que te han llegado por email.'; S.nubeOk = false; return pintar(false); }
    S.enviando = true; S.nubeMsg = 'Comprobando…'; S.nubeOk = true; pintar(false); try { A.cloudVerify(S.email, c); } catch (e) {} return; }
  if (ev.target.dataset.form === 'fav') { const n = saveFav(fr, document.getElementById('fav-n').value); S.favEdit = n; S.hoja = null; toast(`Guardada en favoritas: «${n}»`); }
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && (S.hoja || S.ruta !== 'entrenar')) { ev.preventDefault(); atras(); return; }
  if (ev.key === 'Tab' && S.hoja) { const h = document.querySelector('.hoja'); const f = h ? [...h.querySelectorAll('button,a,input')] : []; if (f.length) { const i = f.indexOf(document.activeElement); if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0].focus(); } } }
  if (S.ruta === 'reproductor' && !S.hoja) { if (ev.key === 'ArrowRight') { ev.preventDefault(); siguiente(); } else if (ev.key === 'ArrowLeft') { ev.preventDefault(); anterior(); } }
});
/* Deslizar en el reproductor: a la derecha, anterior; a la izquierda, siguiente */
document.addEventListener('pointerdown', ev => { if (R && ev.target.closest('.repro')) R.swipe = { x: ev.clientX, y: ev.clientY }; });
document.addEventListener('pointerup', ev => {
  if (!R || !R.swipe) return; const dx = ev.clientX - R.swipe.x, dy = ev.clientY - R.swipe.y; R.swipe = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { R.ignorar = true; setTimeout(() => { if (R) R.ignorar = false; }, 0); if (dx > 0) anterior(); else siguiente(); }
});

/* ---------- Integración con Android ---------- */
function reloadAll() { if (R) return; reloadState(); loadBands(); loadFree(); pintar(false); }
window.reloadConfig = () => { if (!D || R) return; reloadState(); pintar(false); };
window.refreshStats = () => { if (!D || R) return; lastDay = store.lastDay(); offset = store.sessions(); if (S.ruta === 'entrenar') pintar(false); };
/* El widget abre la app para la rutina de core */
window.autoStart = () => { try { if (!D || R) return; iniciar('rutina', corePasos(), 'Rutina de core'); } catch (e) {} };
window.onBackup = (msg, ok, imported) => { S.copiaMsg = msg; S.copiaOk = ok; if (imported) reloadAll(); else if (S.ruta === 'copia') pintar(false); };
window.onCloud = (st, changed) => { if (changed) reloadAll(); else if (!R && ['tu', 'copia'].includes(S.ruta)) pintar(false); };
/* Respuesta de la nube al pedir el código o al comprobarlo */
window.onCloudMsg = (msg, ok, kind) => { S.enviando = false; S.nubeMsg = msg; S.nubeOk = ok;
  if (kind === 'code' && ok) S.codigo = true;
  if (kind === 'verify' && ok) { S.codigo = false; S.nubeMsg = ''; S.pila = []; S.ruta = 'tu'; pintar(true); toast(msg || 'Has entrado'); return; }
  if (S.ruta === 'entrar') pintar(false); };
function exportarNavegador() {
  const free = {}; [['last', 'free.last'], ['favs', 'free.favs'], ['bands', 'free.bands'], ['bandUse', 'free.bandUse']].forEach(([k, f]) => { try { const v = JSON.parse(store.free(f)); if (v != null) free[k] = v; } catch (e) {} });
  free.widgetFav = widgetFav();
  const o = { app: 'rutina-core', v: 1, exportedAt: Date.now(), history: store.history(), days: store.days(), lastDay: store.lastDay(), lastRounds: 0, sessions: store.sessions(), config: store.cfg(), weights: store.weights(), free };
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 1)], { type: 'application/json' }));
  a.download = 'rutina-core-' + dayKey(Date.now()) + '.json'; a.click(); S.copiaMsg = 'Copia descargada.'; S.copiaOk = true;
}

window.D_LISTA = loadData().then(d => {
  D = d; window.D = d; reloadState(); loadBands(); loadFree();
  pintar(true); requestAnimationFrame(tick);
  if (window.__ready) window.__ready();
  return d;
}).catch(e => { console.error(e); document.getElementById('movil').textContent = 'No se pudo cargar rutina.json'; });
/* Para las pruebas automáticas */
window.__t = { get R() { return R; }, get S() { return S; }, get cfg() { return cfg; }, get fr() { return fr; }, get rec() { return rec; }, beepLog, sayLog, buildPlan, buildFree, siguiente, anterior, ir, atras };
