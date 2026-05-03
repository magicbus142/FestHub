-- Add type_english column to expenses table
alter table if exists expenses
  add column if not exists type_english text null;

-- Optional: backfill type_english if needed (e.g. from type if it was already in English)
-- Since we don't know, we leave it as null and UI handles fallback.
