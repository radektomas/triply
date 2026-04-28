import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

export function proxy(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return NextResponse.next();
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/trips", "/api/feedback"],
};
