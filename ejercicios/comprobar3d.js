// Comprobaciones del paso 3 (docs/diseno/4-ejercicios.md) sobre la figura 3D de la app, hombre y mujer, en cada fase
// y a mitad de cada movimiento: apoyos que tocan, nada más toca ni atraviesa, condiciones de la técnica y rangos.
//   node ejercicios/comprobar3d.js [ejercicio,ejercicio…] [--json salida.json]
// Necesita Playwright con Chromium (require('playwright')). Sirve la raíz del repo él solo. Falla (código 1) si algo no cumple.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const {comprobar} = require('./reglas3d');

const RAIZ = path.join(__dirname, '..');
const TIPOS = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary'};
const args = process.argv.slice(2), jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const ex = args.find(a => !a.startsWith('--') && a !== jsonOut) || '';

(async () => {
  const srv = http.createServer((req, res) => {
    const f = path.join(RAIZ, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(res);
  }).listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  const b = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'tecnicas.json'), 'utf8'));
  const todo = {}, informe = {};
  try {
    for (const g of ['m', 'f']) {
      const p = await b.newPage();
      p.on('pageerror', e => { console.error('ERROR en la página', e.message); process.exitCode = 1; });
      await p.goto(`${base}/ejercicios/comprobar3d.html?g=${g}${ex ? '&ex=' + ex : ''}`);
      await p.waitForFunction(() => window.__done, null, {timeout: 900000});
      todo[g] = await p.evaluate(() => window.res);
      await p.close();
    }
  } finally { await b.close(); srv.close(); }
  let n = 0, mal = 0;
  for (const k of Object.keys(todo.m)) {
    const f = {};
    for (const g of ['m', 'f']) for (const x of comprobar(T[k], todo[g][k])) (f[x] = f[x] || []).push(g === 'm' ? 'hombre' : 'mujer');
    const lineas = Object.entries(f).map(([t, gs]) => `${t}${gs.length < 2 ? ' [' + gs[0] + ']' : ''}`);
    informe[k] = lineas; n++;
    if (lineas.length) { mal++; console.log(`✗ ${k} (${lineas.length})\n  - ` + lineas.join('\n  - ')); }
    else console.log(`✓ ${k}`);
  }
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({informe, medidas: todo}, null, 1));
  console.log(`Paso 3: ${n - mal} de ${n} ejercicios sin fallos.`);
  if (mal) process.exitCode = 1;
})();
