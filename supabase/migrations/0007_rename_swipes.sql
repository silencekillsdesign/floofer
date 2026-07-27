-- "Swipe" is gone from the product language — the app matches people with
-- animals, it doesn't gamify a gesture. This brings the schema in line.
--
-- Cosmetic and safe: nothing in the app reads or writes this table yet, so
-- the rename can't break a running deploy. 0001 is left untouched on purpose;
-- editing an applied migration would leave the file and the database
-- disagreeing about history.
--
-- Re-runnable, and a no-op if it has already been applied.

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'swipes')
     and not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'matches')
  then
    execute 'alter table swipes rename to matches';
    execute 'alter index if exists swipes_likes_idx rename to matches_likes_idx';
    execute 'alter policy swipes_own on matches rename to matches_own';
  end if;
end $$;

comment on table matches is
  'One row per decision: direction ''right'' is a match, ''left'' a pass. '
  'Private to the person who made it — nobody sees who passed on whom.';
