-- S1 · Strava con ejercicios y pulso, sin perder Polar Flow
--
-- Cómo funciona (ver docs/strava.md):
--  · Polar Flow sigue recibiendo todo del reloj. Polar → Strava sube solo carreras, trail y caminatas.
--  · Cada sesión nueva en Polar avisa a la Edge Function «polar-aviso». Si a esa hora hay una sesión de la app,
--    se sube a Strava con la lista de ejercicios (formato JSON de fuerza) y el pulso del reloj.
--    Si no la hay y es un entreno (fuerza, circuito, Freeletics…), se reenvía el archivo FIT del reloj tal cual.
--  · Una sesión de la app sin reloj se sube sin pulso a las 3 horas (o al pulsar «Enviar a Strava»).
--  · Cada 15 minutos (pg_cron) se reintenta lo que falló y se sube lo que ya no espera al reloj.
--
-- Se puede volver a ejecutar sin romper nada.

-- ---------- Estado de Strava en cada sesión de la app ----------
alter table public.workout_sessions
  add column if not exists strava_status   text check (strava_status in ('waiting', 'uploading', 'done', 'error', 'duplicate')),
  add column if not exists strava_error    text,
  add column if not exists strava_attempts int not null default 0,
  add column if not exists strava_next_at  timestamptz;
create index if not exists workout_sessions_strava_queue on public.workout_sessions (strava_next_at)
  where strava_status in ('waiting', 'error');

-- ---------- Sesiones que llegan de Polar (solo las usa el servidor; la app puede leer las suyas) ----------
create table if not exists public.polar_exercises (
  user_id            uuid not null references auth.users (id) on delete cascade,
  id                 text not null,       -- id de Polar AccessLink
  started_at         timestamptz not null,
  ended_at           timestamptz not null,
  sport              text,
  detailed_sport     text,
  device             text,
  calories           int,
  hr_avg             int,
  hr_max             int,
  -- new: recién llegada · matched: va con una sesión de la app · forwarded: reenviada a Strava tal cual
  -- kept: carrera o caminata, la sube Polar · error / duplicate: ver «error»
  status             text not null default 'new' check (status in ('new', 'matched', 'forwarded', 'kept', 'error', 'duplicate')),
  session_id         text,
  strava_activity_id bigint,
  error              text,
  attempts           int not null default 0,
  next_at            timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists polar_exercises_queue on public.polar_exercises (next_at) where status in ('new', 'error');
create index if not exists polar_exercises_user_time on public.polar_exercises (user_id, started_at);

drop trigger if exists set_updated_at on public.polar_exercises;
create trigger set_updated_at before update on public.polar_exercises
  for each row execute function public.set_updated_at();

alter table public.polar_exercises enable row level security;
revoke all on public.polar_exercises from anon;
revoke insert, update, delete on public.polar_exercises from authenticated;
drop policy if exists "solo leer lo mío" on public.polar_exercises;
create policy "solo leer lo mío" on public.polar_exercises for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------- Claves del servidor (firma del aviso de Polar, clave de la tarea programada) ----------
-- Nadie entra desde la app: sin políticas y sin permisos para anon ni authenticated.
create table if not exists public.server_secrets (
  name       text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table public.server_secrets enable row level security;
revoke all on public.server_secrets from anon, authenticated;

-- ---------- La app sube y baja sesiones: ahora con esfuerzo, Strava y pulso ----------
-- rpe (esfuerzo de 1 a 10) va a su columna. «strava» y «hr» los escribe solo el servidor:
-- si el móvil los devuelve al subir una sesión, se ignoran.
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
  r int;
begin
  if uid is null then raise exception 'Hay que entrar con tu cuenta'; end if;
  for s in select value from jsonb_array_elements(sessions) loop
    if coalesce(s->>'id', '') = '' or jsonb_typeof(s->'sets') is distinct from 'array'
       or s->>'start' is null or s->>'end' is null then continue; end if;
    r := case when jsonb_typeof(s->'rpe') = 'number' and (s->>'rpe')::numeric between 1 and 10
              then round((s->>'rpe')::numeric)::int end;
    insert into public.workout_sessions as w
      (user_id, id, kind, src, title, ab_day, rounds, complete, started_at, ended_at, tz_offset_min, feedback, rpe, extra)
    values (
      uid, s->>'id', coalesce(s->>'type', 'rutina'), coalesce(s->>'src', 'app'), s->>'title', s->>'day',
      (s->>'rounds')::int, coalesce((s->>'complete')::boolean, true),
      public.ms_to_ts((s->>'start')::bigint), public.ms_to_ts((s->>'end')::bigint),
      coalesce((s->>'tz')::int, 0), s->'fb', r,
      s - array['id', 'v', 'type', 'src', 'title', 'day', 'rounds', 'complete', 'start', 'end', 'tz', 'fb', 'sets',
                'rpe', 'strava', 'hr'])
    on conflict (user_id, id) do update set
      kind = excluded.kind, src = excluded.src, title = excluded.title, ab_day = excluded.ab_day,
      rounds = excluded.rounds, complete = excluded.complete, started_at = excluded.started_at,
      ended_at = excluded.ended_at, tz_offset_min = excluded.tz_offset_min, feedback = excluded.feedback,
      rpe = excluded.rpe, extra = excluded.extra;

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

-- Igual que en B1, más: rpe; strava { s: estado, id: actividad, err: qué pasó }; hr { avg, max } del reloj.
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
        'tz', w.tz_offset_min, 'fb', w.feedback, 'rpe', w.rpe,
        'strava', case when w.strava_status is not null then jsonb_strip_nulls(jsonb_build_object(
          's', w.strava_status, 'id', w.strava_activity_id::text, 'err', w.strava_error)) end,
        'hr', case when w.hr_avg is not null then jsonb_strip_nulls(jsonb_build_object('avg', w.hr_avg, 'max', w.hr_max)) end,
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

revoke execute on function public.push_sessions(jsonb) from public, anon;
revoke execute on function public.pull_sessions(timestamptz, text, int) from public, anon;
grant execute on function public.push_sessions(jsonb) to authenticated;
grant execute on function public.pull_sessions(timestamptz, text, int) to authenticated;

-- ---------- Tarea programada: cada 15 minutos, la Edge Function «conexiones» revisa lo pendiente ----------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- «cron»: la usa la tarea programada para llamar a la Edge Function. «state»: firma el enlace de conectar Strava o Polar
insert into public.server_secrets (name, value)
values ('cron', encode(extensions.gen_random_bytes(24), 'hex')), ('state', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create or replace function public.strava_cron_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://jlyqtxihsorqczlxvbly.supabase.co/functions/v1/conexiones',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-cron', (select value from public.server_secrets where name = 'cron')),
    body := jsonb_build_object('action', 'cron'),
    timeout_milliseconds := 60000);
end;
$$;
revoke execute on function public.strava_cron_tick() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'strava-pendientes') then
    perform cron.unschedule('strava-pendientes');
  end if;
  perform cron.schedule('strava-pendientes', '*/15 * * * *', 'select public.strava_cron_tick()');
end;
$$;
