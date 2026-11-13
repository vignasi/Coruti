// Genera supabase/migrations/20261114000100_catalogo_ejercicios_datos.sql desde ejercicios/fichas.json y rutina.json.
// node ejercicios/a_sql.js   (antes, node ejercicios/comprobar.js tiene que dar 0 fallos)
const fs = require('fs'), path = require('path');
const F = JSON.parse(fs.readFileSync(path.join(__dirname, 'fichas.json'), 'utf8'));
const D = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/src/main/assets/rutina.json'), 'utf8'));
const j = o => { const s = JSON.stringify(o); if (s.includes('$j$')) throw new Error('texto con $j$'); return `$j$${s}$j$::jsonb`; };
const q = s => `'${String(s).replace(/'/g, "''")}'`;
const filas = Object.entries(F).map(([k, ficha]) => {
  const ex = D.exercises[k];
  // técnica y figura: lo que hay hoy en rutina.json, sin revisar (los pasos 2 y 3 lo rehacen)
  const tecnica = { revisado: false, info: ex.info || null, claves: ex.cues,
    fases: ex.phases.map(p => ({ texto: p.cap || '', segundos: +(p.move + p.hold).toFixed(2), tono: p.tone || null })), video: ex.vid || null };
  const { name, cues, info, vid, ...fig } = ex;
  const figura = { revisado: false, ...fig };
  const revision = { paso1: { ok: true, fecha: '2026-11-14', apuntes: ficha.apuntes } };
  return `(${q(k)}, ${q(ex.name)}, 'ficha', ${j(ficha)}, ${j(tecnica)}, ${j(figura)}, ${j(revision)}, 'rutina.json')`;
});
const sql = `-- Rutina core · los ${filas.length} ejercicios de rutina.json en el catálogo de la nube, con el paso 1 (ficha) hecho.
-- GENERADO por ejercicios/a_sql.js: no se edita a mano. Se pega en Supabase → SQL Editor → Run, después de
-- 20261114000000_catalogo_ejercicios.sql. Se puede volver a ejecutar: actualiza lo que haya.
insert into public.exercise_catalog (key, name, estado, ficha, tecnica, figura, revision, origen) values
${filas.join(',\n')}
on conflict (key) do update set
  name = excluded.name, estado = excluded.estado, ficha = excluded.ficha, tecnica = excluded.tecnica,
  figura = excluded.figura, revision = excluded.revision, version = public.exercise_catalog.version + 1;
`;
fs.writeFileSync(path.join(__dirname, '../supabase/migrations/20261114000100_catalogo_ejercicios_datos.sql'), sql);
console.log(`SQL con ${filas.length} ejercicios (${Math.round(sql.length / 1024)} KB)`);
