"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { AIRPORTS } from "@/lib/data/airports";
import {
  BUDGET_MAX,
  BUDGET_MIN,
  MAX_TRAVEL_WINDOWS,
  MAX_VIBES,
  MAX_VISITED_PLACES,
  MAX_WINDOW_NIGHTS,
  VISITED_PHOTOS_BUCKET,
  WINDOW_HORIZON_MONTHS,
  isTravelerVibe,
  type TravelerPrefs,
  type TravelerVibe,
  type TravelWindow,
  type VisitedPlace,
} from "@/lib/traveler";

// Every action resolves identity from the caller's own session and writes
// under the cookie-bound client, so RLS is the enforcement — there is no user
// id parameter anywhere to tamper with.

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const NOT_SIGNED_IN = "You need to be signed in.";

// Migration 20260909120000_traveler_profile.sql not applied yet? PostgREST
// answers with "Could not find the table/column … in the schema cache"
// (PGRST204/PGRST205) or Postgres 42P01/42703. In that state the wizard still
// has to be usable for design review, so the actions fall back to MOCK rows
// (ids prefixed `mock-`, nothing persisted) and log loudly. Once the
// migration is in, this path is never taken.
function schemaMissing(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === "PGRST204" || err.code === "PGRST205") return true;
  if (err.code === "42P01" || err.code === "42703") return true;
  return /schema cache|does not exist/i.test(err.message ?? "");
}

function warnMock(where: string, err: { message?: string } | null | undefined) {
  console.warn(
    `[onboarding/${where}] schema missing — returning MOCK result (apply supabase/migrations/20260909120000_traveler_profile.sql):`,
    err?.message,
  );
}

function mockId(): string {
  return `mock-${crypto.randomUUID()}`;
}

const isMockId = (id: string) => id.startsWith("mock-");

async function requireUser() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── preferences ─────────────────────────────────────────────────────────────

export async function saveTravelerPrefs(
  input: Partial<TravelerPrefs>,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const patch: Record<string, unknown> = {};

  if (input.vibes !== undefined) {
    const vibes: TravelerVibe[] = [];
    for (const v of input.vibes) {
      if (isTravelerVibe(v) && !vibes.includes(v)) vibes.push(v);
      if (vibes.length >= MAX_VIBES) break;
    }
    patch.vibes = vibes;
  }

  if (input.budgetEur !== undefined) {
    const n = Math.round(Number(input.budgetEur));
    if (!Number.isFinite(n)) return { ok: false, error: "Budget must be a number." };
    patch.travel_budget_eur = Math.min(Math.max(n, BUDGET_MIN), BUDGET_MAX);
  }

  if (input.homeAirport !== undefined) {
    if (input.homeAirport === null) {
      patch.home_airport = null;
      patch.home_city = null;
    } else {
      const iata = String(input.homeAirport).toUpperCase().slice(0, 3);
      const airport = AIRPORTS.find((a) => a.iata === iata);
      if (!airport) return { ok: false, error: "Unknown airport." };
      patch.home_airport = airport.iata;
      // Derived server-side from the dataset — the client's city string is
      // never trusted, and originCity downstream stays consistent.
      patch.home_city = airport.city;
    }
  }

  if (input.travelParty !== undefined) {
    const n = Math.round(Number(input.travelParty));
    patch.travel_party = Math.min(Math.max(Number.isFinite(n) ? n : 1, 1), 10);
  }

  if (Object.keys(patch).length === 0) return { ok: true, data: undefined };

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error && schemaMissing(error)) {
    warnMock("saveTravelerPrefs", error);
    return { ok: true, data: undefined };
  }
  if (error) {
    console.error("[onboarding/saveTravelerPrefs] failed:", error.message);
    return { ok: false, error: "Couldn't save your preferences. Please try again." };
  }
  return { ok: true, data: undefined };
}

export async function completeOnboarding(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error && schemaMissing(error)) {
    warnMock("completeOnboarding", error);
    return { ok: true, data: undefined };
  }
  if (error) {
    console.error("[onboarding/completeOnboarding] failed:", error.message);
    return { ok: false, error: "Couldn't finish setup. Please try again." };
  }
  revalidatePath("/profile");
  return { ok: true, data: undefined };
}

// ── visited places ──────────────────────────────────────────────────────────

export interface NewVisitedPlace {
  name: string;
  country: string;
  countryCode: string;
  lat: number | null;
  lng: number | null;
}

function cleanText(v: unknown, max: number): string {
  return String(v ?? "")
    .replace(/[^\p{L}\p{N}\s,\-.'’()]/gu, "")
    .trim()
    .slice(0, max);
}

export async function addVisitedPlace(
  input: NewVisitedPlace,
): Promise<ActionResult<VisitedPlace>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const name = cleanText(input.name, 80);
  if (name.length < 1) return { ok: false, error: "Give the place a name." };
  const country = cleanText(input.country, 80);
  const countryCode = String(input.countryCode ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
  const lat = Number.isFinite(input.lat) ? Number(input.lat) : null;
  const lng = Number.isFinite(input.lng) ? Number(input.lng) : null;

  const { count } = await supabase
    .from("visited_places")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= MAX_VISITED_PLACES) {
    return { ok: false, error: `You can add up to ${MAX_VISITED_PLACES} places.` };
  }

  const { data, error } = await supabase
    .from("visited_places")
    .insert({ user_id: user.id, name, country, country_code: countryCode, lat, lng })
    .select("id")
    .single();
  let id: string;
  if (error && schemaMissing(error)) {
    warnMock("addVisitedPlace", error);
    id = mockId();
  } else if (error || !data) {
    console.error("[onboarding/addVisitedPlace] failed:", error?.message);
    return { ok: false, error: "Couldn't add that place. Please try again." };
  } else {
    id = data.id as string;
  }

  return {
    ok: true,
    data: {
      id,
      name,
      country,
      countryCode,
      lat,
      lng,
      photoPath: null,
      photoUrl: null,
    },
  };
}

/**
 * Record an uploaded photo against a place. The browser has already put the
 * object into `visited-photos/<uid>/<placeId>.jpg` under its own session; this
 * only pins the path on the row. The path is re-derived here rather than
 * accepted from the client, so one user can never point their row at
 * another user's object.
 */
export async function setVisitedPlacePhoto(
  placeId: string,
): Promise<ActionResult<{ photoPath: string; photoUrl: string | null }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };
  if (isMockId(placeId)) {
    return { ok: true, data: { photoPath: `${user.id}/${placeId}.jpg`, photoUrl: null } };
  }
  if (!/^[0-9a-f-]{36}$/i.test(placeId)) return { ok: false, error: "Bad place id." };

  const photoPath = `${user.id}/${placeId}.jpg`;
  const { error } = await supabase
    .from("visited_places")
    .update({ photo_path: photoPath })
    .eq("id", placeId)
    .eq("user_id", user.id);
  if (error) {
    console.error("[onboarding/setVisitedPlacePhoto] failed:", error.message);
    return { ok: false, error: "Couldn't attach the photo." };
  }

  const { data: signed } = await supabase.storage
    .from(VISITED_PHOTOS_BUCKET)
    .createSignedUrl(photoPath, 60 * 60);

  return { ok: true, data: { photoPath, photoUrl: signed?.signedUrl ?? null } };
}

export async function removeVisitedPlace(placeId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };
  if (isMockId(placeId)) return { ok: true, data: undefined };
  if (!/^[0-9a-f-]{36}$/i.test(placeId)) return { ok: false, error: "Bad place id." };

  // Photo first (best-effort), then the row. A stray object with no row is
  // harmless and swept on account deletion; a row pointing at a missing
  // object would render a broken image.
  await supabase.storage
    .from(VISITED_PHOTOS_BUCKET)
    .remove([`${user.id}/${placeId}.jpg`])
    .catch(() => {});

  const { error } = await supabase
    .from("visited_places")
    .delete()
    .eq("id", placeId)
    .eq("user_id", user.id);
  if (error) {
    console.error("[onboarding/removeVisitedPlace] failed:", error.message);
    return { ok: false, error: "Couldn't remove that place." };
  }
  return { ok: true, data: undefined };
}

// ── travel windows ──────────────────────────────────────────────────────────

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function addTravelWindow(input: {
  startDate: string;
  endDate: string;
  label?: string | null;
}): Promise<ActionResult<TravelWindow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };

  const { startDate, endDate } = input;
  if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) {
    return { ok: false, error: "Pick a start and an end date." };
  }
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { ok: false, error: "The window has to end after it starts." };
  }
  const nights = Math.round((end - start) / 86_400_000);
  if (nights > MAX_WINDOW_NIGHTS) {
    return { ok: false, error: `Keep each window under ${MAX_WINDOW_NIGHTS} nights.` };
  }
  if (endDate <= isoToday()) {
    return { ok: false, error: "That window is already in the past." };
  }
  const horizon = new Date();
  horizon.setMonth(horizon.getMonth() + WINDOW_HORIZON_MONTHS);
  if (start > horizon.getTime()) {
    return { ok: false, error: "That's a bit too far ahead for now." };
  }

  const label = input.label ? cleanText(input.label, 60) || null : null;

  const { count } = await supabase
    .from("travel_windows")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= MAX_TRAVEL_WINDOWS) {
    return { ok: false, error: `You can keep up to ${MAX_TRAVEL_WINDOWS} windows.` };
  }

  const { data, error } = await supabase
    .from("travel_windows")
    .insert({ user_id: user.id, start_date: startDate, end_date: endDate, label })
    .select("id")
    .single();
  if (error && schemaMissing(error)) {
    warnMock("addTravelWindow", error);
    return { ok: true, data: { id: mockId(), startDate, endDate, label } };
  }
  if (error || !data) {
    console.error("[onboarding/addTravelWindow] failed:", error?.message);
    return { ok: false, error: "Couldn't save that window. Please try again." };
  }
  return { ok: true, data: { id: data.id as string, startDate, endDate, label } };
}

export async function removeTravelWindow(windowId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };
  if (isMockId(windowId)) return { ok: true, data: undefined };
  if (!/^[0-9a-f-]{36}$/i.test(windowId)) return { ok: false, error: "Bad window id." };

  const { error } = await supabase
    .from("travel_windows")
    .delete()
    .eq("id", windowId)
    .eq("user_id", user.id);
  if (error) {
    console.error("[onboarding/removeTravelWindow] failed:", error.message);
    return { ok: false, error: "Couldn't remove that window." };
  }
  return { ok: true, data: undefined };
}
