-- Email send-tracking for the transactional email flows (POST /api/email).
--
-- saved_destinations gains two nullable "sent" stamps so the daily n8n job can
-- pick up rows that still need their day+1 / day+2 nudge and never double-send.
-- profiles gains welcome_sent_at for the one-time welcome email.

alter table public.saved_destinations
  add column if not exists followup_1_sent_at timestamptz,
  add column if not exists followup_2_sent_at timestamptz;

alter table public.profiles
  add column if not exists welcome_sent_at timestamptz;

-- The daily query shape is:
--   select ... from saved_destinations
--   where followup_X_sent_at is null and created_at < now() - interval 'N days';
-- Partial indexes keep these scans tiny: they only contain not-yet-sent rows,
-- ordered by created_at, and shrink as followups are sent.
create index if not exists idx_saved_destinations_followup1_pending
  on public.saved_destinations (created_at)
  where followup_1_sent_at is null;

create index if not exists idx_saved_destinations_followup2_pending
  on public.saved_destinations (created_at)
  where followup_2_sent_at is null;
