-- Quick Picks seed. trip_data is left as '{}'::jsonb — the user will fill
-- in each row's full TripDetail payload manually (generated via n8n then
-- adapted) before the detail pages render meaningful content.
--
-- The Prague entry replaces the original "Kraków, Poland" pick — Prague is
-- the home market. Same vibe=budget, travelers=Group, 3 days, €180.
insert into public.quick_picks
  (slug, title, destination, vibe, travelers, duration_days, budget_from_eur, hero_image_url, display_order)
values
  ('romantic-lago-di-como',     'Romantic escape',      'Lago di Como, Italy',         'romantic',   'Couple', 4, 520, '/quick-picks/romantic-lago-di-como.jpg',     1),
  ('dolomites-mountain-stretch','Mountain stretch',     'Dolomites, Italy',            'mountain',   'Solo',   5, 480, '/quick-picks/dolomites-mountain-stretch.jpg',2),
  ('albanian-riviera-hidden-gem','Hidden gem',          'Albanian Riviera',            'hidden_gem', 'Couple', 6, 390, '/quick-picks/albanian-riviera-hidden-gem.jpg',3),
  ('prague-budget-weekend',     'Budget weekend',       'Prague, Czech Republic',      'budget',     'Group',  3, 180, '/quick-picks/prague-budget-weekend.jpg',     4),
  ('corfu-beach-reset',         'Beach reset',          'Corfu, Greece',               'beach',      'Solo',   5, 440, '/quick-picks/corfu-beach-reset.jpg',         5),
  ('lisbon-city-pulse',         'City pulse',           'Lisbon, Portugal',            'city',       'Group',  4, 380, '/quick-picks/lisbon-city-pulse.jpg',         6),
  ('slovenia-family-adventure', 'Family adventure',     'Slovenia (Bled + Soča)',      'family',     'Family', 5, 620, '/quick-picks/slovenia-family-adventure.jpg', 7),
  ('tbilisi-underrated-capital','Underrated capital',   'Tbilisi, Georgia',            'underrated', 'Couple', 6, 410, '/quick-picks/tbilisi-underrated-capital.jpg',8)
on conflict (slug) do update set
  title           = excluded.title,
  destination     = excluded.destination,
  vibe            = excluded.vibe,
  travelers       = excluded.travelers,
  duration_days   = excluded.duration_days,
  budget_from_eur = excluded.budget_from_eur,
  hero_image_url  = excluded.hero_image_url,
  display_order   = excluded.display_order;
