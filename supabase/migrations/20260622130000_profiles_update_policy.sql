-- Allow a logged-in user to UPDATE only their OWN profiles row.
--
-- Why: the daily generation limit increments profiles.generations_today under
-- the user's cookie-bound (RLS) client. If RLS is enabled on public.profiles
-- but no UPDATE policy exists, that UPDATE silently affects 0 rows and the
-- limit never advances. This policy closes that gap.
--
-- Scope: `auth.uid() = id` in BOTH the USING clause (which existing rows the
-- user may update — only their own) and the WITH CHECK clause (the row after
-- update must still belong to them, so they can't reassign it to another user).
-- `to authenticated` so it applies to logged-in users only.
--
-- Safe to run in either state:
--   * If RLS is already enabled, this fills the missing UPDATE permission.
--   * If RLS is currently DISABLED on profiles, the policy is inert (policies
--     only take effect once RLS is enabled), so this changes nothing and does
--     no harm.
-- It deliberately does NOT run `enable row level security` — flipping RLS on
-- without also having SELECT/INSERT policies could break profile reads/writes
-- that currently work. Only add the UPDATE policy here.
--
-- Idempotent: drop-then-create (Postgres has no CREATE POLICY IF NOT EXISTS).

drop policy if exists "users update own profile" on public.profiles;

create policy "users update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
