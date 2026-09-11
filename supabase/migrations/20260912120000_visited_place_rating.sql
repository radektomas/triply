-- Country ratings on the passport.
--
-- Right after a traveler stamps a country in onboarding, a modal asks
-- "how was it?" on a 1–5 scale (1 meh … 5 take me back). The answer is
-- taste context for the generator (TripInput.visitedRatings) — never an
-- exclusion; people revisit places they loved. NULL = not rated (skipped).

alter table public.visited_places
  add column if not exists rating smallint
    check (rating is null or rating between 1 and 5);

comment on column public.visited_places.rating is
  '1–5 how much the traveler liked this place (1 meh, 5 take me back). NULL when they skipped the question. Taste signal for generation, not an exclusion.';
