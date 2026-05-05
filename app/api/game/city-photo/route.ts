import { NextRequest, NextResponse } from "next/server";

// Server-side Pexels proxy for the Guess-the-City mini-game. The Pexels API
// key is server-only — never shipped to the client bundle. Each query is
// cached at the edge for 24h via Next's `revalidate` to keep us under the
// free-tier quota during typical loading-state usage.

const PEXELS_API = "https://api.pexels.com/v1/search";

interface PexelsPhoto {
  src?: { large?: string };
  photographer?: string;
  photographer_url?: string;
}

interface PexelsResponse {
  photos?: PexelsPhoto[];
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "missing query" }, { status: 400 });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "no api key" }, { status: 500 });
  }

  // Cap query length defensively.
  const safeQuery = query.slice(0, 100);

  try {
    const url = `${PEXELS_API}?query=${encodeURIComponent(safeQuery)}&per_page=5&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      next: { revalidate: 86400 }, // 24h edge cache per query
    });
    if (!res.ok) {
      console.warn("[api/game/city-photo] pexels failed", res.status);
      return NextResponse.json({ error: "pexels failed" }, { status: 502 });
    }
    const data = (await res.json()) as PexelsResponse;
    const photo = data.photos?.[0];
    if (!photo?.src?.large) {
      return NextResponse.json({ error: "no photo" }, { status: 404 });
    }

    return NextResponse.json({
      url: photo.src.large,
      photographer: photo.photographer ?? null,
      photographerUrl: photo.photographer_url ?? null,
    });
  } catch (err) {
    console.error("[api/game/city-photo] fetch failed", err);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
