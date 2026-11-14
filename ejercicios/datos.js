// rutina.json con los borradores de ejercicios/borradores.json añadidos, para los comprobadores y el SQL del catálogo.
// Un borrador es un ejercicio con los pasos hechos que aún no tiene el visto bueno del usuario: no está en rutina.json
// (la app enseña todo lo que hay en «exercises»), así que no sale en la app. Con el visto bueno se pasa a rutina.json
// (su «ejercicio» a «exercises» y su «catalogo» a «catalog.ex») y se quita de borradores.json.
const fs = require('fs'), path = require('path');
const RUTINA = path.join(__dirname, '../app/src/main/assets/rutina.json');
const BORRADORES = path.join(__dirname, 'borradores.json');
const ESTADOS = ['borrador', 'ficha', 'tecnica', 'figura'];
function cargar() {
  const D = JSON.parse(fs.readFileSync(RUTINA, 'utf8'));
  const B = fs.existsSync(BORRADORES) ? JSON.parse(fs.readFileSync(BORRADORES, 'utf8')) : {};
  for (const [k, b] of Object.entries(B)) {
    if (D.exercises[k]) throw new Error(`${k} está en rutina.json y en borradores.json`);
    if (!ESTADOS.includes(b.estado)) throw new Error(`${k}: estado «${b.estado}» (vale ${ESTADOS.join(', ')})`);
    D.exercises[k] = b.ejercicio;
    D.catalog.ex[k] = b.catalogo;
  }
  return {D, B};
}
module.exports = {cargar, RUTINA, BORRADORES};
