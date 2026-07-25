-- Structured "why" behind an at-risk listing.
--
-- risk_reason is the shelter's own sentence; risk_category is what lets the
-- app explain the mechanism to an adopter. A pit bull at 200+ days reads as a
-- warning about the dog unless something names breed stigma and rental policy
-- as the actual cause.
--
-- NOTE ON STRUCTURE: statements that reference the new column run through
-- EXECUTE. The SQL editor resolves a pasted script before running it, so a
-- plain UPDATE naming risk_category fails on a database where the column is
-- only created earlier in that same script. Dynamic SQL is parsed at run
-- time, after the column exists. Safe to run more than once.

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

do $$
begin
  -- Rows that predate the column have no category, which would make the
  -- constraint unaddable. 'capacity' is the honest default: it's the one
  -- reason that makes no claim about the animal.
  execute $q$
    update dogs
       set risk_category = 'capacity'
     where risk = 'high' and risk_category is null
  $q$;

  execute $q$alter table dogs drop constraint if exists high_risk_needs_a_category$q$;

  execute $q$
    alter table dogs add constraint high_risk_needs_a_category
      check (risk <> 'high' or risk_category is not null)
  $q$;
end $$;

comment on column dogs.risk_category is
  'Drives the adopter-facing explainer. Most categories are circumstantial — '
  'the shelter''s constraints, not the animal''s behavior.';
