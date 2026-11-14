/* Rutina core · zona Ejercicios (B3): la pestaña Ejercicios y la ficha de cada ejercicio. */
'use strict';

const dosisDe = k => { const c = catOf(k), ex = D.exercises[k]; return (isHoldEx(k) ? `${c.secs || 30} s` : `${c.reps || 12} reps`) + (c.sides ? ' por lado' : ''); };

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

/* ---------- Acciones ---------- */
Object.assign(ACC, {
  ficha: b => { S.ex = b.dataset.v; ir('ficha'); return 'nav'; },
  anadir: b => { const k = b.dataset.v; if (!fr.sel.some(it => it.k === k)) { fr.sel.push({ k, n: defN(k) }); saveFree(); toast('Añadido a la sesión'); } S.favEdit = null; ir('nueva'); return 'nav'; },
});
