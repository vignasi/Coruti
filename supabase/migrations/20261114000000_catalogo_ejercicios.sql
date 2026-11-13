-- =====================================================================================
-- Rutina core · catálogo de ejercicios en la nube (docs/diseno/4-ejercicios.md)
-- Se pega entero en Supabase → SQL Editor → Run. Se puede volver a ejecutar sin romper nada.
--
-- Una fila por ejercicio, compartida por todas las cuentas (no es de nadie: no lleva user_id).
-- Cada ejercicio pasa por tres pasos: ficha (qué es y para qué sirve), técnica (cómo se hace y qué tiene que cumplir
-- la figura) y figura (el muñeco), cada uno con sus comprobaciones, y luego tu visto bueno («publicado»).
-- Las cuentas solo pueden LEER el catálogo. Se escribe desde el SQL Editor (los datos salen de ejercicios/ en el repo)
-- o, más adelante, desde una Edge Function con la clave secreta (propuestas de Claude, B2).
-- La tabla «exercises» de B1 sigue siendo para los ejercicios propios de cada persona.
-- =====================================================================================

create table if not exists public.exercise_catalog (
  key        text primary key check (key ~ '^[a-z0-9_]+$'),   -- la misma clave que en rutina.json
  name       text not null,
  estado     text not null default 'borrador'
             check (estado in ('borrador', 'ficha', 'tecnica', 'figura', 'publicado')),
  ficha      jsonb not null default '{}'::jsonb,   -- paso 1: patrón, músculos, nivel, progresiones, carga, usos, dosis…
  tecnica    jsonb not null default '{}'::jsonb,   -- paso 2: inicio, fases con apoyos, claves, errores, condiciones
  figura     jsonb not null default '{}'::jsonb,   -- paso 3: posturas, fases, material y vista (lo que dibuja la app)
  revision   jsonb not null default '{}'::jsonb,   -- resultado de las comprobaciones y tu visto bueno
  origen     text not null default 'rutina.json' check (origen in ('rutina.json', 'claude', 'tu')),
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exercise_catalog_estado on public.exercise_catalog (estado);

drop trigger if exists set_updated_at on public.exercise_catalog;
create trigger set_updated_at before update on public.exercise_catalog
  for each row execute function public.set_updated_at();

alter table public.exercise_catalog enable row level security;
revoke all on public.exercise_catalog from anon, authenticated;
grant select on public.exercise_catalog to authenticated;
drop policy if exists "leer el catálogo" on public.exercise_catalog;
create policy "leer el catálogo" on public.exercise_catalog for select to authenticated using (true);
