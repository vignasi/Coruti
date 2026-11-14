// Ayuda para ajustar: node ejercicios/ver.js ejercicio  → por fase (final) y sexo, a qué distancia del suelo queda cada parte
// (cm, solo lo que está a menos de 12) y las distancias que pide la técnica. Usa las medidas de comprobar3d.js --json.
const fs = require('fs');
const [k, f = '/tmp/medidas.json'] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(f, 'utf8'));
for (const g of ['m', 'f']) for (const m of d.medidas[g][k]) {
  if (m.momento !== 'fin') continue;
  const r = Object.entries(m.reg).filter(([, v]) => v.suelo < 12).sort((a, b) => a[1].suelo - b[1].suelo).map(([n, v]) => `${n} ${v.suelo}`);
  const c = Object.entries(m.reg).map(([n, v]) => v.cajas.map((x, j) => x < 6 ? `${n}→${m.cajas[j]} ${x}` : null)).flat().filter(Boolean);
  console.log(`${g} fase ${m.fase + 1}: ${r.join(' · ')}${c.length ? '\n   muebles: ' + c.join(' · ') : ''}${Object.keys(m.dist).length ? '\n   ' + JSON.stringify(m.dist) : ''}`);
}
