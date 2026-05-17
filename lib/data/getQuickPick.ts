import { supabase } from "@/lib/supabase";
import type { QuickPick } from "@/types/quickPick";

// Fetch a single Quick Pick by slug. Returns null if not found.
export async function getQuickPickBySlug(slug: string): Promise<QuickPick | null> {
  const { data, error } = await supabase
    .from("quick_picks")
    .select(
      "id, slug, title, destination, vibe, travelers, duration_days, budget_from_eur, hero_image_url, trip_data, display_order, created_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    if (error.code !== "PGRST116") {
      console.warn("[getQuickPickBySlug]", slug, error.message);
    }
    return null;
  }
  return (data as QuickPick) ?? null;
}

// Fetch all Quick Picks, ordered by display_order. Used by the landing
// section grid and by `generateStaticParams` to know all 8 slugs.
export async function listQuickPicks(): Promise<QuickPick[]> {
  const { data, error } = await supabase
    .from("quick_picks")
    .select(
      "id, slug, title, destination, vibe, travelers, duration_days, budget_from_eur, hero_image_url, trip_data, display_order, created_at",
    )
    .order("display_order", { ascending: true });

  if (error) {
    console.warn("[listQuickPicks]", error.message);
    return [];
  }
  return (data as QuickPick[]) ?? [];
}
