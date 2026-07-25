-- Play dates: the meet-and-greet.
--
-- This is where adoptions are won or lost. A kennel-stressed dog reads as
-- unadoptable behind bars and like himself in a yard, so the meeting is the
-- argument — and scheduling it is the friction that stops it happening.
--
-- The adopter offers a few day-part windows and the shelter picks one. No
-- message thread, no timezone maths: shelters schedule in "Saturday morning".
--
-- Statements naming the new table run through EXECUTE, since the SQL editor
-- resolves a pasted script before running any of it. Safe to run twice.

do $$ begin
  create type play_date_state as enum
    ('requested', 'confirmed', 'declined', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists play_dates (
  id          uuid primary key default gen_random_uuid(),
  dog_id      uuid not null references dogs on delete cascade,
  adopter_id  uuid not null references auth.users on delete cascade,
  org_id      uuid not null references orgs on delete cascade,
  state       play_date_state not null default 'requested',

  /* [{ "date": "2026-08-01", "part": "morning" }, …] — what the adopter can do. */
  proposed_slots jsonb not null default '[]',
  /* The one the shelter picked. Null until confirmed. */
  confirmed_slot jsonb,

  location    text,
  adopter_note text,
  org_note     text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One open request per adopter per dog; asking twice is a reschedule.
  unique (dog_id, adopter_id)
);

do $$
begin
  execute $q$create index if not exists play_dates_org_idx
             on play_dates (org_id, state, created_at)$q$;
  execute $q$create index if not exists play_dates_adopter_idx
             on play_dates (adopter_id, created_at)$q$;

  execute $q$alter table play_dates enable row level security$q$;

  -- Adopter: their own requests, including cancelling.
  execute $q$drop policy if exists pd_adopter_read on play_dates$q$;
  execute $q$create policy pd_adopter_read on play_dates for select
             using (auth.uid() = adopter_id)$q$;

  execute $q$drop policy if exists pd_adopter_insert on play_dates$q$;
  execute $q$create policy pd_adopter_insert on play_dates for insert
             with check (auth.uid() = adopter_id)$q$;

  execute $q$drop policy if exists pd_adopter_update on play_dates$q$;
  execute $q$create policy pd_adopter_update on play_dates for update
             using (auth.uid() = adopter_id)$q$;

  execute $q$drop policy if exists pd_adopter_delete on play_dates$q$;
  execute $q$create policy pd_adopter_delete on play_dates for delete
             using (auth.uid() = adopter_id)$q$;

  -- Org staff: requests for their animals, and the right to answer them.
  -- No insert policy: a shelter cannot invent a request on someone's behalf.
  execute $q$drop policy if exists pd_org_read on play_dates$q$;
  execute $q$create policy pd_org_read on play_dates for select
             using (org_id = my_org_id())$q$;

  execute $q$drop policy if exists pd_org_update on play_dates$q$;
  execute $q$create policy pd_org_update on play_dates for update
             using (org_id = my_org_id())
             with check (org_id = my_org_id())$q$;

  execute $q$drop trigger if exists play_dates_touch on play_dates$q$;
  execute $q$create trigger play_dates_touch before update on play_dates
             for each row execute function touch_updated_at()$q$;
end $$;

comment on column play_dates.proposed_slots is
  'Day-part windows the adopter offered. Shelters schedule in "Saturday '
  'morning", and day parts avoid timezone drift between phone and desktop.';
