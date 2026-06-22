-- Daily trip-generation limit counters on profiles.
--
-- 1 generation = 1 result set (the first search counts too). Logged-in users
-- get a fixed number of generations per UTC day (see DAILY_GENERATION_LIMIT in
-- lib/generationLimits.ts). The reset marker lets the app detect a UTC-midnight
-- day rollover lazily on the next read/increment instead of needing a cron.
--
--   generations_today       running count for the current UTC day
--   generations_reset_date  the UTC day that count belongs to; when it's NULL
--                           or earlier than today, the count is treated as 0
--                           and reset.
alter table public.profiles
  add column if not exists generations_today integer not null default 0,
  add column if not exists generations_reset_date date;
