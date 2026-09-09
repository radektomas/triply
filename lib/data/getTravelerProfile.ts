import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCityPhoto } from "@/lib/photos";
import {
  EMPTY_PREFS,
  VISITED_PHOTOS_BUCKET,
  isTravelerVibe,
  type TravelerProfile,
  type TravelerPrefs,
  type TravelWindow,
  type VisitedPlace,
} from "@/lib/traveler";

type ServerClient = Awaited<ReturnType<typeof getServerSupabase>>;

/** Signed photo URLs live this long. Long enough for a session on the
 *  profile page; short enough that a leaked link goes stale quickly. */
const SIGNED_URL_TTL_S = 60 * 60;

interface ProfileRow {
  vibes: string[] | null;
  travel_budget_eur: number | null;
  home_airport: string | null;
  home_city: string | null;
  travel_party: number | null;
  onboarding_completed_at: string | null;
}

interface PlaceRow {
  id: string;
  kind: "city" | "country" | null;
  name: string;
  country: string;
  country_code: string;
  lat: number | null;
  lng: number | null;
  photo_path: string | null;
}

interface WindowRow {
  id: string;
  start_date: string;
  end_date: string;
  label: string | null;
}

/**
 * Load the signed-in user's traveler profile under their own RLS client.
 * Returns null when nobody is signed in. Every sub-query fails soft (an
 * empty section) so a half-applied migration never blanks the whole page.
 */
export async function getTravelerProfile(
  client?: ServerClient,
): Promise<TravelerProfile | null> {
  const supabase = client ?? (await getServerSupabase());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, placesRes, windowsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "vibes, travel_budget_eur, home_airport, home_city, travel_party, onboarding_completed_at",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("visited_places")
      .select("id, kind, name, country, country_code, lat, lng, photo_path")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("travel_windows")
      .select("id, start_date, end_date, label")
      .eq("user_id", user.id)
      .order("start_date", { ascending: true }),
  ]);

  if (profileRes.error) {
    console.warn("[getTravelerProfile] profiles read failed:", profileRes.error.message);
  }
  if (placesRes.error) {
    console.warn("[getTravelerProfile] visited_places read failed:", placesRes.error.message);
  }
  if (windowsRes.error) {
    console.warn("[getTravelerProfile] travel_windows read failed:", windowsRes.error.message);
  }

  const row = (profileRes.data ?? null) as ProfileRow | null;
  const prefs: TravelerPrefs = row
    ? {
        vibes: (row.vibes ?? []).filter(isTravelerVibe),
        budgetEur: row.travel_budget_eur ?? EMPTY_PREFS.budgetEur,
        homeAirport: row.home_airport,
        homeCity: row.home_city,
        travelParty: row.travel_party ?? EMPTY_PREFS.travelParty,
      }
    : { ...EMPTY_PREFS };

  const placeRows = (placesRes.data ?? []) as PlaceRow[];
  const photoPaths = placeRows
    .map((p) => p.photo_path)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  // One round-trip for every signed URL. The user's own client can sign
  // because the bucket's select policy grants them their folder.
  const signedByPath = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signed, error: signErr } = await supabase.storage
      .from(VISITED_PHOTOS_BUCKET)
      .createSignedUrls(photoPaths, SIGNED_URL_TTL_S);
    if (signErr) {
      console.warn("[getTravelerProfile] signed urls failed:", signErr.message);
    }
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl && !s.error) signedByPath.set(s.path, s.signedUrl);
    }
  }

  // Stock photo for every stamp without a personal one — the same cached
  // Pexels lookup the results grid and profile favourites use.
  const places: VisitedPlace[] = await Promise.all(
    placeRows.map(async (p) => {
      const photoUrl = p.photo_path ? (signedByPath.get(p.photo_path) ?? null) : null;
      let stockPhotoUrl: string | null = null;
      if (!photoUrl) {
        try {
          stockPhotoUrl = (await getCityPhoto(p.name, p.country || p.name)) || null;
        } catch {
          stockPhotoUrl = null;
        }
      }
      return {
        id: p.id,
        kind: p.kind === "city" ? "city" : "country",
        name: p.name,
        country: p.country ?? "",
        countryCode: p.country_code ?? "",
        lat: p.lat,
        lng: p.lng,
        photoPath: p.photo_path,
        photoUrl,
        stockPhotoUrl,
      };
    }),
  );

  const windows: TravelWindow[] = ((windowsRes.data ?? []) as WindowRow[]).map((w) => ({
    id: w.id,
    startDate: w.start_date,
    endDate: w.end_date,
    label: w.label,
  }));

  return {
    prefs,
    places,
    windows,
    completedAt: row?.onboarding_completed_at ?? null,
  };
}
