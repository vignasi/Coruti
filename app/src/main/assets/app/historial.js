/* Rutina core · zona Historial (B3): la pestaña Historial, el detalle de una sesión (con Strava) y las marcas. */
'use strict';

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
        ${chipsSesion(o)}</span>${ico('chev', 'chev')}</button>`).join('')}</div></section>`).join('')}
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
    ${bloqueStrava(o)}
    ${[...g.values()].map(l => `<section class="seccion"><h2>${esc(l[0].name)}</h2><div style="overflow-x:auto" tabindex="0" role="region" aria-label="Series de ${esc(l[0].name)}"><table class="tabla"><thead><tr><th>Hora</th><th>${W}</th><th class="n">Hecho</th>${kg ? '<th class="n">Kilos</th>' : ''}${bd ? '<th>Banda</th>' : ''}</tr></thead><tbody>
      ${l.map(x => `<tr><td>${hhmm(x.start)}</td><td>${x.r}${x.side ? ' · ' + esc(x.side.toLowerCase()) : ''}</td><td class="n">${esc(doseOf(x))}${x.skipped ? ' <span class="meta">(saltada)</span>' : ''}</td>${kg ? `<td class="n">${x.kg != null ? fkg(x.kg) : '–'}</td>` : ''}${bd ? `<td>${esc(x.band || '–')}</td>` : ''}</tr>`).join('')}</tbody></table></div></section>`).join('')}
    ${o.fb && Object.keys(o.fb).length ? `<section class="seccion"><h2>Cómo te fue</h2><p>${esc(Object.entries(o.fb).map(([k, v]) => { const m = D.modules.find(x => x.key === k); return (m ? m.name : k) + ': ' + FBT[v]; }).join(' · '))}</p></section>` : ''}
  </div>`; } };

P.marcas = { render: () => { const l = exSummary(historyList()); return `${cab('Por ejercicio')}
  <div class="pantalla"><p class="meta">La última vez y la mejor (la de más kilos; sin kilos, la de más repeticiones o segundos).</p>
  ${l.length ? `<div class="lista">${l.map(e => `<button class="item" data-act="ficha" data-v="${e.k}"><span class="crece"><span class="nombre">${esc(e.name)}</span><span class="meta">Última · ${esc(dayShort(e.last))}: ${esc(lastTxt(e))}</span><span class="meta">Mejor · ${esc(dayShort(e.bestAt))}: ${esc(bestTxt(e))}</span></span>${ico('chev', 'chev')}</button>`).join('')}</div>` : '<p>Aún no hay series guardadas.</p>'}</div>`; } };

/* Strava en el historial: chips de cada sesión y el bloque del detalle */
function chipsSesion(o) {
  const k = stravaDe(o), c = [o.complete ? '' : '<span class="estado neutro">Incompleta</span>', k ? estado(k) : '', o.hr && o.hr.avg ? `<span class="estado neutro">${o.hr.avg} ppm</span>` : ''].filter(Boolean);
  return c.length ? `<span class="fila envuelve" style="gap:var(--e2);margin-top:2px">${c.join('')}</span>` : '';
}
function bloqueStrava(o) {
  const k = stravaDe(o), fe = FEEL.find(x => x[0] === o.feel), cifras = [];
  if (o.hr && o.hr.avg) cifras.push(['Pulso medio', o.hr.avg, 'ppm']);
  if (o.hr && o.hr.max) cifras.push(['Máximo', o.hr.max, 'ppm']);
  if (o.rpe) cifras.push(['Esfuerzo', o.rpe, '/10']);
  const datos = cifras.length || fe ? `<div class="fila envuelve" style="gap:var(--e5)">${cifras.map(([e, v, u]) => `<div><span class="etiqueta">${e}</span><p class="cifra">${v}<small>${u}</small></p></div>`).join('')}</div>${fe ? `<p class="meta">Te sentiste ${esc(fe[1].toLowerCase())}</p>` : ''}` : '';
  if (!k) return datos ? `<section class="seccion">${datos}</section>` : '';
  const id = o.strava && o.strava.id, polar = conectado('polar'), msg = (S.strMsg || {})[o.id];
  const txt = {
    done: o.hr ? 'Subida con la lista de ejercicios y el pulso del reloj.' : 'Subida con la lista de ejercicios.',
    waiting: polar ? 'Se envía sola cuando llega la sesión del reloj, para subirla con el pulso. Si no llega, a las 3 horas, sin pulso.' : 'Se envía sola en unos minutos.',
    uploading: 'Subiendo a Strava…',
    error: ((o.strava && o.strava.err) || 'Strava no respondió.') + ' Se volverá a intentar sola, o envíala ahora.',
    duplicate: 'Strava ya tenía una actividad a esa hora (la del reloj). No se ha subido otra.',
    no: 'No se ha enviado.' }[k];
  const puede = ['waiting', 'error', 'no'].includes(k) && conectado('strava');
  return `<section class="seccion"><div class="tarjeta">
    <div class="fila"><span class="crece"><span class="etiqueta">Strava</span></span>${estado(k)}</div>
    <p>${esc(txt)}</p>
    ${id ? `<a class="btn btn-texto" style="align-self:flex-start;padding:0" href="https://www.strava.com/activities/${esc(id)}" target="_blank" rel="noopener">${ico('externo')}Abrir en Strava</a>` : ''}
    ${puede ? `<button class="btn btn-principal" data-act="enviar" data-v="${esc(o.id)}" ${S.envStr === o.id ? 'disabled' : ''}>${ico(k === 'error' ? 'reintentar' : 'subir')}${S.envStr === o.id ? 'Enviando…' : k === 'error' ? 'Reintentar' : 'Enviar a Strava'}</button>` : ''}
    ${msg ? `<p class="meta" role="status">${esc(msg)}</p>` : ''}
    </div>${datos}</section>`;
}

/* ---------- Acciones ---------- */
Object.assign(ACC, {
  det: b => { S.det = b.dataset.v; ir('detalle'); return 'nav'; },
  hmas: () => { S.hver = (S.hver || 30) + 30; },
  enviar: b => { const id = b.dataset.v; S.envStr = id; S.strMsg = { ...(S.strMsg || {}), [id]: 'Enviando…' }; try { A.stravaSend(id); } catch (e) { S.envStr = null; } },
});
