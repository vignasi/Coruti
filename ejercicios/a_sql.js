// Genera supabase/migrations/20261114000100_catalogo_ejercicios_datos.sql desde ejercicios/fichas.json y rutina.json.
// node ejercicios/a_sql.js   (antes, node ejercicios/comprobar.js tiene que dar 0 fallos)
const fs = require('fs'), path = require('path');
const F = JSON.parse(fs.readFileSync(path.join(__dirname, 'fichas.json'), 'utf8'));
const D = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/src/main/assets/rutina.json'), 'utf8'));
const j = o => { const s = JSON.stringify(o); if (s.includes('$j$')) throw new Error('texto con $j$'); return `$j$${s}$j$::jsonb`; };
const q = s => `'${String(s).replace(/'/g, "''")}'`;
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'tecnicas.json'), 'utf8'));
const FECHA = '2026-11-13';   // pasos 2 y 3 (E2, E3)
const filas = Object.entries(F).map(([k, ficha]) => {
  const ex = D.exercises[k];
  // paso 2: la técnica de ejercicios/tecnicas.json (comprobada con node ejercicios/comprobar.js)
  const tecnica = { revisado: true, ...T[k], video: ex.vid || null };
  // paso 3: la figura de rutina.json (posturas, fases, material, vista y apoyos 3D), comprobada en 3D
  const { name, cues, info, vid, ...fig } = ex;
  const figura = { revisado: true, ...fig };
  const revision = {
    paso1: { ok: true, fecha: '2026-11-14', apuntes: ficha.apuntes },
    paso2: { ok: true, fecha: FECHA, comprobador: 'node ejercicios/comprobar.js' },
    paso3: { ok: true, fecha: FECHA, comprobador: 'node ejercicios/comprobar3d.js (hombre y mujer, cada fase y a mitad)',
      visto_bueno: 'Claude, revisando capturas (claro y oscuro, grande y miniatura), por encargo del usuario' },
  };
  return `(${q(k)}, ${q(ex.name)}, 'publicado', ${j(ficha)}, ${j(tecnica)}, ${j(figura)}, ${j(revision)}, 'rutina.json')`;
});
const sql = `-- Rutina core · los ${filas.length} ejercicios de rutina.json en el catálogo de la nube, con los pasos 1, 2 y 3 hechos (publicados).
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
