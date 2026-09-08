-- Tamaouz database schema
-- Run this in the Supabase SQL Editor after creating a project.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  academic_title text,
  workplace text,
  department text,
  level text,
  city text,
  country text,
  mobile text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique not null default ('TM-' || to_char(now(),'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,5))),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null,
  project_title text not null,
  details jsonb not null default '{}'::jsonb,
  deadline date,
  status text not null default 'Submitted' check (status in ('Submitted','Under Review','In Progress','Ready for Review','Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.request_files enable row level security;

revoke all on public.profiles, public.requests, public.request_files from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.requests to authenticated;
grant update on public.requests to authenticated;
grant select, insert, delete on public.request_files to authenticated;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Users create own profile" on public.profiles;
create policy "Users create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Users read own requests" on public.requests;
create policy "Users read own requests" on public.requests for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users create own requests" on public.requests;
create policy "Users create own requests" on public.requests for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own requests" on public.requests;
create policy "Users update own requests" on public.requests for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users read own files" on public.request_files;
create policy "Users read own files" on public.request_files for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users create own files" on public.request_files;
create policy "Users create own files" on public.request_files for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own files" on public.request_files;
create policy "Users delete own files" on public.request_files for delete to authenticated using ((select auth.uid()) = user_id);

-- Admin policies use the role stored in app_metadata, not user-editable metadata.
drop policy if exists "Admins read all requests" on public.requests;
create policy "Admins read all requests" on public.requests for select to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins update all requests" on public.requests;
create policy "Admins update all requests" on public.requests for update to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create index if not exists requests_user_id_idx on public.requests(user_id);
create index if not exists requests_status_idx on public.requests(status);
create index if not exists request_files_request_id_idx on public.request_files(request_id);
