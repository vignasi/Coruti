/* Rutina core · arranque de la interfaz (B3): va el último en index.html, cuando todas las zonas ya han
   puesto sus pantallas, acciones, hojas y formularios. Toques, teclado, integración con Android y la carga de rutina.json. */
'use strict';

/* ---------- Toques y teclado ---------- */
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-go],[data-act]'); if (!t || t.disabled) return;
  if (t.dataset.act === 'tap' && ev.target.closest('button,a,input') && ev.target.closest('button,a,input') !== t) return;
  if (t.dataset.go) { if (t.dataset.go === 'entrar' || t.dataset.go === 'clave') { S.nubeMsg = ''; S.nubeOk = true; S.enviando = false; } ir(t.dataset.go); return; }
  const f = ACC[t.dataset.act]; if (!f || t.dataset.act === 'sw') return;
  const r = f(t, ev); if (r !== 'nav' && r !== 'nada') pintar(false);
});
document.addEventListener('change', ev => { const t = ev.target; if (t.dataset && t.dataset.act === 'sw') { ACC.sw(t); pintar(false); } });
document.addEventListener('submit', ev => { ev.preventDefault(); const f = FORM[ev.target.dataset.form]; if (f) f(ev); });
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && (S.hoja || S.ruta !== 'entrenar')) { ev.preventDefault(); atras(); return; }
  if (ev.key === 'Tab' && S.hoja) { const h = document.querySelector('.hoja'); const f = h ? [...h.querySelectorAll('button,a,input')] : []; if (f.length) { const i = f.indexOf(document.activeElement); if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0].focus(); } } }
  if (S.ruta === 'reproductor' && !S.hoja) { if (ev.key === 'ArrowRight') { ev.preventDefault(); siguiente(); } else if (ev.key === 'ArrowLeft') { ev.preventDefault(); anterior(); } }
});

/* ---------- Integración con Android ---------- */
function reloadAll() { if (R) return; reloadState(); loadBands(); loadFree(); pintar(false); }
window.reloadConfig = () => { if (!D || R) return; reloadState(); pintar(false); };
window.refreshStats = () => { if (!D || R) return; lastDay = store.lastDay(); offset = store.sessions(); if (S.ruta === 'entrenar') pintar(false); };
/* El widget abre la app para la rutina de core */
window.autoStart = () => { try { if (!D || R) return; iniciar('rutina', corePasos(), 'Rutina de core'); } catch (e) {} };
window.onBackup = (msg, ok, imported) => { S.copiaMsg = msg; S.copiaOk = ok; if (imported) reloadAll(); else if (S.ruta === 'copia') pintar(false); };
window.onCloud = (st, changed) => { if (changed) reloadAll(); else if (!R && ['tu', 'copia', 'conexiones', 'strava', 'polar', 'historial', 'detalle', 'final'].includes(S.ruta)) pintar(false); };
/* Strava y Polar: respuesta al conectar, desconectar o reenviar carreras, y a «Enviar a Strava» */
window.onConnMsg = (msg, ok) => { S.connMsg = msg; S.connOk = ok; S.fwd = null; if (!R) pintar(false); };
window.irConexiones = () => { if (R || !D) return; S.hoja = null; S.pila = ['tu']; S.ruta = 'conexiones'; pintar(true); };
window.onStravaSent = (id, msg, ok) => { S.envStr = null; S.strMsg = { ...(S.strMsg || {}), [id]: msg }; if (!R) pintar(false); };
/* Respuesta de la nube al entrar o al cambiar la contraseña */
window.onCloudMsg = (msg, ok, kind) => { S.enviando = false; S.nubeMsg = msg; S.nubeOk = ok;
  if (kind === 'clave' && ok) { S.nubeMsg = ''; atras(); toast(msg); return; }
  if (kind === 'verify' && ok) { S.nubeMsg = ''; S.pila = []; S.ruta = 'tu'; pintar(true); toast(msg || 'Has entrado'); return; }
  if (S.ruta === 'entrar' || S.ruta === 'clave') pintar(false); };

window.D_LISTA = loadData().then(d => {
  D = d; window.D = d; reloadState(); loadBands(); loadFree();
  pintar(true); requestAnimationFrame(tick);
  if (window.__ready) window.__ready();
  return d;
}).catch(e => { console.error(e); document.getElementById('movil').textContent = 'No se pudo cargar rutina.json'; });
/* Para las pruebas automáticas */
window.__t = { get R() { return R; }, get S() { return S; }, get cfg() { return cfg; }, get fr() { return fr; }, get rec() { return rec; }, beepLog, sayLog, buildPlan, buildFree, siguiente, anterior, ir, atras };
