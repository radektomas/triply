-- Content dashboard (/admin/content): short-form content idea backlog, posting
-- pipeline, and per-platform results logging.
--
-- All three tables are internal/admin-only. RLS is enabled with NO policies:
-- anon/authenticated clients can't read or write them at all; the dashboard
-- reads and writes server-side with the service-role key (which bypasses RLS),
-- same pattern as analytics_events on /admin/funnel.

-- ── content_ideas: the idea backlog ──────────────────────────────────────────

create table public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pillar text not null check (
    pillar in ('young_broke', 'travel_hacks', 'product_proof', 'founder_story')
  ),
  persona text not null check (
    persona in ('broke_explorer', 'weekend_couple', 'both')
  ),
  series_part int,
  city text,
  country text,
  hook text not null,
  -- { "beats": [ { "t": "0-2s", "overlay": "...", "broll": "..." } ] }
  script jsonb not null,
  caption text,
  hashtags text,
  engagement_question text,
  why_now text,
  status text not null default 'new' check (
    status in ('new', 'picked', 'posted', 'discarded')
  ),
  sound_hint text
);

-- The dashboard always reads by status; newest first within each bucket.
create index idx_content_ideas_status on public.content_ideas (status, created_at desc);

-- ── content_results: one row per platform per posted idea ────────────────────

create table public.content_results (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.content_ideas (id) on delete cascade,
  platform text not null check (platform in ('reels', 'tiktok')),
  posted_at timestamptz not null default now(),
  views int,
  saves int,
  comments int,
  profile_visits int,
  notes text
);

create index idx_content_results_idea on public.content_results (idea_id);

-- ── series_ledger: which parts of the "€1,000 summer" series are claimed ─────

create table public.series_ledger (
  id serial primary key,
  part int not null unique,
  city text not null,
  country text not null
);

alter table public.content_ideas enable row level security;
alter table public.content_results enable row level security;
alter table public.series_ledger enable row level security;

-- Parts already assigned. Part 12 is intentionally unassigned (free slot).
insert into public.series_ledger (part, city, country) values
  (1,  'Saranda / Ksamil',   'AL'),
  (2,  'Sunny Beach',        'BG'),
  (3,  'Kotor',              'ME'),
  (4,  'Valencia',           'ES'),
  (5,  'Playa del Carmen',   'MX'),
  (6,  'Zanzibar',           'TZ'),
  (7,  'Lefkada',            'GR'),
  (8,  'Soca Valley / Bled', 'SI'),
  (9,  'Taipei',             'TW'),
  (10, 'Cinque Terre',       'IT'),
  (11, 'Cinque Terre',       'IT'),
  (13, 'Mostar',             'BA'),
  (14, 'Ohrid',              'MK');

-- ── Mock ideas so the dashboard is reviewable immediately ────────────────────
-- Statuses are spread across the pipeline on purpose: two 'new' (Today), one
-- 'picked' and one 'posted' (Pipeline), plus one logged reels result for the
-- posted idea so Stats shows a real save rate. The posted idea gets a fixed
-- uuid so the results row can reference it.

insert into public.content_ideas
  (pillar, persona, series_part, city, country, hook, script,
   caption, hashtags, engagement_question, why_now, status, sound_hint)
values
  (
    'young_broke', 'broke_explorer', 3, 'Kotor', 'ME',
    'Kotor is what Dubrovnik was before the crowds — and it''s 3x cheaper',
    $json${"beats": [
      {"t": "0-2s",   "overlay": "POV: Dubrovnik views, hostel-budget prices", "broll": "Sweeping pan over Kotor bay at golden hour"},
      {"t": "2-6s",   "overlay": "Bed in the old town: €14/night",             "broll": "Hostel room, rooftop terrace with bay view"},
      {"t": "6-12s",  "overlay": "Full day of food: €15",                      "broll": "Burek breakfast, seafront seafood plate, evening pastry"},
      {"t": "12-18s", "overlay": "The fortress hike is FREE before 8am",       "broll": "Climbing San Giovanni steps, sunrise over the bay"},
      {"t": "18-22s", "overlay": "Part 3 of the €1,000 summer",                "broll": "Map zoom-out, running-total counter on screen"}
    ]}$json$::jsonb,
    'Part 3 of spending a whole summer abroad on €1,000. Kotor, Montenegro: the Adriatic without the Croatian price tag. Full cost breakdown on the last slide 🏰',
    '#budgettravel #kotor #montenegro #balkans #cheaptravel #summer2026',
    'Kotor or Dubrovnik — defend your pick in the comments 👇',
    'Wizz Air just opened a Tivat route — sub-€40 fares from most EU hubs all July',
    'new',
    'Trending Balkan-summer audio (the accordion remix)'
  ),
  (
    'travel_hacks', 'both', null, null, null,
    'Stop googling "cheap flights" — do this instead (takes 90 seconds)',
    $json${"beats": [
      {"t": "0-2s",   "overlay": "You''re searching for flights wrong",          "broll": "Frustrated scroll through an expensive results page"},
      {"t": "2-7s",   "overlay": "Whole-month view > exact dates",               "broll": "Screen record: flipping calendar to cheapest-month view"},
      {"t": "7-13s",  "overlay": "Set the alert, close the app",                 "broll": "Tapping price alert toggle, phone goes in pocket"},
      {"t": "13-19s", "overlay": "Check airports within 2h — often 40% cheaper", "broll": "Map with nearby airports highlighted, price labels"},
      {"t": "19-24s", "overlay": "Save this for your next trip",                 "broll": "Recap checklist overlay, save-button nudge"}
    ]}$json$::jsonb,
    'The 90-second flight-search routine that keeps our trips under budget. Save this — you''ll need it before summer fares spike again ✈️',
    '#travelhacks #cheapflights #flightdeals #traveltips #budgettravel',
    'What''s the best flight deal you''ve ever caught? 👇',
    'Summer fare volatility peaks in July — alerts catch the dips everyone else misses',
    'new',
    null
  ),
  (
    'product_proof', 'weekend_couple', null, 'Valencia', 'ES',
    'We asked AI to plan a €300 couples weekend — it actually delivered',
    $json${"beats": [
      {"t": "0-2s",   "overlay": "€300. Two people. One weekend. Watch this.", "broll": "Typing budget into Triply on a phone"},
      {"t": "2-6s",   "overlay": "It picked Valencia in 20 seconds",           "broll": "Screen record: results screen, destination cards"},
      {"t": "6-12s",  "overlay": "Flights + 2 nights: €212",                   "broll": "Booking confirmation screens, hotel exterior"},
      {"t": "12-18s", "overlay": "That left €88 for paella and horchata",      "broll": "Beach walk, paella pan, City of Arts at sunset"},
      {"t": "18-23s", "overlay": "Link in bio — it''s free to try",            "broll": "Couple toasting, app close-up, logo end card"}
    ]}$json$::jsonb,
    'We gave Triply a €300 budget and zero opinions. It sent us to Valencia and we came back under budget. Receipts in the video 🧾',
    '#couplestravel #weekendtrip #valencia #traveldeals #aitravel #triply',
    'Where should we send it next weekend? Drop a budget 👇',
    'Weekend-trip searches spike every Wednesday — post Tuesday night to ride it',
    'picked',
    'Soft acoustic couple-travel audio'
  ),
  (
    'founder_story', 'both', null, null, null,
    'I built a travel app because a "budget" weekend cost me €400',
    $json${"beats": [
      {"t": "0-2s",   "overlay": "This trip broke me (financially)",            "broll": "Old photo of the infamous weekend trip"},
      {"t": "2-8s",   "overlay": "Everything said budget. Nothing was.",        "broll": "Receipts stacking up on a table, fast cuts"},
      {"t": "8-14s",  "overlay": "So I built the tool I couldn''t find",        "broll": "Late-night laptop, early UI sketches, commits scrolling"},
      {"t": "14-20s", "overlay": "Now it plans real trips for real budgets",    "broll": "App demo: budget in, destinations out"},
      {"t": "20-25s", "overlay": "Building it in public — follow along",        "broll": "Talking head, quick roadmap tease"}
    ]}$json$::jsonb,
    'The €400 "budget weekend" that started all of this. Building Triply in public — part 1 of the story 🛠️',
    '#buildinpublic #founder #startup #traveltech #indiehacker',
    'What''s the most a "cheap trip" has ever actually cost you? 👇',
    'Founder-story posts are outperforming everything else on both platforms this month',
    'new',
    'Understated build-in-public voiceover, no music'
  );

insert into public.content_ideas
  (id, pillar, persona, series_part, city, country, hook, script,
   caption, hashtags, engagement_question, why_now, status, sound_hint)
values
  (
    'a1b2c3d4-0000-4000-8000-000000000001',
    'young_broke', 'broke_explorer', 1, 'Saranda / Ksamil', 'AL',
    'The Maldives of Europe costs €25 a day (yes, really)',
    $json${"beats": [
      {"t": "0-2s",   "overlay": "This is Albania. Not the Maldives.",  "broll": "Turquoise Ksamil water, white beach"},
      {"t": "2-6s",   "overlay": "Beachfront bed: €12/night",           "broll": "Guesthouse balcony overlooking the bay"},
      {"t": "6-12s",  "overlay": "Grilled fish dinner: €7",             "broll": "Seaside taverna, plate close-up"},
      {"t": "12-18s", "overlay": "Boat to the islands: €5",             "broll": "Small boat crossing to Ksamil islets"},
      {"t": "18-22s", "overlay": "Part 1 of the €1,000 summer",         "broll": "Series title card, running-total counter"}
    ]}$json$::jsonb,
    'Kicking off the €1,000 summer in Saranda & Ksamil, Albania. Day-by-day costs in the video — this place should not be this cheap 🌊',
    '#albania #ksamil #saranda #budgettravel #hiddengem #summer2026',
    'Be honest — did you know Albania looked like this? 👇',
    'Ksamil is all over FYPs right now but almost nobody shows the actual costs',
    'posted',
    'Trending summer-transition audio'
  );

insert into public.content_results
  (idea_id, platform, posted_at, views, saves, comments, profile_visits, notes)
values
  (
    'a1b2c3d4-0000-4000-8000-000000000001',
    'reels', now() - interval '2 days',
    18400, 912, 63, 240,
    'Best performer so far — saves spiked after the €25/day overlay beat'
  );
