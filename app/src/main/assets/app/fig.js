/* Rutina core · la figura en la app (C1). La 3D de D1 (figura/figura3d.js con three.js y los modelos, todo dentro del APK)
   y, si el móvil no tiene WebGL o falla la carga, la dibujada (figura/figura.js), que es el respaldo decidido en D1.
   la interfaz (comun.js y las zonas) pinta <canvas data-fig="ejercicio" data-modo="…"> y llama a FIG.pintar(raíz) después de cada repintado:
   - mini    → postura clave, quieta, sin etiquetas (cuadrícula, listas). Se guarda en caché: no se vuelve a dibujar.
   - grande  → movimiento en bucle con las etiquetas de zona (ficha, vista previa de la figura).
   - libre   → el reproductor, a toda pantalla, con encuadre por ejercicio (D3) y densidad del lienzo como máximo 2.
               El instante lo da reproductor.js (window.FIG_T) para que la figura vaya con los tonos de cada repetición.
   - sig     → movimiento sin etiquetas (el siguiente ejercicio, durante el descanso).
   data-g="m|f" fuerza hombre o mujer; si no, el elegido en Tú → Figura (window.FIG_GENERO). */
const BASE = new URL('figura/', location.href).href;
const DPR_REPRO = 2;                                   // reproductor: como mucho 2 píxeles por dp (D3: la GPU es el cuello de botella)
const lento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
await window.D_LISTA;                                  // rutina.json leído (inicio.js)
const D = window.D;
await new Promise(ok => { if (window.Figura) return ok(); const s = document.createElement('script'); s.src = BASE + 'figura.js'; s.onload = ok; s.onerror = ok; document.head.appendChild(s); });

let crear = null;
const hayWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (hayWebGL && !/[?&]sin3d/.test(location.search)) { try { ({ crear } = await import(BASE + 'figura3d.js')); } catch (e) { console.warn('Sin figura 3D', e); } }

const modelos = {}, cargando = {};
function modelo(g) {
  if (modelos[g]) return Promise.resolve(modelos[g]);
  if (!crear) return Promise.reject(new Error('sin 3D'));
  return cargando[g] || (cargando[g] = crear({ modelo: BASE + 'modelos/persona_' + g + '.glb', gender: g }).then(m => { modelos[g] = m; return m; }));
}
const oscuro = () => getComputedStyle(document.documentElement).getPropertyValue('color-scheme').trim() === 'dark';
const generoDe = cv => cv.dataset.g || (window.FIG_GENERO ? window.FIG_GENERO() : 'm');
const dprDe = cv => cv.dataset.modo === 'libre' || cv.dataset.modo === 'sig' ? Math.min(DPR_REPRO, devicePixelRatio || 1) : (devicePixelRatio || 1);

/* Dibuja con la 3D si está; si no, con la dibujada. Devuelve el estado (fase actual) */
function dibujar(cv, k, t, clamp, etiquetas, g) {
  const ex = D.exercises[k], m = modelos[g], dpr = dprDe(cv);
  const o = { key: k, labels: etiquetas, text: D.marks, pt: t, dark: oscuro(), gender: g, style: 'persona', maxDpr: dpr };
  let st;
  if (m) st = m.draw(cv, ex, t, clamp, o);
  else {
    const cw = cv.clientWidth || 300;
    if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(cw * 112 / 180 * dpr); }
    st = window.Figura.draw(cv, ex, t, clamp, { ...o, bg: 'transparent' });
  }
  const f = cv.closest('.fig'); if (f) { f.classList.add('lista'); f.classList.toggle('tres', !!m); }
  return st;
}

/* Reproductor: encuadre por ejercicio (D3). Se mide una vez qué parte del ancho ocupan la figura, el material y las
   etiquetas durante todo el bucle (con la dibujada: misma geometría y etiquetas que la 3D, sin leer de la GPU), a trozos
   para no bloquear el toque, y la figura se agranda hasta que eso llena el ancho (sin pasar del alto). */
const anchos = {}, midiendo = {};
async function anchoUtil(k, g) {
  const id = k + g; if (anchos[id]) return anchos[id];
  if (midiendo[id]) return midiendo[id];
  return (midiendo[id] = (async () => {
    const caja = document.createElement('div'); caja.style.cssText = 'position:absolute;left:-9999px;top:0;width:120px';
    const cv = document.createElement('canvas'); cv.style.width = '120px'; caja.appendChild(cv); document.body.appendChild(caja);
    let x0 = 1, x1 = 0;
    try {
      for (let t = 0; t < 6; t += 0.5) {
        const cw = cv.clientWidth || 120; if (cv.width !== cw) { cv.width = cw; cv.height = Math.round(cw * 112 / 180); }
        window.Figura.draw(cv, D.exercises[k], t, false, { key: k, labels: true, text: D.marks, pt: t, gender: g, style: 'persona', bg: 'transparent' });
        const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data;
        for (let y = 0; y < h; y++) {
          let n = 0, a = w, b = -1;
          for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 120) { n++; if (x < a) a = x; b = x; }
          if (n > w * 0.8 || b < 0) continue;                  // la línea del suelo cruza todo: no cuenta
          x0 = Math.min(x0, a / w); x1 = Math.max(x1, (b + 1) / w);
        }
        await new Promise(r => setTimeout(r, 0));
      }
    } catch (e) { x0 = 0; x1 = 1; }
    caja.remove(); delete midiendo[id];
    if (x1 <= x0) { x0 = 0; x1 = 1; }
    return (anchos[id] = [Math.max(0, x0 - 0.04), Math.min(1, x1 + 0.04)]);   // margen: el cuerpo 3D tiene grosor
  })());
}
function encuadrar(cv, k, g) {
  const hueco = cv.closest('.fig'); if (!hueco || !hueco.clientWidth) return;
  const id = k + g, W = hueco.clientWidth, H = hueco.clientHeight;
  const [a, b] = anchos[id] || [0, 1];
  const w = Math.min(H * 180 / 112, W / (b - a), W * 1.8), izq = W / 2 - (a + b) / 2 * w;
  cv.style.width = w + 'px'; cv.style.left = Math.min(0, Math.max(W - w, izq)) + 'px';
  if (!anchos[id]) anchoUtil(k, g).then(() => { if (cv.isConnected && cv.dataset.fig === k) encuadrar(cv, k, g); });
  const sig = cv.closest('[data-luego]')?.dataset.luego;           // el siguiente se mide mientras haces este
  if (sig && D.exercises[sig]) setTimeout(() => anchoUtil(sig, g), 1500);
}

/* Miniaturas: una a una (no bloquean la página) y guardadas */
const cache = new Map(), cola = [];
let ocupado = false;
const claveMini = cv => [cv.dataset.fig, generoDe(cv), oscuro() ? 'o' : 'c', Math.round(cv.clientWidth), modelos[generoDe(cv)] ? 3 : 2].join('|');
function copiar(cv, src) {
  if (cv.width !== src.width) { cv.width = src.width; cv.height = src.height; }
  const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(src, 0, 0);
  cv.closest('.fig')?.classList.add('lista');
}
async function trabajar() {
  if (ocupado) return; ocupado = true;
  while (cola.length) {
    const cv = cola.shift(); if (!cv.isConnected || !cv.clientWidth) continue;
    const g = generoDe(cv); try { await modelo(g); } catch (e) {}
    if (!cv.isConnected) continue;
    const key = claveMini(cv); if (cache.has(key)) { copiar(cv, cache.get(key)); continue; }
    dibujar(cv, cv.dataset.fig, window.Figura.keyT(D.exercises[cv.dataset.fig]), true, false, g);
    const copia = document.createElement('canvas'); copia.width = cv.width; copia.height = cv.height; copia.getContext('2d').drawImage(cv, 0, 0);
    cache.set(key, copia);
    document.querySelectorAll('canvas[data-modo="mini"]').forEach(o => { if (o !== cv && claveMini(o) === key) copiar(o, copia); });
    await new Promise(r => setTimeout(r, 0));
  }
  ocupado = false;
}

/* Animadas: un bucle para todas. En el reproductor el instante lo marca reproductor.js (FIG_T); el resto, en bucle libre */
const inicio = new Map();
let raf = 0;
function bucle(now) {
  raf = 0; let quedan = false;
  document.querySelectorAll('canvas[data-modo="grande"],canvas[data-modo="libre"],canvas[data-modo="sig"]').forEach(cv => {
    const k = cv.dataset.fig, g = generoDe(cv); if (!D.exercises[k] || !cv.clientWidth) return;
    if (!modelos[g] && crear) modelo(g).then(() => { if (cv.dataset.modo === 'libre') encuadrar(cv, k, g); pedir(); }, () => {});
    const id = cv.dataset.modo + k; if (!inicio.has(id)) inicio.set(id, now);
    const ex = D.exercises[k], quieto = lento();
    let t = quieto ? window.Figura.keyT(ex) : (now - inicio.get(id)) / 1000, clamp = !!quieto;
    const ext = cv.dataset.modo === 'libre' && window.FIG_T ? window.FIG_T() : null;
    if (ext && !quieto) { t = ext.t; clamp = ext.clamp; }
    const st = dibujar(cv, k, t, clamp, cv.dataset.modo !== 'sig', g);
    if (cv.dataset.modo === 'libre' && window.FIG_FASE && st) window.FIG_FASE(st);
    if (!quieto) quedan = true;
  });
  if (quedan) pedir();
}
const pedir = () => { if (!raf) raf = requestAnimationFrame(bucle); };

function pintar(raiz = document) {
  raiz.querySelectorAll('canvas[data-fig]').forEach(cv => {
    const k = cv.dataset.fig, fig = cv.closest('.fig');
    if (!D.exercises[k]) { fig?.classList.add('sin-figura'); return; }
    if (cv.dataset.modo === 'libre') encuadrar(cv, k, generoDe(cv));
    if (cv.dataset.modo === 'mini') { const key = claveMini(cv); if (cache.has(key)) copiar(cv, cache.get(key)); else cola.push(cv); }
  });
  bucle(performance.now());
  trabajar();
}

window.FIG = { pintar, tres: () => !!crear, precargar(g) { modelo(g).catch(() => {}); } };
const g0 = window.FIG_GENERO ? window.FIG_GENERO() : 'm';
modelo(g0).then(() => pintar()).catch(() => {});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => pintar());
let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => pintar(), 150); });
pintar();
