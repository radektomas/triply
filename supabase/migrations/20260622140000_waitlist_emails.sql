-- Triply Plus (and future) waitlist lead capture.
--
-- Writes go through the SERVICE-ROLE client (lib/supabase.ts) from
-- app/api/waitlist/route.ts. Service role bypasses RLS, so we enable RLS with
-- NO policies: anon/authenticated clients get zero access (this is lead data —
-- never publicly readable or writable), while the server insert still works.
--
-- `email` is unique so the same person can't spam rows; the route upserts with
-- on-conflict-do-nothing.
create table if not exists public.waitlist_emails (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text not null default 'triply_plus',
  created_at  timestamptz not null default now()
);

-- RLS on, intentionally NO policies → public clients cannot read or write.
-- Only the service-role server client (which bypasses RLS) can insert.
alter table public.waitlist_emails enable row level security;
