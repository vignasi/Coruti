// Guarda las imágenes del widget (figura 3D) en widget/{m,f}/{claro,oscuro}/<ejercicio>_<fase>.webp
// Uso: python3 -m http.server en la raíz del repo y luego  node hacer_imagenes.js [http://127.0.0.1:8000] [ancho] [calidad]
// Necesita Playwright (require('playwright')) con Chromium.
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const base = process.argv[2] || 'http://127.0.0.1:8000', w = process.argv[3] || '400', q = process.argv[4] || '0.8';
  const b = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  for (const g of ['m', 'f']) for (const theme of ['claro', 'oscuro']) {
    const p = await b.newPage({viewport: {width: 1200, height: 800}, deviceScaleFactor: 1});
    p.on('pageerror', e => console.log('ERROR', e.message));
    await p.goto(`${base}/docs/diseno/figura/widget/hacer.html?g=${g}&w=${w}&q=${q}${theme === 'oscuro' ? '&theme=dark' : ''}`);
    await p.waitForFunction(() => window.__done, null, {timeout: 600000});
    const imgs = await p.evaluate(() => window.imgs);
    const dir = path.join(__dirname, g, theme);
    fs.mkdirSync(dir, {recursive: true});
    let bytes = 0;
    for (const [k, url] of Object.entries(imgs)) {
      const buf = Buffer.from(url.split(',')[1], 'base64');
      fs.writeFileSync(path.join(dir, k + '.webp'), buf);
      bytes += buf.length;
    }
    console.log(g, theme, Object.keys(imgs).length, 'imágenes', (bytes / 1024).toFixed(0), 'KB');
    await p.close();
  }
  await b.close();
})();
