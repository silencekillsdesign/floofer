-- Direct contact details for listing organisations.
--
-- An adopter looking at a dog with days left shouldn't have to find the
-- shelter's number themselves, and a generic info@ inbox is not a plan when
-- the window is measured in hours. Every listing now carries a named human,
-- a direct line, and a website an adopter can verify the org against.

alter table orgs add column contact_name text;
alter table orgs add column contact_role text;
alter table orgs add column website text;

comment on column orgs.contact_name is
  'A person, not a department. Shown on every pet this org lists.';
comment on column orgs.website is
  'Stored bare (no scheme) and rendered with https://.';
