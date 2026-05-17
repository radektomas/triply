-- Quick Picks: hand-curated trip showcase rows surfaced on the landing
-- page and rendered at /trips/<slug>. trip_data stores the post-adapter
-- TripDetail shape (jsonb) so the detail page renders without a runtime
-- adapter call.
create table if not exists public.quick_picks (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  destination     text not null,
  vibe            text not null check (
    vibe in ('romantic','mountain','hidden_gem','budget','beach','city','family','underrated')
  ),
  travelers       text not null check (travelers in ('Solo','Couple','Family','Group')),
  duration_days   integer not null check (duration_days > 0 and duration_days <= 30),
  budget_from_eur integer not null check (budget_from_eur > 0),
  hero_image_url  text not null,
  trip_data       jsonb not null default '{}'::jsonb,
  display_order   integer not null,
  created_at      timestamptz not null default now(),
  unique (display_order)
);

create index if not exists quick_picks_display_order_idx
  on public.quick_picks (display_order);

-- RLS: read-only for anon. trip_data may be edited via service role only.
alter table public.quick_picks enable row level security;

create policy "anon read quick_picks"
  on public.quick_picks
  for select
  to anon
  using (true);
