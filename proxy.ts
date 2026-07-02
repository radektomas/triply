import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Per-path rate-limit tiers (per IP). `perMinute` is a fixed 60s window;
// `perDay` is an extra 24h cap applied only to the expensive AI-generation
// route, since each /api/trips call costs money downstream (n8n + OpenAI).
//
// /api/game/city-photo gets a generous per-minute limit: the loading-screen
// mini-game fires ~1 request per guess round, so a brisk player can
// legitimately hit ~6–12/min. Responses are 24h-cached per query server-
// side, so repeat cities don't reach Pexels.
const RATE_LIMIT_TIERS: Record<
  string,
  { perMinute: number; perDay?: number }
> = {
  "/api/trips": { perMinute: 3, perDay: 40 },
  "/api/feedback": { perMinute: 5 },
  "/api/game/city-photo": { perMinute: 30 },
};

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

interface RateWindow {
  count: number;
  resetAt: number;
}

// In-memory windows keyed by `${ip}|${path}` so each path tracks its own
// quota. NOTE: this is per serverless-instance state — on Vercel's Fluid
// Compute multiple instances each keep a separate Map, so the effective
// limit is (tier limit × live instance count). It throttles casual abuse
// but is not a hard guarantee.
//
// TODO(rate-limit): move these windows to a shared store (Redis/Upstash/DB)
// so the per-IP limit is enforced across instances. Until then, the DURABLE
// cost guard for /api/trips is the per-user daily cap enforced server-side in
// app/api/trips/route.ts (checkGenerationLimit → 429); this Map is only a
// best-effort per-IP throttle in front of it. Deferred as a separate decision.
const minuteWindows = new Map<string, RateWindow>();
const dayWindows = new Map<string, RateWindow>();

function isOverLimit(
  map: Map<string, RateWindow>,
  key: string,
  limit: number,
  now: number,
): boolean {
  const w = map.get(key);
  if (!w || now > w.resetAt) return false;
  return w.count >= limit;
}

function recordHit(
  map: Map<string, RateWindow>,
  key: string,
  windowMs: number,
  now: number,
): void {
  const w = map.get(key);
  if (!w || now > w.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    w.count++;
  }
}

function applyRateLimit(request: NextRequest): NextResponse | null {
  const path = request.nextUrl.pathname;
  const tier = RATE_LIMIT_TIERS[path];
  if (!tier) return null;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const now = Date.now();
  const key = `${ip}|${path}`;

  const tooMany = () =>
    NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );

  // Check both windows first; only record the hit once both pass, so a
  // request rejected by one window doesn't consume quota in the other.
  if (
    tier.perDay !== undefined &&
    isOverLimit(dayWindows, key, tier.perDay, now)
  ) {
    return tooMany();
  }
  if (isOverLimit(minuteWindows, key, tier.perMinute, now)) {
    return tooMany();
  }

  if (tier.perDay !== undefined) recordHit(dayWindows, key, DAY_MS, now);
  recordHit(minuteWindows, key, MINUTE_MS, now);
  return null;
}

export async function proxy(request: NextRequest) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touch the user — this triggers a token refresh if needed and writes
  // refreshed cookies back via the setAll handler above.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Skip Next internals and static assets — everything else passes through
    // so the auth session stays warm and rate-limited paths are still caught.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
