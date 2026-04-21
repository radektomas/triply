import { supabase } from "./supabase";

export interface CityPhoto {
  url: string;
  urlLarge: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
}

const PEXELS_API = "https://api.pexels.com/v1/search";

/**
 * Fetches 5 photos for a city with Supabase caching (30-day TTL).
 * Falls back to empty array if API fails or photo_cache table doesn't exist yet.
 */
export async function getCityPhotos(name: string, country: string): Promise<CityPhoto[]> {
  const cacheKey = `${name}-${country}`.toLowerCase().replace(/\s+/g, "-");

  // Supabase cache check — silently skipped if table doesn't exist yet
  try {
    const { data: cached } = await supabase
      .from("photo_cache")
      .select("photos, cached_at")
      .eq("cache_key", cacheKey)
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.cached_at as string).getTime();
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      if (age < THIRTY_DAYS) {
        return cached.photos as CityPhoto[];
      }
    }
  } catch {
    // photo_cache table may not exist yet — fall through to Pexels fetch
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.warn("PEXELS_API_KEY not set — returning empty photos");
    return [];
  }

  try {
    const query = encodeURIComponent(`${name} ${country} travel`);
    const res = await fetch(
      `${PEXELS_API}?query=${query}&per_page=5&orientation=landscape`,
      {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      console.warn(`Pexels API returned ${res.status}`);
      return [];
    }

    const data = (await res.json()) as {
      photos?: Array<{
        src: { large: string; large2x: string };
        photographer: string;
        photographer_url: string;
        alt: string;
      }>;
    };

    const photos: CityPhoto[] = (data.photos ?? []).map((p) => ({
      url: p.src.large,
      urlLarge: p.src.large2x,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      alt: p.alt || `${name}, ${country}`,
    }));

    if (photos.length > 0) {
      // Fire-and-forget cache write — ignore if table doesn't exist yet
      supabase
        .from("photo_cache")
        .upsert({
          cache_key: cacheKey,
          photos,
          cached_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn("Failed to cache photos:", error.message);
        });
    }

    return photos;
  } catch (err) {
    console.warn("Pexels fetch failed:", err);
    return [];
  }
}

export async function getCityPhoto(name: string, country: string): Promise<string> {
  const photos = await getCityPhotos(name, country);
  return photos[0]?.url ?? "";
}

