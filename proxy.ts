import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const RATE_LIMITED_PATHS = ["/api/trips", "/api/feedback"];
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function applyRateLimit(request: NextRequest): NextResponse | null {
  if (!RATE_LIMITED_PATHS.includes(request.nextUrl.pathname)) return null;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }
  entry.count++;
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
