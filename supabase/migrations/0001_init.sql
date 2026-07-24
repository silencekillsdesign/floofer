-- Floofer — initial schema
-- Pilot scope: shelters authenticate, list dogs, upload photos, and own the
-- adoption + risk state. Adopters browse. Applications land in a later
-- migration; nothing here blocks adding them.
--
-- Run once against a fresh Supabase project (SQL Editor, or `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums ----
-- Mirrors types/index.ts. `municipal` is open-admission (animal control);
-- `shelter` is limited-admission / no-kill.
create type source_type as enum ('shelter', 'municipal', 'foster', 'individual', 'retirement');
create type user_type   as enum ('adopter', 'shelter', 'municipal', 'foster', 'individual', 'retirement');
create type risk_level  as enum ('safe', 'high');
create type dog_sex     as enum ('M', 'F');
create type dog_size    as enum ('small', 'medium', 'large');
create type yns         as enum ('yes', 'no', 'selective');

-- Explicit lifecycle beyond the demo's `adopted` boolean: a dog with an
-- application in flight is neither available nor adopted, and shelters need
-- to pull a listing without deleting its history.
create type adoption_status as enum ('available', 'pending', 'adopted', 'withdrawn');

-- ----------------------------------------------------------------- orgs ----
create table orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        source_type not null,
  city        text not null,
  lat         double precision,
  lng         double precision,
  contact_email text,
  contact_phone text,
  -- Pilot is invite-only: a row exists before anyone can join it.
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------- org_invites ----
-- The pilot's front door. Seeding a row here is what lets a shelter in; the
-- signup trigger below consumes it, so staff are attached to their org the
-- moment they click their magic link. No manual DB edit after the fact, and
-- nobody can list a dog without an invite existing first.
create table org_invites (
  email      text primary key,
  org_id     uuid not null references orgs on delete cascade,
  role       user_type not null,
  invited_at timestamptz not null default now(),
  claimed_at timestamptz
);

-- ------------------------------------------------------------- profiles ----
-- 1:1 with auth.users. The adopter questionnaire stays JSONB: it's a deep,
-- still-evolving shape that is only ever read whole, and normalising ~30
-- optional fields into columns would buy nothing during a pilot.
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  name        text not null default '',
  phone       text not null default '',
  city        text not null default '',
  user_type   user_type not null default 'adopter',
  org_id      uuid references orgs on delete set null,
  traits      jsonb not null default '{"energy":5,"space":5,"social":5,"independence":5,"training":5}',
  adoption    jsonb not null default '{}',
  onboarded_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Only org-affiliated accounts may list dogs; adopters never have an org_id.
alter table profiles add constraint org_only_for_org_types
  check (org_id is null or user_type <> 'adopter');

-- ----------------------------------------------------------------- dogs ----
create table dogs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs on delete cascade,
  created_by    uuid references auth.users on delete set null,

  -- 1 core
  name          text not null,
  species       text not null default 'dog',
  breed         text not null,
  secondary_breed text,
  age           numeric(4,1) not null check (age >= 0 and age <= 30),
  sex           dog_sex not null,
  size          dog_size not null,
  weight_lbs    integer check (weight_lbs > 0 and weight_lbs < 300),

  -- 3 compatibility & behavior
  good_with_dogs yns not null default 'selective',
  good_with_cats yns not null default 'selective',
  good_with_kids text not null default 'older' check (good_with_kids in ('yes','no','older')),
  house_trained  text not null default 'in-training' check (house_trained in ('yes','no','in-training')),
  crate_trained  boolean not null default false,
  traits         jsonb not null default '{"energy":5,"space":5,"social":5,"independence":5,"training":5}',

  -- 4 health
  spay_neuter   text not null default 'no' check (spay_neuter in ('yes','no','scheduled')),
  vaccinated    boolean not null default false,
  microchipped  boolean not null default false,
  medical_notes text,

  -- 5 bio
  tagline       text not null default '',
  bio           text not null default '',
  quirks        text,
  background    text,
  ideal_home    text,

  -- 6 logistics
  city          text not null,
  lat           double precision,
  lng           double precision,
  adoption_fee  integer not null default 0 check (adoption_fee >= 0),

  -- risk, owned by the listing org
  risk          risk_level not null default 'safe',
  risk_reason   text,
  -- The DEADLINE, not a countdown. Days-remaining is derived at read time so
  -- it can never go stale between shelter edits; a date in the past is a
  -- meaningful signal (review overdue), not silently wrong data.
  risk_review_date date,

  status        adoption_status not null default 'available',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- A countdown with nothing driving it is the failure mode this guards.
alter table dogs add constraint high_risk_needs_a_reason
  check (risk <> 'high' or (risk_reason is not null and length(trim(risk_reason)) > 0));

create index dogs_browse_idx on dogs (status, risk) where status = 'available';
create index dogs_org_idx    on dogs (org_id);
-- Bounding-box prefilter for "dogs near me". Enough until it isn't; PostGIS
-- is one CREATE EXTENSION away if this ever stops being enough.
create index dogs_geo_idx    on dogs (lat, lng);

-- ----------------------------------------------------------- dog_photos ----
-- Separate table rather than text[]: photos need stable ordering, individual
-- deletion, and a storage path that outlives any one render.
create table dog_photos (
  id           uuid primary key default gen_random_uuid(),
  dog_id       uuid not null references dogs on delete cascade,
  storage_path text not null,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (dog_id, position)
);

create index dog_photos_dog_idx on dog_photos (dog_id, position);

-- --------------------------------------------------------------- swipes ----
create table swipes (
  user_id    uuid not null references auth.users on delete cascade,
  dog_id     uuid not null references dogs on delete cascade,
  direction  text not null check (direction in ('left', 'right')),
  created_at timestamptz not null default now(),
  primary key (user_id, dog_id)
);

create index swipes_likes_idx on swipes (user_id) where direction = 'right';

-- ------------------------------------------------------------ updated_at ---
create or replace function touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger dogs_touch before update on dogs
  for each row execute function touch_updated_at();

-- --------------------------------------------------- new-user bootstrap ----
-- Supabase inserts into auth.users out of band; without this a fresh signup
-- has no profile row and every RLS check against profiles fails.
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  invite public.org_invites%rowtype;
begin
  -- Case-insensitive: people type their work email however they please, and a
  -- missed invite silently downgrades a shelter to an adopter account.
  select * into invite from public.org_invites
   where lower(email) = lower(coalesce(new.email, ''));

  insert into public.profiles (id, email, user_type, org_id)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(invite.role, 'adopter'::public.user_type),
    invite.org_id
  )
  on conflict (id) do nothing;

  if invite.email is not null then
    update public.org_invites set claimed_at = now() where email = invite.email;
  end if;

  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------------ RLS ----
alter table orgs        enable row level security;
-- No policies on org_invites: RLS-enabled with zero policies denies every
-- client. Only the signup trigger (security definer) and the seeding script
-- (service key) touch it, so an invite list of shelter emails stays private.
alter table org_invites enable row level security;
alter table profiles   enable row level security;
alter table dogs       enable row level security;
alter table dog_photos enable row level security;
alter table swipes     enable row level security;

-- Which org the caller belongs to. SECURITY DEFINER so policies on `dogs`
-- can read `profiles` without recursing through profiles' own policies.
create or replace function my_org_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- orgs: world-readable (adopters see who lists a dog); no self-serve writes
-- during the invite-only pilot.
create policy orgs_read on orgs for select using (true);

-- profiles: strictly your own.
create policy profiles_read   on profiles for select using (auth.uid() = id);
create policy profiles_insert on profiles for insert with check (auth.uid() = id);
create policy profiles_update on profiles for update using (auth.uid() = id);

-- dogs: anyone (signed in or not) reads listings that are actually listable;
-- only members of the owning org write.
create policy dogs_read_public on dogs for select
  using (status in ('available', 'pending'));
create policy dogs_read_own on dogs for select
  using (org_id = my_org_id());
create policy dogs_insert on dogs for insert
  with check (org_id = my_org_id());
create policy dogs_update on dogs for update
  using (org_id = my_org_id());
create policy dogs_delete on dogs for delete
  using (org_id = my_org_id());

-- photos inherit their dog's visibility.
create policy dog_photos_read on dog_photos for select
  using (exists (
    select 1 from dogs d
    where d.id = dog_photos.dog_id
      and (d.status in ('available','pending') or d.org_id = my_org_id())
  ));
create policy dog_photos_write on dog_photos for all
  using (exists (select 1 from dogs d where d.id = dog_photos.dog_id and d.org_id = my_org_id()))
  with check (exists (select 1 from dogs d where d.id = dog_photos.dog_id and d.org_id = my_org_id()));

-- swipes: private to the swiper. Nobody sees who passed on whom.
create policy swipes_own on swipes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
