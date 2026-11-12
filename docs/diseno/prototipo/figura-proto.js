/* Rutina core · prototipo (D2): la figura 3D real de D1 (figura3d.js) en las pantallas del prototipo.
   app.js pinta <canvas data-fig="ejercicio" data-modo="…"> y llama a FIG.pintar(raíz) después de cada repintado:
   - mini    → postura clave, quieta, sin etiquetas (cuadrícula, listas). Se guarda en caché: no se vuelve a dibujar.
   - grande  → movimiento en bucle con las etiquetas de zona (ficha, vista previa de Ajustes).
   - libre   → igual que grande, a toda pantalla (reproductor). En los ejercicios de pie se recortan los lados para que la persona salga más grande.
   - sig     → movimiento sin etiquetas (el siguiente ejercicio, durante el descanso).
   data-g="m|f" fuerza hombre o mujer (si no, el elegido en Ajustes). Si no hay WebGL o falla la carga, sale la figura dibujada
   (figura.js, estilo persona), que es el respaldo decidido en D1. */

const BASE = window.FIG_BASE || '../figura/';
const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
await window.FIG_LISTA;                                  // figura.js cargado (lo inserta index.html)
async function json(urls) { for (const u of urls) { try { const r = await fetch(u); if (r.ok) return await r.json(); } catch (e) {} } throw new Error('sin datos'); }
const D = await json(['../../../app/src/main/assets/rutina.json', 'rutina.json']);

let crear = null;
try { ({ crear } = await import(BASE + 'figura3d.js')); } catch (e) { console.warn('Sin figura 3D', e); }
const hayWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();

/* Modelos: .glb en el repo; en la página publicada, el mismo modelo como glTF en JSON (allí no se sirven .glb) */
const modelos = {}, cargando = {};
let look = {}, lookId = '';
function modelo(g) {
  if (modelos[g]) return Promise.resolve(modelos[g]);
  if (!crear || !hayWebGL) return Promise.reject(new Error('sin 3D'));
  const uno = ext => crear({ modelo: BASE + 'modelos/persona_' + g + ext, gender: g });
  return cargando[g] || (cargando[g] = uno('.glb').catch(() => uno('.gltf.json')).then(m => { modelos[g] = m; aplicar(m); return m; }));
}
/* Personalización (idea para más adelante, NOTAS de D1): deformaciones del modelo y colores de piel, pelo y camiseta */
const COLOR0 = {};
function aplicar(m) {
  m.scene.traverse(o => {
    if (!o.isMesh) return;
    const d = o.morphTargetDictionary;
    if (d) {
      const pon = (k, v) => { if (d[k] !== undefined) o.morphTargetInfluences[d[k]] = v; };
      const c = look.complexion || 0, u = look.musculo || 0;
      pon('complexion_mas', Math.max(0, c)); pon('complexion_menos', Math.max(0, -c));
      pon('musculo_mas', Math.max(0, u)); pon('musculo_menos', Math.max(0, -u));
    }
    [].concat(o.material).forEach(mt => {
      if (!['piel', 'pelo', 'top'].includes(mt.name)) return;
      const k = mt.name + (o.uuid);
      if (!COLOR0[k]) COLOR0[k] = mt.color.getHex();
      if (look[mt.name]) mt.color.set(look[mt.name]); else mt.color.setHex(COLOR0[k]);
    });
  });
}

const oscuro = () => getComputedStyle(document.documentElement).getPropertyValue('color-scheme').trim() === 'dark';
const generoDe = cv => cv.dataset.g || (window.FIG_GENERO ? window.FIG_GENERO() : 'm');

/* Dibuja con la 3D si está; si no, con la dibujada */
function dibujar(cv, k, t, clamp, etiquetas, g) {
  const ex = D.exercises[k], m = modelos[g];
  const o = { key: k, labels: etiquetas, text: D.marks, pt: t, dark: oscuro(), gender: g, style: 'persona' };
  if (m) m.draw(cv, ex, t, clamp, o);
  else {
    const cw = cv.clientWidth || 300, dpr = devicePixelRatio || 1;
    if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(cw * 112 / 180 * dpr); }
    window.Figura.draw(cv, ex, t, clamp, { ...o, bg: 'transparent' });
  }
  cv.closest('.fig')?.classList.add('lista');
}

/* Reproductor: encuadre por ejercicio. Se mide una vez qué parte del ancho ocupan la figura, el material y las etiquetas
   durante todo el bucle, y la figura se agranda hasta que eso llena el ancho de la pantalla (sin pasar del alto).
   Así los de pie salen más grandes sin cortar la etiqueta de la zona, la flecha ni la banda (antes se recortaba
   un 15 % fijo por cada lado y se perdían «JUNTA ESCÁPULAS» o «GLÚTEO DE LADO»). */
const anchos = {};
function anchoUtil(k, g) {
  const id = k + g + (oscuro() ? 'o' : 'c'); if (anchos[id]) return anchos[id];
  const fiable = modelos[g] || !crear || !hayWebGL;           // con el 3D aún cargando no se guarda
  const caja = document.createElement('div'); caja.style.cssText = 'position:absolute;left:-9999px;top:0;width:160px';
  const cv = document.createElement('canvas'); cv.style.width = '160px'; caja.appendChild(cv); document.body.appendChild(caja);
  let x0 = 1, x1 = 0;
  try {
    for (let t = 0; t < 6; t += 0.4) {
      dibujar(cv, k, t, false, true, g);
      const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data;
      for (let y = 0; y < h; y++) {
        let n = 0, a = w, b = -1;
        for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 120) { n++; if (x < a) a = x; b = x; }
        if (n > w * 0.8 || b < 0) continue;                    // la línea del suelo cruza todo: no cuenta
        x0 = Math.min(x0, a / w); x1 = Math.max(x1, (b + 1) / w);
      }
    }
  } catch (e) { x0 = 0; x1 = 1; }
  caja.remove();
  if (x1 <= x0) { x0 = 0; x1 = 1; }
  const r = [Math.max(0, x0 - 0.02), Math.min(1, x1 + 0.02)];
  if (fiable) anchos[id] = r;
  return r;
}
function encuadrar(cv, k, g) {
  const hueco = cv.closest('.fig'); if (!hueco || !hueco.clientWidth) return;
  const W = hueco.clientWidth, H = hueco.clientHeight, [a, b] = anchoUtil(k, g);
  const w = Math.min(H * 180 / 112, W / (b - a), W * 1.8), izq = W / 2 - (a + b) / 2 * w;
  cv.style.width = w + 'px'; cv.style.left = Math.min(0, Math.max(W - w, izq)) + 'px';
}

/* Miniaturas: se dibujan una a una (no bloquean la página) y se guardan */
const cache = new Map(), cola = [];
let ocupado = false;
const claveMini = cv => [cv.dataset.fig, generoDe(cv), oscuro() ? 'o' : 'c', Math.round(cv.clientWidth), lookId].join('|');
function copiar(cv, src) {
  if (cv.width !== src.width) { cv.width = src.width; cv.height = src.height; }
  const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(src, 0, 0);
  cv.closest('.fig')?.classList.add('lista');
}
async function trabajar() {
  if (ocupado) return; ocupado = true;
  while (cola.length) {
    const cv = cola.shift(); if (!cv.isConnected || !cv.clientWidth) continue;
    const key = claveMini(cv); if (cache.has(key)) { copiar(cv, cache.get(key)); continue; }
    const g = generoDe(cv); try { await modelo(g); } catch (e) {}
    if (!cv.isConnected) continue;
    const ex = D.exercises[cv.dataset.fig];
    dibujar(cv, cv.dataset.fig, window.Figura.keyT(ex), true, false, g);
    const copia = document.createElement('canvas'); copia.width = cv.width; copia.height = cv.height; copia.getContext('2d').drawImage(cv, 0, 0);
    cache.set(key, copia);
    document.querySelectorAll('canvas[data-modo="mini"]').forEach(o => { if (o !== cv && claveMini(o) === key) copiar(o, copia); });
    await new Promise(r => setTimeout(r, 0));
  }
  ocupado = false;
}

/* Animadas: un bucle para todas; el tiempo sigue aunque app.js repinte la pantalla */
const inicio = new Map();
let raf = 0;
function bucle(now) {
  raf = 0; let quedan = false;
  document.querySelectorAll('canvas[data-modo="grande"],canvas[data-modo="libre"],canvas[data-modo="sig"]').forEach(cv => {
    const k = cv.dataset.fig, g = generoDe(cv); if (!D.exercises[k] || !cv.clientWidth) return;
    if (!modelos[g] && crear && hayWebGL) { modelo(g).then(pedir, pedir); }
    const id = cv.dataset.modo + k; if (!inicio.has(id)) inicio.set(id, now);
    const ex = D.exercises[k], quieto = lento() || cv.closest('[data-quieto]');
    const t = quieto ? window.Figura.keyT(ex) : (now - inicio.get(id)) / 1000;
    dibujar(cv, k, t, !!quieto, cv.dataset.modo !== 'sig', g);
    if (!quieto) quedan = true;
  });
  if (quedan) pedir();
}
const pedir = () => { if (!raf) raf = requestAnimationFrame(bucle); };

function pintar(raiz = document) {
  raiz.querySelectorAll('canvas[data-fig]').forEach(cv => {
    const k = cv.dataset.fig, fig = cv.closest('.fig');
    if (!D.exercises[k]) { fig?.classList.add('sin-figura'); return; }
    if (cv.dataset.modo === 'libre') { const g = generoDe(cv); encuadrar(cv, k, g); if (!modelos[g] && crear && hayWebGL) modelo(g).then(() => encuadrar(cv, k, g), () => {}); }
    if (cv.dataset.modo === 'mini') {
      const key = claveMini(cv);
      if (cache.has(key)) copiar(cv, cache.get(key)); else cola.push(cv);
    }
  });
  // las animadas: dibujo inmediato (sin parpadeo al repintar) y luego el bucle
  const now = performance.now(); bucle(now);
  trabajar();
}

window.FIG = {
  pintar, ejercicios: Object.keys(D.exercises),
  look(nuevo) { look = { ...nuevo }; lookId = JSON.stringify(look); Object.values(modelos).forEach(aplicar); },
  precargar(g) { modelo(g).catch(() => {}); },
};
// el otro modelo en segundo plano, para que el cambio en Ajustes sea rápido
const g0 = window.FIG_GENERO ? window.FIG_GENERO() : 'm';
modelo(g0).then(() => modelo(g0 === 'm' ? 'f' : 'm')).catch(() => {});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => pintar());
let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => pintar(), 150); });
pintar();
