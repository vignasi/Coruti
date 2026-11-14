/* Rutina core · zona Entrenar (B3): la pestaña Entrenar, la rutina de core, Sesión nueva y Elegir ejercicios.
   Lo que se empieza aquí lo reproduce reproductor.js. */
'use strict';

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

P.elegir = { titulo: 'Elegir ejercicios', render: () => { const l = filtrar(), n = fr.sel.length; return `${cab('Elegir ejercicios')}
  <div class="pantalla">
    <div class="pila">${filtros()}</div>
    <p class="meta" aria-live="polite">${plural(l.length, 'ejercicio', 'ejercicios')}</p>
    <div class="rejilla">${l.map(k => { const on = fr.sel.some(it => it.k === k), ex = D.exercises[k]; return `<button class="miniatura" data-act="elegir" data-v="${k}" aria-pressed="${on}">${fig(k)}<span class="check" aria-hidden="true">${on ? ico('check') : ''}</span><span class="nombre">${esc(ex.name)}</span><span class="meta">${esc(NEEDS()[catOf(k).needs || ''])}</span></button>`; }).join('') || '<p class="meta">Ninguno con estos filtros. Quita alguno.</p>'}</div>
  </div>
  <div style="padding:var(--e3) var(--e4);border-top:1px solid var(--linea);background:var(--capa)"><button class="btn btn-principal btn-grande" data-act="atras">${n ? `Listo · ${plural(n, 'ejercicio', 'ejercicios')}` : 'Volver'}</button></div>`; } };

/* ---------- Acciones ---------- */
function abrirFav(name) { const f = favs().find(x => x.name === name); if (!f) return; const n = normFree(f); fr = { ...fr, sel: n.sel, rounds: n.rounds, rest: n.rest, alt: n.alt }; saveFree(); S.favEdit = name; ir('nueva'); }
function empezarFav(name) {
  if (!name) return iniciar('rutina', corePasos(), 'Rutina de core');
  const f = favs().find(x => x.name === name); if (!f) return; const n = normFree(f);
  fr = { ...fr, sel: n.sel, rounds: n.rounds, rest: n.rest, alt: n.alt }; saveFree();
  iniciar('suelto', buildFree(fr), f.name, f.name);
}
Object.assign(HOJAS, {
  guardarfav: () => `<h2 class="h2">Guardar como favorita</h2><form class="pila" style="gap:var(--e4)" data-form="fav"><div class="campo"><label for="fav-n">Nombre</label><input id="fav-n" maxlength="40" autocomplete="off" placeholder="${esc(autoName(fr))}"></div><button class="btn btn-principal btn-grande" type="submit">${ico('estrella')}Guardar</button></form>`,
  borrarfav: () => `<h2 class="h2">¿Borrar «${esc(S.favEdit)}»?</h2><p>Se quita de favoritas${widgetFav() === S.favEdit ? ' y el widget vuelve a la rutina de core' : ''}. Tu historial no cambia.</p><button class="btn btn-peligro btn-grande" data-act="borrarya">${ico('papelera')}Borrar</button><button class="btn btn-principal btn-grande" data-act="cerrar">No borrar</button>`,
});
Object.assign(ACC, {
  elegir: b => { const k = b.dataset.v, i = fr.sel.findIndex(it => it.k === k); if (i >= 0) fr.sel.splice(i, 1); else fr.sel.push({ k, n: defN(k) }); saveFree(); },
  quitar: b => { fr.sel.splice(+b.dataset.v, 1); saveFree(); },
  nueva: () => { S.favEdit = null; ir('nueva'); return 'nav'; },
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
});
FORM.fav = () => { const n = saveFav(fr, document.getElementById('fav-n').value); S.favEdit = n; S.hoja = null; toast(`Guardada en favoritas: «${n}»`); };
