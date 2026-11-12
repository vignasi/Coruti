-- =====================================================================================
-- Rutina core · B1: cuentas y datos en la nube
-- Se pega entero en Supabase → SQL Editor → Run. Se puede volver a ejecutar sin romper nada.
--
-- Cada persona ve y cambia solo lo suyo (RLS: user_id = auth.uid()).
-- La app escribe y lee las sesiones con push_sessions / pull_sessions (una petición, todo o nada)
-- y el resto del estado (ajustes, pesos, bandas, racha) en app_state; las favoritas con replace_favorites.
-- Pensado para lo que viene: planes (Claude y por objetivo), peso y medidas, pulso, Strava y Polar.
-- =====================================================================================

-- ---------- Utilidades ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Personas ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  sex          text check (sex in ('male', 'female', 'other')),
  birth_year   int  check (birth_year between 1900 and 2100),
  height_cm    numeric(5, 1) check (height_cm > 0),
  goal         text,                    -- objetivo con tus palabras («fuerza y bajar de peso»)
  goal_kind    text check (goal_kind in ('strength', 'muscle', 'cardio', 'mobility', 'weight_loss', 'health')),
  settings     jsonb not null default '{}'::jsonb,  -- preferencias de la app que no son del móvil (estilo de figura…)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Al crearse una cuenta se crea su perfil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Estado de la app (lo que hoy está en el móvil y no es historial ni favoritas) ----------
-- data: { days, lastDay, lastRounds, sessions, config, weights, free: { last, bands, bandUse, widgetFav } }
create table if not exists public.app_state (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- Peso y medidas ----------
create table if not exists public.body_measurements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_at timestamptz not null,
  kind        text not null,            -- weight, body_fat, muscle_mass, waist, hip, chest, arm, thigh…
  value       numeric(7, 2) not null,
  unit        text not null,            -- kg, %, cm
  source      text not null default 'manual' check (source in ('manual', 'scale', 'claude', 'import')),
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists body_measurements_user_kind_at on public.body_measurements (user_id, kind, measured_at desc);

-- ---------- Ejercicios propios (el catálogo base sigue en rutina.json dentro de la app) ----------
create table if not exists public.exercises (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key        text not null,             -- clave como en rutina.json; las propias empiezan por «u_»
  name       text not null,
  zone       text,
  needs      text,                      -- material: none, manc, gomas, banda…
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

-- ---------- Planes (de Claude, por objetivo o tuyos) y sus días ----------
create table if not exists public.plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  source     text not null default 'user' check (source in ('user', 'claude', 'goal')),
  goal_kind  text,
  starts_on  date,
  ends_on    date,
  active     boolean not null default true,
  data       jsonb not null default '{}'::jsonb,   -- progresión, notas de Claude…
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plans_user_active on public.plans (user_id, active);

create table if not exists public.plan_days (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id    uuid not null references public.plans (id) on delete cascade,
  day        date not null,
  position   int  not null default 0,  -- varias cosas el mismo día
  kind       text not null default 'strength' check (kind in ('strength', 'core', 'cardio', 'run', 'mobility', 'rest', 'other')),
  title      text not null,
  workout    jsonb,                    -- la sesión lista para empezar (misma forma que una favorita)
  status     text not null default 'planned' check (status in ('planned', 'done', 'skipped')),
  session_id text,                     -- la sesión hecha que lo cumple (workout_sessions.id)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plan_days_user_day on public.plan_days (user_id, day);
create index if not exists plan_days_plan on public.plan_days (plan_id);

-- ---------- Sesiones y series (misma forma que history.json; ver History.kt) ----------
create table if not exists public.workout_sessions (
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id                 text not null,    -- el id que crea el móvil
  kind               text not null,    -- rutina | sueltos (luego: plan, cardio, run…)
  src                text not null default 'app',  -- app | widget | claude | strava
  title              text,
  ab_day             text,             -- A | B | ''
  rounds             int,
  complete           boolean not null default true,
  started_at         timestamptz not null,
  ended_at           timestamptz not null,
  tz_offset_min      int not null default 0,
  feedback           jsonb,            -- cómo te ha ido cada módulo: { abdomen: up|ok|down }
  plan_day_id        uuid references public.plan_days (id) on delete set null,
  -- Para lo que viene (pulso, Strava, Polar)
  hr_avg             int,
  hr_max             int,
  calories           int,
  rpe                int check (rpe between 1 and 10),
  strava_activity_id bigint,
  polar_exercise_id  text,
  extra              jsonb not null default '{}'::jsonb,  -- campos nuevos del móvil que aún no tienen columna
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists workout_sessions_user_started on public.workout_sessions (user_id, started_at desc);
create index if not exists workout_sessions_user_updated on public.workout_sessions (user_id, updated_at, id);
create index if not exists workout_sessions_plan_day on public.workout_sessions (plan_day_id);

create table if not exists public.workout_sets (
  user_id       uuid not null default auth.uid(),
  session_id    text not null,
  idx           int  not null,         -- orden dentro de la sesión
  exercise_key  text not null,
  exercise_name text,
  round         int,
  side          text,
  started_at    timestamptz not null,
  ended_at      timestamptz not null,
  reps          int not null default 0,
  plan_reps     int not null default 0,
  secs          int not null default 0,
  plan_secs     int not null default 0,
  kg            numeric(6, 2),
  band          text,
  module        text,
  skipped       boolean not null default false,
  hr_avg        int,
  hr_max        int,
  primary key (user_id, session_id, idx),
  foreign key (user_id, session_id) references public.workout_sessions (user_id, id) on delete cascade
);
create index if not exists workout_sets_user_exercise on public.workout_sets (user_id, exercise_key, started_at desc);

-- ---------- Favoritas (sesiones de ejercicios sueltos guardadas) ----------
create table if not exists public.favorites (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  position   int  not null default 0,
  data       jsonb not null,           -- la favorita tal cual la guarda la app (ejercicios, rondas, descanso…)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, name)
);

-- ---------- Conexiones (Strava, Polar, Claude) ----------
-- Lo que la app puede ver: si está conectada y con qué cuenta
create table if not exists public.connections (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  provider     text not null check (provider in ('strava', 'polar', 'claude')),
  status       text not null default 'connected' check (status in ('connected', 'error', 'revoked')),
  external_id  text,                   -- id del atleta en Strava, usuario de Polar…
  scopes       text[],
  meta         jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, provider)
);
-- Los tokens: solo los leen las Edge Functions (service role). Sin políticas: nadie entra desde la app
create table if not exists public.connection_secrets (
  user_id       uuid not null references auth.users (id) on delete cascade,
  provider      text not null check (provider in ('strava', 'polar', 'claude')),
  access_token  text,
  refresh_token text,
  expires_at    timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, provider)
);

-- ---------- updated_at automático ----------
do $$
declare t text;
begin
  foreach t in array array['profiles', 'app_state', 'body_measurements', 'exercises', 'plans', 'plan_days',
                           'workout_sessions', 'favorites', 'connections', 'connection_secrets'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- ---------- Seguridad por persona (RLS) ----------
do $$
declare t text;
begin
  foreach t in array array['app_state', 'body_measurements', 'exercises', 'plans', 'plan_days',
                           'workout_sessions', 'workout_sets', 'favorites', 'connections'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists "solo lo mío" on public.%I', t);
    execute format('create policy "solo lo mío" on public.%I for all to authenticated '
                   'using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
drop policy if exists "solo lo mío" on public.profiles;
create policy "solo lo mío" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

alter table public.connection_secrets enable row level security;
revoke all on public.connection_secrets from anon, authenticated;

-- Un día de plan solo puede apuntar a un plan propio
create or replace function public.check_plan_day_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.plans p where p.id = new.plan_id and p.user_id = new.user_id) then
    raise exception 'El plan no es tuyo';
  end if;
  return new;
end;
$$;
drop trigger if exists check_owner on public.plan_days;
create trigger check_owner before insert or update on public.plan_days
  for each row execute function public.check_plan_day_owner();

-- ---------- Funciones que usa la app ----------
-- Todas con security invoker: se ejecutan con los permisos de quien llama, y RLS sigue mandando.

-- Milisegundos (como en el móvil) ↔ timestamptz
create or replace function public.ms_to_ts(ms bigint)
returns timestamptz language sql immutable set search_path = ''
as $$ select to_timestamp(ms / 1000.0) $$;

create or replace function public.ts_to_ms(ts timestamptz)
returns bigint language sql immutable set search_path = ''
as $$ select round(extract(epoch from ts) * 1000)::bigint $$;

-- Sube (o sustituye) sesiones con la forma de history.json. Todo o nada.
create or replace function public.push_sessions(sessions jsonb)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  s jsonb;
  n int := 0;
begin
  if uid is null then raise exception 'Hay que entrar con tu cuenta'; end if;
  for s in select value from jsonb_array_elements(sessions) loop
    if coalesce(s->>'id', '') = '' or jsonb_typeof(s->'sets') is distinct from 'array'
       or s->>'start' is null or s->>'end' is null then continue; end if;
    insert into public.workout_sessions as w
      (user_id, id, kind, src, title, ab_day, rounds, complete, started_at, ended_at, tz_offset_min, feedback, extra)
    values (
      uid, s->>'id', coalesce(s->>'type', 'rutina'), coalesce(s->>'src', 'app'), s->>'title', s->>'day',
      (s->>'rounds')::int, coalesce((s->>'complete')::boolean, true),
      public.ms_to_ts((s->>'start')::bigint), public.ms_to_ts((s->>'end')::bigint),
      coalesce((s->>'tz')::int, 0), s->'fb',
      s - array['id', 'v', 'type', 'src', 'title', 'day', 'rounds', 'complete', 'start', 'end', 'tz', 'fb', 'sets'])
    on conflict (user_id, id) do update set
      kind = excluded.kind, src = excluded.src, title = excluded.title, ab_day = excluded.ab_day,
      rounds = excluded.rounds, complete = excluded.complete, started_at = excluded.started_at,
      ended_at = excluded.ended_at, tz_offset_min = excluded.tz_offset_min, feedback = excluded.feedback,
      extra = excluded.extra;

    delete from public.workout_sets where user_id = uid and session_id = s->>'id';
    insert into public.workout_sets
      (user_id, session_id, idx, exercise_key, exercise_name, round, side, started_at, ended_at,
       reps, plan_reps, secs, plan_secs, kg, band, module, skipped)
    select uid, s->>'id', (e.n - 1)::int, e.x->>'k', e.x->>'name', (e.x->>'r')::int, nullif(e.x->>'side', ''),
           public.ms_to_ts((e.x->>'start')::bigint), public.ms_to_ts((e.x->>'end')::bigint),
           coalesce((e.x->>'reps')::int, 0), coalesce((e.x->>'planReps')::int, 0),
           coalesce((e.x->>'secs')::int, 0), coalesce((e.x->>'planSecs')::int, 0),
           (e.x->>'kg')::numeric, e.x->>'band', e.x->>'mod', coalesce((e.x->>'skipped')::boolean, false)
    from jsonb_array_elements(s->'sets') with ordinality as e(x, n);
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Baja las sesiones cambiadas después de (after_at, after_id), de [max_rows] en [max_rows], con la forma de history.json.
-- Cada una lleva «_u» y «_id» para pedir la página siguiente.
create or replace function public.pull_sessions(after_at timestamptz default '-infinity', after_id text default '', max_rows int default 200)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_agg(x.o order by x.u, x.id), '[]'::jsonb)
  from (
    select w.updated_at as u, w.id,
      jsonb_strip_nulls(jsonb_build_object(
        'id', w.id, 'v', 1, 'type', w.kind, 'src', w.src, 'title', w.title, 'day', w.ab_day,
        'rounds', w.rounds, 'complete', w.complete,
        'start', public.ts_to_ms(w.started_at), 'end', public.ts_to_ms(w.ended_at),
        'tz', w.tz_offset_min, 'fb', w.feedback,
        '_u', w.updated_at, '_id', w.id)) || w.extra || jsonb_build_object('sets', coalesce((
          select jsonb_agg(jsonb_build_object(
            'k', st.exercise_key, 'name', st.exercise_name, 'r', st.round, 'side', coalesce(st.side, ''),
            'start', public.ts_to_ms(st.started_at), 'end', public.ts_to_ms(st.ended_at),
            'reps', st.reps, 'planReps', st.plan_reps, 'secs', st.secs, 'planSecs', st.plan_secs,
            'kg', st.kg, 'band', st.band, 'mod', st.module, 'skipped', st.skipped) order by st.idx)
          from public.workout_sets st
          where st.user_id = w.user_id and st.session_id = w.id), '[]'::jsonb)) as o
    from public.workout_sessions w
    where w.user_id = (select auth.uid())
      and (w.updated_at, w.id) > (after_at, after_id)
    order by w.updated_at, w.id
    limit greatest(1, least(max_rows, 500))
  ) x
$$;

-- Sustituye todas las favoritas por la lista que manda el móvil (en su orden). Todo o nada.
create or replace function public.replace_favorites(favs jsonb)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Hay que entrar con tu cuenta'; end if;
  delete from public.favorites f
  where f.user_id = uid
    and f.name not in (select e.x->>'name' from jsonb_array_elements(favs) as e(x) where coalesce(e.x->>'name', '') <> '');
  insert into public.favorites as f (user_id, name, position, data)
  select distinct on (e.x->>'name') uid, e.x->>'name', (e.n - 1)::int, e.x
  from jsonb_array_elements(favs) with ordinality as e(x, n)
  where coalesce(e.x->>'name', '') <> ''
  order by e.x->>'name', e.n
  on conflict (user_id, name) do update set position = excluded.position, data = excluded.data
    where f.position is distinct from excluded.position or f.data is distinct from excluded.data;
  return (select count(*) from public.favorites where user_id = uid);
end;
$$;

revoke execute on function public.push_sessions(jsonb) from public, anon;
revoke execute on function public.pull_sessions(timestamptz, text, int) from public, anon;
revoke execute on function public.replace_favorites(jsonb) from public, anon;
grant execute on function public.push_sessions(jsonb) to authenticated;
grant execute on function public.pull_sessions(timestamptz, text, int) to authenticated;
grant execute on function public.replace_favorites(jsonb) to authenticated;
