-- Structured address and organisation details on the profile.
--
-- The adoption profile has been local-only until now: an adopter could fill
-- in landlord, vet reference and household make-up, and none of it left their
-- browser. Fine while there was nothing to sync to; not fine once a shelter
-- is meant to verify them, or once they switch phones.
--
-- Both are jsonb because the shapes are still moving and neither is queried —
-- they're read whole, by the person they belong to. Promote to columns if
-- that ever changes.

alter table profiles add column if not exists address jsonb not null default '{}';
alter table profiles add column if not exists org jsonb not null default '{}';

comment on column profiles.address is
  'Full postal address. A shelter cannot run a home check against a city name.';
comment on column profiles.org is
  'Organisation name, website and named contact. Empty for adopters and '
  'private rehomers.';
