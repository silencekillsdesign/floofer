-- Fast-Pass verification queue.
--
-- Verifying an adopter means a shelter reads their landlord details, vet
-- reference and home photos. profiles is self-read-only and stays that way:
-- instead of widening it, an adopter *submits an application* to one named
-- organisation, and that act is what grants access.
--
-- The application carries a SNAPSHOT of the fields being reviewed rather than
-- pointing at the live profile. Three reasons: the org sees exactly what was
-- consented to, editing a profile later can't silently change what was
-- approved, and there's an audit trail of what the decision was based on.
--
-- Re-runnable, so a failed paste can simply be pasted again.

do $$ begin
  create type fast_pass_state as enum ('pending', 'verified', 'declined', 'withdrawn');
exception when duplicate_object then null;
end $$;

create table if not exists fast_pass_applications (
  id           uuid primary key default gen_random_uuid(),
  adopter_id   uuid not null references auth.users on delete cascade,
  org_id       uuid not null references orgs on delete cascade,
  state        fast_pass_state not null default 'pending',

  -- What the adopter is offering to do.
  capabilities    text[] not null default '{}',
  response_window text not null,

  /* Snapshot of the reviewed fields at submission time. Deliberately narrow —
     only what a verifier actually needs, not the whole adoption profile. */
  snapshot     jsonb not null,

  submitted_at timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid references auth.users on delete set null,
  /* Shown to the adopter on decline, so a rejection is actionable. */
  reviewer_note text,

  -- One live application per adopter per org.
  unique (adopter_id, org_id)
);

create index if not exists fpa_org_queue_idx
  on fast_pass_applications (org_id, state, submitted_at);
create index if not exists fpa_adopter_idx
  on fast_pass_applications (adopter_id);

alter table fast_pass_applications enable row level security;

-- Adopter: full control over their own application, including withdrawing it.
drop policy if exists fpa_adopter_read on fast_pass_applications;
create policy fpa_adopter_read on fast_pass_applications for select
  using (auth.uid() = adopter_id);

drop policy if exists fpa_adopter_insert on fast_pass_applications;
create policy fpa_adopter_insert on fast_pass_applications for insert
  with check (auth.uid() = adopter_id);

drop policy if exists fpa_adopter_update on fast_pass_applications;
create policy fpa_adopter_update on fast_pass_applications for update
  using (auth.uid() = adopter_id);

drop policy if exists fpa_adopter_delete on fast_pass_applications;
create policy fpa_adopter_delete on fast_pass_applications for delete
  using (auth.uid() = adopter_id);

-- Org staff: read applications addressed to their org, and rule on them.
-- No insert policy — an org cannot manufacture an application on someone's
-- behalf, which is what makes the adopter's submission the consent record.
drop policy if exists fpa_org_read on fast_pass_applications;
create policy fpa_org_read on fast_pass_applications for select
  using (org_id = my_org_id());

drop policy if exists fpa_org_update on fast_pass_applications;
create policy fpa_org_update on fast_pass_applications for update
  using (org_id = my_org_id())
  with check (org_id = my_org_id());

comment on column fast_pass_applications.snapshot is
  'Frozen copy of the reviewed fields. The org never reads the live profile.';
