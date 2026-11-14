/* Rutina core · zona Tú (B3): cuenta, ajustes, copia de seguridad y conexiones con Strava y Polar. */
'use strict';

/* ---------- Tú: cuenta y ajustes ---------- */
function nubeTxt(st) { const i = [];
  if (st.busy) i.push('Sincronizando…'); else if (st.lastSync) i.push('Sincronizado el ' + dayShort(st.lastSync) + ' a las ' + hhmm(st.lastSync));
  if (st.pending) i.push(plural(st.pending, 'sesión sin subir', 'sesiones sin subir'));
  return [st.msg, ...i].filter(Boolean).join(' · '); }
function connResumen(st) {
  if (!st.signedIn) return 'Entra con tu cuenta para conectarlas';
  const t = p => conectado(p, st) ? 'conectado' : conn(p, st) ? 'hay que volver a conectar' : 'sin conectar';
  return `Strava ${t('strava')} · Polar ${t('polar')}`;
}
const connAviso = () => S.connMsg ? `<p class="meta" role="status" aria-live="polite" ${S.connOk === false ? 'style="color:var(--error)"' : ''}>${esc(S.connMsg)}</p>` : '<p class="meta" role="status" aria-live="polite"></p>';
const estadoConn = (p, st) => conectado(p, st) ? `<span class="estado bien">${ico('check')}Conectado</span>` : conn(p, st) ? `<span class="estado error">${ico('aviso')}Volver a conectar</span>` : '<span class="estado neutro">Sin conectar</span>';
function botonConn(p, st) {
  const nombre = p === 'polar' ? 'Polar' : 'Strava';
  return conectado(p, st) ? `<button class="btn btn-peligro" data-act="pedirdesc" data-v="${p}">Desconectar</button>`
    : `<button class="btn btn-principal btn-grande" data-act="conectar" data-v="${p}">${ico('conexion')}Conectar con ${nombre}</button>`;
}
P.conexiones = { render: () => { const st = nube();
  if (!st || !st.signedIn) return `${cab('Conexiones')}<div class="pantalla"><p>Para conectar Strava y Polar hace falta entrar con tu cuenta: las claves se guardan en tu cuenta, no en el móvil.</p>${st ? item({ t: 'Entrar', m: 'Con tu email y tu contraseña', go: 'entrar', icono: 'correo' }) : ''}</div>`;
  const pend = historyList().filter(o => ['waiting', 'error'].includes(stravaDe(o))).length;
  return `${cab('Conexiones')}
  <div class="pantalla"><div class="lista">
    ${item({ t: 'Strava', m: conectado('strava', st) ? 'Conectado' + (pend ? ' · ' + plural(pend, 'sesión pendiente', 'sesiones pendientes') : '') : conn('strava', st) ? 'Hay que volver a conectar' : 'Sin conectar', go: 'strava', icono: 'subir' })}
    ${item({ t: 'Polar', m: conectado('polar', st) ? 'Conectado · da el pulso del reloj' : conn('polar', st) ? 'Hay que volver a conectar' : 'Sin conectar', go: 'polar', icono: 'reloj2' })}
  </div>${connAviso()}</div>`; } };
P.strava = { render: () => { const st = nube(), sc = conn('strava', st), on = conectado('strava', st), m = (sc && sc.meta) || {};
  const pend = on ? historyList().filter(o => ['waiting', 'error'].includes(stravaDe(o, sc))) : [];
  return `${cab('Strava')}
  <div class="pantalla">
    <div class="fila"><span class="crece h2">Strava</span>${estadoConn('strava', st)}</div>
    <p>Cada sesión se sube al terminar con la lista de ejercicios, las series, los kilos, el pulso del reloj y cómo te has sentido.${on && m.name ? ' Cuenta: ' + esc(m.name) + '.' : ''}</p>
    ${sc && !on && m.error ? `<p style="color:var(--error)">${esc(m.error)}</p>` : ''}
    ${on ? `<div class="lista"><label class="item" for="st-fwd"><span class="crece"><span class="nombre">Reenviar también carreras y paseos</span><span class="meta">Solo si en Polar Flow has quitado del todo la sincronización con Strava</span></span>${inter('st-fwd', S.fwd != null ? S.fwd : !!m.forward, 'Reenviar también carreras y paseos')}</label></div>` : ''}
    ${pend.length ? `<div class="tarjeta"><div class="fila"><span class="crece nombre" style="font-weight:700">${plural(pend.length, 'sesión pendiente', 'sesiones pendientes')}</span>${estado('waiting')}</div><button class="btn btn-secundario" data-act="det" data-v="${esc(pend[0].id)}">Ver</button></div>` : ''}
    ${botonConn('strava', st)}${connAviso()}
  </div>`; } };
P.polar = { render: () => { const st = nube(), pc = conn('polar', st), on = conectado('polar', st);
  return `${cab('Polar')}
  <div class="pantalla">
    <div class="fila"><span class="crece h2">Cuenta de Polar Flow</span>${estadoConn('polar', st)}</div>
    <p>Para traer de cada sesión del reloj el pulso y subirlo a Strava con la lista de ejercicios. Polar Flow lo sigue recibiendo todo como siempre.</p>
    ${pc && !on && pc.meta && pc.meta.error ? `<p style="color:var(--error)">${esc(pc.meta.error)}</p>` : ''}
    ${botonConn('polar', st)}${connAviso()}
  </div>`; } };

P.tu = { render: () => { const st = nube(), wf = widgetFav();
  return `<div class="pantalla">
    <h1 class="titulo-pantalla">Tú</h1>
    <section class="seccion"><h2 class="etiqueta">Cuenta</h2>
      ${!st ? '<p class="meta">La cuenta solo funciona en la app del móvil.</p>'
        : st.signedIn ? `<div class="lista"><div class="item" style="cursor:default"><span class="item-icono">${ico('correo')}</span><span class="crece"><span class="nombre" style="overflow-wrap:anywhere">${esc(st.email)}</span><span class="meta">Tus datos se guardan en la nube y se sincronizan al terminar cada sesión y al abrir la app</span></span></div>
          <button class="item" data-act="sincronizar" ${st.busy ? 'disabled' : ''}><span class="item-icono">${ico('reintentar')}</span><span class="crece"><span class="nombre">Sincronizar ahora</span><span class="meta" aria-live="polite">${esc(nubeTxt(st))}</span></span></button>
          ${item({ t: 'Cambiar la contraseña', m: 'La de tu cuenta', go: 'clave', icono: 'correo' })}
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
    ${st ? `<section class="seccion"><h2 class="etiqueta">Conexiones</h2><div class="lista">${item({ t: 'Strava y Polar', m: connResumen(st), go: 'conexiones', icono: 'conexion' })}</div></section>` : ''}
  </div>`; } };

P.entrar = { sinPestanas: true, render: () => `${cab('Entrar')}
  <div class="pantalla">
    <div class="pila" style="gap:var(--e3)"><h1 class="titulo-pantalla">Rutina core</h1><p>Entra con tu cuenta para guardar tus sesiones en la nube y tenerlas en otro móvil.</p></div>
    <form class="pila" style="gap:var(--e4)" data-form="entrar">
      <div class="campo"><label for="email">Email</label><input id="email" type="email" autocomplete="username" inputmode="email" value="${esc(S.email || '')}" required></div>
      <div class="campo"><label for="clave">Contraseña</label><input id="clave" type="password" autocomplete="current-password" required></div>
      <button class="btn btn-principal btn-grande" type="submit" ${S.enviando ? 'disabled' : ''}>Entrar</button>
    </form>
    <p class="mensaje ${S.nubeOk === false ? 'error' : ''}" role="status" aria-live="polite">${esc(S.nubeMsg || '')}</p>
    <button class="btn btn-texto" data-act="atras">Seguir sin cuenta</button>
    <p class="meta">Las cuentas las crea quien lleva la app. Sin cuenta, todo se queda solo en este móvil y puedes entrar más tarde desde Tú.</p>
  </div>` };

P.clave = { render: () => `${cab('Cambiar la contraseña')}
  <div class="pantalla">
    <form class="pila" style="gap:var(--e4)" data-form="clave">
      <div class="campo"><label for="clave-n">Contraseña nueva</label><input id="clave-n" type="password" autocomplete="new-password" minlength="8" required></div>
      <div class="campo"><label for="clave-r">Repite la contraseña</label><input id="clave-r" type="password" autocomplete="new-password" minlength="8" required></div>
      <button class="btn btn-principal btn-grande" type="submit" ${S.enviando ? 'disabled' : ''}>Cambiar</button>
    </form>
    <p class="mensaje ${S.nubeOk === false ? 'error' : ''}" role="status" aria-live="polite">${esc(S.nubeMsg || '')}</p>
    <p class="meta">Mínimo 8 caracteres. Sigues dentro de la cuenta en este móvil.</p>
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

function exportarNavegador() {
  const free = {}; [['last', 'free.last'], ['favs', 'free.favs'], ['bands', 'free.bands'], ['bandUse', 'free.bandUse']].forEach(([k, f]) => { try { const v = JSON.parse(store.free(f)); if (v != null) free[k] = v; } catch (e) {} });
  free.widgetFav = widgetFav();
  const o = { app: 'rutina-core', v: 1, exportedAt: Date.now(), history: store.history(), days: store.days(), lastDay: store.lastDay(), lastRounds: 0, sessions: store.sessions(), config: store.cfg(), weights: store.weights(), free };
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 1)], { type: 'application/json' }));
  a.download = 'rutina-core-' + dayKey(Date.now()) + '.json'; a.click(); S.copiaMsg = 'Copia descargada.'; S.copiaOk = true;
}

/* ---------- Acciones ---------- */
Object.assign(HOJAS, {
  desconectar: () => { const s = S.hojaDe === 'polar'; return `<h2 class="h2">¿Desconectar ${s ? 'Polar' : 'Strava'}?</h2><p>${s ? 'Las sesiones se seguirán subiendo a Strava, pero sin el pulso del reloj.' : 'No se enviará nada más a Strava. Lo que ya está allí no se toca.'}</p><button class="btn btn-peligro btn-grande" data-act="desconectar">Desconectar</button><button class="btn btn-principal btn-grande" data-act="cerrar">No desconectar</button>`; },
  salir: () => `<h2 class="h2">¿Salir de la cuenta?</h2><p>Tus datos se quedan en este móvil. Si queda algo sin subir, se sube antes.</p><button class="btn btn-peligro btn-grande" data-act="salirya">${ico('salir')}Salir</button><button class="btn btn-principal btn-grande" data-act="cerrar">Seguir con la cuenta</button>`,
});
Object.assign(ACC, {
  pedirdesc: b => { S.hojaDe = b.dataset.v; S.hoja = 'desconectar'; },
  conectar: b => { S.connMsg = 'Abriendo ' + (b.dataset.v === 'polar' ? 'Polar' : 'Strava') + '…'; S.connOk = true; try { A.connConnect(b.dataset.v); } catch (e) { S.connMsg = 'Conectar solo funciona en la app del móvil.'; S.connOk = false; } },
  desconectar: b => { S.hoja = null; S.connMsg = 'Desconectando…'; S.connOk = true; try { A.connDisconnect(S.hojaDe); } catch (e) {} },
  sincronizar: () => { try { A.cloudSync(); } catch (e) {} setTimeout(() => pintar(false), 300); },
  salirya: () => { S.hoja = null; try { A.cloudSignOut(); } catch (e) {} },
  quitabanda: b => { const a = BANDS.slice(); a.splice(+b.dataset.v, 1); setBands(a); },
  nuevabanda: () => { setBands([...BANDS, 'Banda ' + (BANDS.length + 1)]); setTimeout(() => { const e = document.getElementById('banda-' + (BANDS.length - 1)); if (e) { e.focus(); e.select(); } }, 30); },
  figsexo: b => { cfg.app.fig = b.dataset.v; saveCfg(); if (window.FIG) window.FIG.precargar(cfg.app.fig); },
  figprev: b => { S.figPrev = b.dataset.v; },
  exportar: () => { S.copiaMsg = ''; if (A && A.exportData) { A.exportData(); return 'nada'; } exportarNavegador(); },
  importar: () => { S.copiaMsg = ''; if (A && A.importData) { A.importData(); return 'nada'; } S.copiaMsg = 'Importar solo funciona en la app del móvil.'; S.copiaOk = false; },
});
/* Nombre de cada banda: se guarda al cambiar el campo */
document.addEventListener('change', ev => { const t = ev.target;
  if (t.dataset && t.dataset.banda != null) { const a = BANDS.slice(); a[+t.dataset.banda] = t.value; setBands(a); pintar(false); } });
FORM.entrar = () => { const em = document.getElementById('email').value.trim(), cl = document.getElementById('clave').value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { S.nubeMsg = 'Escribe un email válido.'; S.nubeOk = false; return pintar(false); }
    if (!cl) { S.nubeMsg = 'Escribe tu contraseña.'; S.nubeOk = false; return pintar(false); }
    S.email = em; S.enviando = true; S.nubeMsg = 'Entrando…'; S.nubeOk = true; pintar(false); try { A.cloudSignIn(em, cl); } catch (e) { S.enviando = false; S.nubeMsg = 'La cuenta solo funciona en la app del móvil.'; S.nubeOk = false; pintar(false); } };
FORM.clave = () => { const n = document.getElementById('clave-n').value, r = document.getElementById('clave-r').value;
    if (n.length < 8) { S.nubeMsg = 'La contraseña tiene que tener al menos 8 caracteres.'; S.nubeOk = false; return pintar(false); }
    if (n !== r) { S.nubeMsg = 'Las dos contraseñas no coinciden.'; S.nubeOk = false; return pintar(false); }
    S.enviando = true; S.nubeMsg = 'Cambiando…'; S.nubeOk = true; pintar(false); try { A.cloudChangePassword(n); } catch (e) { S.enviando = false; S.nubeMsg = 'Solo funciona en la app del móvil.'; S.nubeOk = false; pintar(false); } };
