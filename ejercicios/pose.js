// Ayuda para ajustar posturas: node ejercicios/pose.js ejercicio índice 'clave=[x,y(,z)]' …  (cambia rutina.json en su sitio,
// solo la línea de esa postura; el formato del archivo se mantiene)
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '../app/src/main/assets/rutina.json');
let s = fs.readFileSync(F, 'utf8');
const [k, idx, ...cambios] = process.argv.slice(2);
const ini = s.indexOf(`\n    "${k}": {`); if (ini < 0) throw new Error('no está ' + k);
const pi = s.indexOf('"poses": [', ini);
let pos = s.indexOf('\n', pi) + 1;
for (let i = 0; i < +idx; i++) pos = s.indexOf('\n', pos) + 1;
const fin = s.indexOf('\n', pos), linea = s.slice(pos, fin);
const coma = linea.trimEnd().endsWith(',') ? ',' : '', sangria = linea.match(/^\s*/)[0];
const o = JSON.parse(linea.trim().replace(/,$/, ''));
for (const c of cambios) { const [kk, v] = c.split('='); if (v === 'x') delete o[kk]; else o[kk] = JSON.parse(v); }
s = s.slice(0, pos) + sangria + JSON.stringify(o) + coma + s.slice(fin);
fs.writeFileSync(F, s);
console.log(JSON.stringify(o));
