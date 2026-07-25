-- Structured "why" behind an at-risk listing.
--
-- risk_reason is the shelter's own sentence; risk_category is what lets the
-- app explain the mechanism to an adopter. A pit bull at 200+ days reads as a
-- warning about the dog unless something names breed stigma and rental policy
-- as the actual cause.
--
-- Written to be re-runnable: the SQL editor executes a paste as one
-- transaction, so a single failure rolls back everything after it.

do $$ begin
  create type risk_category as enum (
    'breed-bias',
    'long-stay',
    'senior',
    'medical',
    'capacity',
    'neonatal',
    'unsocialized',
    'behavior',
    'transport'
  );
exception when duplicate_object then null;
end $$;

alter table dogs add column if not exists risk_category risk_category;

-- Rows that predate the column have no category, which would make the
-- constraint below unaddable. 'capacity' is the honest default: it's the
-- reason that needs no claim about the animal.
update dogs
   set risk_category = 'capacity'
 where risk = 'high' and risk_category is null;

alter table dogs drop constraint if exists high_risk_needs_a_category;
alter table dogs add constraint high_risk_needs_a_category
  check (risk <> 'high' or risk_category is not null);

comment on column dogs.risk_category is
  'Drives the adopter-facing explainer. Most categories are circumstantial — '
  'the shelter''s constraints, not the animal''s behavior.';
