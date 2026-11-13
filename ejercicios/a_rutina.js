// Pasa los textos del paso 2 (ejercicios/tecnicas.json) a rutina.json, que es lo que lee la app hoy:
// claves → "cues" y texto de cada fase → "cap". Cambia solo esas líneas; el resto del archivo queda igual.
//   node ejercicios/a_rutina.js   (después, node ejercicios/comprobar.js tiene que dar 0 fallos)
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '../app/src/main/assets/rutina.json');
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'tecnicas.json'), 'utf8'));
let s = fs.readFileSync(F, 'utf8'), cambios = 0;
const js = x => JSON.stringify(x);
for (const [k, t] of Object.entries(T)) {
  const ini = s.indexOf(`\n    "${k}": {`); if (ini < 0) throw new Error('no está ' + k);
  const fin = s.indexOf('\n    }', ini);
  let b = s.slice(ini, fin);
  // claves: el bloque "cues": [ … ] con una clave por línea
  b = b.replace(/("cues": \[\n)([\s\S]*?)(\n\s*\],)/, (m, a, cuerpo, z) => {
    const sangria = (cuerpo.match(/^\s*/) || [''])[0];
    const nuevo = t.claves.map(c => sangria + js(c)).join(',\n');
    if (nuevo !== cuerpo) cambios++;
    return a + nuevo + z;
  });
  // fases: el "cap" de cada línea de "phases", en orden
  const pi = b.indexOf('"phases": [');
  let i = 0;
  b = b.slice(0, pi) + b.slice(pi).replace(/"cap":"((?:[^"\\]|\\.)*)"/g, (m, cap) => {
    const nuevo = t.fases[i++].texto;
    if (JSON.parse('"' + cap + '"') !== nuevo) cambios++;
    return '"cap":' + js(nuevo);
  });
  if (i !== t.fases.length) throw new Error(`${k}: ${i} fases en rutina.json y ${t.fases.length} en la técnica`);
  s = s.slice(0, ini) + b + s.slice(fin);
}
JSON.parse(s);
fs.writeFileSync(F, s);
console.log(`rutina.json: ${cambios} textos cambiados`);
