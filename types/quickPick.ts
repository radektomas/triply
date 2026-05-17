// Quick Picks — hand-curated trip showcase rows backed by Supabase.
// `trip_data` stores the post-adapter TripDetail shape directly; the detail
// page reads it as-is and feeds it into the existing trip-detail components
// (DayPlans, BookingHub, BudgetBreakdown, TipsList) without a runtime adapter.
import type { QuickPickVibe } from "@/components/landing/VibeIcons";
import type { TripDetail } from "@/lib/types/trip";

export type QuickPickTravelers = "Solo" | "Couple" | "Family" | "Group";

export interface QuickPick {
  id: string;
  slug: string;
  title: string;
  destination: string;
  vibe: QuickPickVibe;
  travelers: QuickPickTravelers;
  duration_days: number;
  budget_from_eur: number;
  hero_image_url: string;
  // Post-adapter TripDetail. Stored as jsonb in Supabase. May be `{}` for
  // freshly-seeded rows that haven't been filled in yet — the detail page
  // handles partial / empty shapes via the rendering components' own guards.
  trip_data: Partial<TripDetail>;
  display_order: number;
  created_at: string;
}

export type { QuickPickVibe };
