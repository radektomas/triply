-- Marketing-email consent + suppression state on profiles.
--
-- Why: the transactional-email stack sent welcome/followup_1/followup_2
-- (re-engagement marketing) to every account with no opt-in captured and no
-- way to opt out — the footer "Unsubscribe" link was the literal, never
-- substituted string "{{unsubscribe_url}}". These two columns are the durable
-- state behind the real unsubscribe flow (app/unsubscribe, /api/unsubscribe)
-- and the marketing-class send guard in lib/email/send.ts.
--
--   marketing_opt_in  explicit consent, captured by the signup checkbox in
--                     components/auth/AuthModal.tsx. Defaults to FALSE so
--                     existing rows are NOT retroactively opted in — consent
--                     that was never given cannot be inferred.
--   unsubscribed_at   set when the user follows an unsubscribe link. Kept as a
--                     timestamp rather than a bare boolean so we can evidence
--                     WHEN the objection was recorded (GDPR Art. 21 / Art. 7(3)).
--
-- Suppression rule enforced in code: a marketing-class email may be sent only
-- when marketing_opt_in IS TRUE AND unsubscribed_at IS NULL. Transactional
-- mail (auth links, saved_destination) ignores both columns — it is strictly
-- necessary to the service and is never suppressible.
alter table public.profiles
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists unsubscribed_at timestamptz;

-- The followups cron resolves recipients with
--   select id, email, display_name, marketing_opt_in, unsubscribed_at
--   from profiles where id in (...)
-- so it filters on the PK; no extra index is needed for that path. This partial
-- index serves the reverse question ("who is currently mailable?") used by the
-- suppression guard and any future audience count, and stays small because it
-- only contains consenting, non-unsubscribed rows.
create index if not exists idx_profiles_marketing_mailable
  on public.profiles (id)
  where marketing_opt_in is true and unsubscribed_at is null;

comment on column public.profiles.marketing_opt_in is
  'Explicit opt-in for marketing-class email (welcome, followup_1, followup_2). Default false; never backfilled.';
comment on column public.profiles.unsubscribed_at is
  'When the user unsubscribed from marketing email. Non-null suppresses all marketing-class sends.';
