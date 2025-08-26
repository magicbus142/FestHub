-- Add bilingual name columns to donations table
alter table if exists donations
  add column if not exists name_telugu text null,
  add column if not exists name_english text null;

-- Optional: backfill telugu name from legacy name if bilingual fields are empty
update donations
set name_telugu = coalesce(name_telugu, case when name_telugu is null and name_english is null then name else name_telugu end)
where true;

-- Note: No NOT NULL constraints added; UI enforces at least one name.
-- Existing RLS policies should continue to work.
