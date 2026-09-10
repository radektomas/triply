"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";

// Watch / unwatch a destination for price alerts. Identity comes from the
// caller's session; rows are written under RLS.

export type WatchResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export interface WatchInput {
  name: string;
  country: string;
  countryCode?: string;
  destinationId?: string;
  tripId?: string;
}

function clean(v: unknown, max: number): string {
  return String(v ?? "")
    .replace(/[^\p{L}\p{N}\s,\-.'’()]/gu, "")
    .trim()
    .slice(0, max);
}

export async function watchDestination(input: WatchInput): Promise<WatchResult> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const name = clean(input.name, 80);
  const country = clean(input.country, 80);
  if (!name) return { ok: false, error: "Missing destination." };
  const countryCode = String(input.countryCode ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
  const destinationId = input.destinationId ? clean(input.destinationId, 120) : null;
  const tripId =
    input.tripId && /^[0-9a-f-]{36}$/i.test(input.tripId) ? input.tripId : null;

  // Upsert on the case-insensitive unique index: re-watching a place you
  // already watch just returns the existing row.
  const { data: existing } = await supabase
    .from("deal_watches")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", name)
    .ilike("country", country)
    .maybeSingle();
  if (existing?.id) return { ok: true, id: existing.id as string };

  const { data, error } = await supabase
    .from("deal_watches")
    .insert({
      user_id: user.id,
      name,
      country,
      country_code: countryCode,
      destination_id: destinationId,
      trip_id: tripId,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[watchDestination] failed:", error?.message);
    return { ok: false, error: "Couldn't save that watch. Please try again." };
  }
  revalidatePath("/profile");
  return { ok: true, id: data.id as string };
}

export async function unwatchDestination(
  watchId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };
  if (!/^[0-9a-f-]{36}$/i.test(watchId)) return { ok: false, error: "Bad id." };

  const { error } = await supabase
    .from("deal_watches")
    .delete()
    .eq("id", watchId)
    .eq("user_id", user.id);
  if (error) {
    console.error("[unwatchDestination] failed:", error.message);
    return { ok: false, error: "Couldn't remove that watch." };
  }
  revalidatePath("/profile");
  return { ok: true };
}
