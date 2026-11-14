/* Rutina core · zona Reproductor (B3): la sesión a pantalla completa, el final y la grabación de cada serie. */
'use strict';

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
    ${f.id ? `<section class="seccion"><h2>Esfuerzo</h2>
      <div class="fila"><span class="crece meta">De 1 (muy fácil) a 10 (máximo)</span>${paso('esfuerzo', f.rpe ? f.rpe + ' / 10' : '–', 'Esfuerzo de 1 a 10')}</div>
      <h2>¿Cómo te has sentido?</h2>${seg('sentir', FEEL, f.feel || '', 'Cómo te has sentido')}</section>` : ''}
    <div class="lista">${f.id && conectado('strava') ? `<label class="item" for="fin-strava"><span class="item-icono">${ico('subir')}</span><span class="crece"><span class="nombre">Enviar a Strava</span><span class="meta">Con la lista de ejercicios, el pulso del reloj, el esfuerzo y cómo te has sentido</span></span>${inter('fin-strava', f.st !== false, 'Enviar a Strava')}</label>` : ''}
      <div class="item" style="cursor:default"><span class="item-icono">${ico('reloj2')}</span><span class="crece"><span class="nombre">En el reloj Polar</span><span class="meta">Guarda la grabación como «Entrenamiento en circuito»</span></span></div></div>
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

/* ---------- Acciones ---------- */
Object.assign(HOJAS, {
  pausa: () => `<h2 class="h2">En pausa</h2><button class="btn btn-principal btn-grande" data-act="cerrar">${ico('play')}Seguir</button><button class="btn btn-secundario" data-act="anterior">${ico('atras')}Ejercicio anterior</button><button class="btn btn-texto" data-act="hoja" data-v="parar">${ico('parar')}Parar la sesión</button>`,
  parar: () => `<h2 class="h2">¿Parar la sesión?</h2><p>Se guarda como incompleta con las series hechas. No cuenta para la racha.</p><button class="btn btn-peligro btn-grande" data-act="pararya">${ico('parar')}Parar y guardar</button><button class="btn btn-principal btn-grande" data-act="cerrar">Seguir entrenando</button>`,
  kg: () => { const s = R.pasos[R.idx].prep ? R.pasos[R.idx + 1] : R.pasos[R.idx]; return `<h2 class="h2">Kilos de ${esc(D.exercises[s.k].name)}</h2><div class="fila"><span class="crece meta">Orientativo: ${esc(kgRange(s.kg))}</span>${paso('kg', fkg(kgDe(s)) + ' kg', 'Kilos', 'Medio kilo menos', 'Medio kilo más')}</div><p class="meta">Se recuerda para la próxima vez.</p><button class="btn btn-principal btn-grande" data-act="cerrar">Listo</button>`; },
});
Object.assign(ACC, {
  pausa: () => { R.pausa = true; S.hoja = 'pausa'; },
  anterior: () => { R.pausa = false; S.hoja = null; anterior(); return 'nada'; },
  pararya: () => { parar(); return 'nav'; },
  tap: () => { if (R && R.ignorar) { R.ignorar = false; return 'nada'; } siguiente(); return 'nada'; },
  finvolver: () => { const f = S.final; S.final = null; S.pila = []; ir('entrenar', true); toast(f && f.series ? 'Guardada en el historial' : 'Hecha'); return 'nav'; },
  repetir: () => { const f = S.final; if (f.tipo === 'rutina') iniciar('rutina', corePasos(), 'Rutina de core'); else iniciar('suelto', buildFree(fr), f.titulo, f.favName); return 'nav'; },
});
/* Deslizar en el reproductor: a la derecha, anterior; a la izquierda, siguiente */
document.addEventListener('pointerdown', ev => { if (R && ev.target.closest('.repro')) R.swipe = { x: ev.clientX, y: ev.clientY }; });
document.addEventListener('pointerup', ev => {
  if (!R || !R.swipe) return; const dx = ev.clientX - R.swipe.x, dy = ev.clientY - R.swipe.y; R.swipe = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { R.ignorar = true; setTimeout(() => { if (R) R.ignorar = false; }, 0); if (dx > 0) anterior(); else siguiente(); }
});
