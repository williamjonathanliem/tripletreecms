-- Triple Tree CMS — Full Reset
-- ⚠️  DROPS ALL DATA AND RECREATES EVERYTHING
-- Run this in Supabase SQL Editor

-- ─── Drop trigger & function ──────────────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ─── Drop RLS policies ─────────────────────────────────────────────────────

drop policy if exists "teachers: select own" on teachers;
drop policy if exists "teachers: insert own" on teachers;
drop policy if exists "teachers: update own" on teachers;

drop policy if exists "students: all own" on students;
drop policy if exists "trial_students: all own" on trial_students;

drop policy if exists "classes: all own" on classes;

drop policy if exists "class_students: all own" on class_students;

drop policy if exists "class_sessions: all own" on class_sessions;

drop policy if exists "attendance: select own" on attendance;
drop policy if exists "attendance: insert own" on attendance;
drop policy if exists "attendance: update own" on attendance;
drop policy if exists "attendance: delete own" on attendance;

drop policy if exists "class_feedback: all own" on class_feedback;

-- ─── Drop tables (order matters for FK constraints) ───────────────────────

drop table if exists attendance cascade;
drop table if exists class_feedback cascade;
drop table if exists class_sessions cascade;
drop table if exists class_students cascade;
drop table if exists trial_students cascade;
drop table if exists classes cascade;
drop table if exists students cascade;
drop table if exists teachers cascade;

-- ═══════════════════════════════════════════════════════════════════════════
-- FRESH SCHEMA — everything below is idempotent
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Core tables ───────────────────────────────────────────────────────────

create table if not exists teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  name text not null,
  age int not null,
  tier text not null,
  branch text not null,
  module_current int default 0,
  module_total int not null,
  enrolled_date date not null,
  parent_contact text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  tier text not null,
  branch text not null,
  schedule_day text,
  schedule_time time,
  created_at timestamptz default now()
);

create table if not exists trial_students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  name text not null,
  age int not null,
  tier text not null,
  class_id uuid references classes(id) on delete set null,
  trial_date date not null,
  parent_name text,
  parent_contact text,
  notes text,
  outcome text default 'pending' check (outcome in ('pending','converting','dropped')),
  created_at timestamptz default now()
);

create table if not exists class_students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  added_at timestamptz default now(),
  unique(class_id, student_id)
);

create table if not exists class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade not null,
  teacher_id uuid references teachers(id) on delete cascade not null,
  session_date date not null,
  session_time time not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references class_sessions(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  status text not null check (status in ('present','absent','late','excused')),
  note text,
  created_at timestamptz default now(),
  unique(session_id, student_id)
);

create table if not exists class_feedback (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade not null,
  teacher_id uuid references teachers(id) on delete cascade not null,
  how_was_class text not null,
  topics_covered text not null,
  other_comments text,
  created_at timestamptz default now()
);

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table teachers       enable row level security;
alter table students       enable row level security;
alter table trial_students enable row level security;
alter table classes        enable row level security;
alter table class_students enable row level security;
alter table class_sessions enable row level security;
alter table attendance     enable row level security;
alter table class_feedback enable row level security;

create policy "teachers: select own" on teachers for select using (id = auth.uid());
create policy "teachers: insert own" on teachers for insert with check (id = auth.uid());
create policy "teachers: update own" on teachers for update using (id = auth.uid());

create policy "students: all own"       on students       for all using (teacher_id = auth.uid());
create policy "trial_students: all own" on trial_students for all using (teacher_id = auth.uid());

create policy "classes: all own" on classes for all using (teacher_id = auth.uid());

create policy "class_students: all own" on class_students for all
  using (exists (
    select 1 from classes where classes.id = class_students.class_id and classes.teacher_id = auth.uid()
  ));

create policy "class_sessions: all own" on class_sessions for all using (teacher_id = auth.uid());

create policy "attendance: select own" on attendance for select
  using (exists (
    select 1 from class_sessions cs join classes c on c.id = cs.class_id
    where cs.id = attendance.session_id and c.teacher_id = auth.uid()
  ));
create policy "attendance: insert own" on attendance for insert
  with check (exists (
    select 1 from class_sessions cs join classes c on c.id = cs.class_id
    where cs.id = session_id and c.teacher_id = auth.uid()
  ));
create policy "attendance: update own" on attendance for update
  using (exists (
    select 1 from class_sessions cs join classes c on c.id = cs.class_id
    where cs.id = attendance.session_id and c.teacher_id = auth.uid()
  ));
create policy "attendance: delete own" on attendance for delete
  using (exists (
    select 1 from class_sessions cs join classes c on c.id = cs.class_id
    where cs.id = attendance.session_id and c.teacher_id = auth.uid()
  ));

create policy "class_feedback: all own" on class_feedback for all using (teacher_id = auth.uid());

-- ─── Trigger: auto-create teacher row on signup ─────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.teachers (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Backfill teacher rows for EXISTING users ───────────────────────────────
-- This is needed after a full reset since dropping the teachers table
-- removes rows for users who signed up before the reset.
insert into public.teachers (id, name, email)
select
  id,
  coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  email
from auth.users
on conflict (id) do nothing;
