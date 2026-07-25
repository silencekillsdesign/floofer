-- Structured "why" behind an at-risk listing.
--
-- risk_reason is the shelter's own sentence; risk_category is what lets the
-- app explain the mechanism to an adopter. A pit bull at 200+ days reads as a
-- warning about the dog unless something names breed stigma and rental policy
-- as the actual cause.

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

alter table dogs add column risk_category risk_category;

-- Same posture as high_risk_needs_a_reason: an at-risk listing has to say why,
-- in both the shelter's words and a category the app can teach from.
alter table dogs add constraint high_risk_needs_a_category
  check (risk <> 'high' or risk_category is not null);

comment on column dogs.risk_category is
  'Drives the adopter-facing explainer. Most categories are circumstantial — '
  'the shelter''s constraints, not the animal''s behavior.';
