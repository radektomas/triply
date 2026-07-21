import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { supabase as serviceSupabase } from "@/lib/supabase";
import {
  isAnalyticsEvent,
  validateProperties,
  SESSION_ID_RE,
} from "@/lib/analytics.events";

// Server-side ingest for product-analytics events.
//
// Replaces the browser writing straight into public.analytics_events. That
// worked because the table carried
//   for insert to anon, authenticated with check (true)
// which is an open write endpoint: anyone with the public anon key could
// insert unlimited rows with any event_name, any properties, any session_id,
// and — worst of all — an arbitrary user_id, letting them attribute fabricated
// funnel activity to a real account. The policy is dropped in
// 20260722120000_analytics_events_lock_insert.sql; this route is what replaces
// it.
//
// Three things this does that the client could not be trusted to do:
//
//   1. ALLOW-LIST the event name and validate the properties shape
//      (lib/analytics.events.ts), so the table only ever holds events the
//      product actually defines.
//   2. Derive user_id from the verified auth cookie, NEVER from the request
//      body. A client can still choose its own session_id — that is inherent
//      to anonymous pre-signup tracking — but it can no longer claim to be a
//      different signed-in user.
//   3. Rate-limit per session id.
//
// Fire-and-forget contract: the browser never awaits this and never surfaces
// its errors, so every failure path returns quickly and quietly. Validation
// failures return 400 to make the bug visible in development, but the client
// ignores the status either way.

export const dynamic = "force-dynamic";

// Per-session budget. The chattiest real page fires a handful of events; 40 a
// minute is far above genuine use and far below anything worth storing.
const PER_SESSION_PER_MINUTE = 40;
const MINUTE_MS = 60_000;

interface Window {
  count: number;
  resetAt: number;
}

// In-memory, keyed by session id. Same caveat as the limiter in proxy.ts: on
// Fluid Compute several instances each keep their own Map, so the effective
// ceiling is (limit × live instances). That is fine here — this is a
// junk-volume guard, not a security control. The security control is the
// dropped INSERT policy: without this route, there is no write path at all.
const windows = new Map<string, Window>();

// Bound the Map so a flood of distinct session ids can't grow it without
// limit. Well above the number of concurrent real sessions.
const MAX_TRACKED_SESSIONS = 10_000;

function overLimit(sessionId: string, now: number): boolean {
  const existing = windows.get(sessionId);
  if (!existing || now > existing.resetAt) {
    if (windows.size >= MAX_TRACKED_SESSIONS) {
      // Cheapest effective eviction: drop everything already expired. If none
      // have, clear the lot — losing limiter state briefly is preferable to
      // unbounded memory in a long-lived instance.
      for (const [key, w] of windows) if (now > w.resetAt) windows.delete(key);
      if (windows.size >= MAX_TRACKED_SESSIONS) windows.clear();
    }
    windows.set(sessionId, { count: 1, resetAt: now + MINUTE_MS });
    return false;
  }
  if (existing.count >= PER_SESSION_PER_MINUTE) return true;
  existing.count++;
  return false;
}

export async function POST(req: NextRequest) {
  let body: { eventName?: unknown; sessionId?: unknown; properties?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
  }

  const { eventName, sessionId } = body;

  if (!isAnalyticsEvent(eventName)) {
    return NextResponse.json({ error: "unknown_event" }, { status: 400 });
  }
  if (typeof sessionId !== "string" || !SESSION_ID_RE.test(sessionId)) {
    return NextResponse.json({ error: "invalid_session_id" }, { status: 400 });
  }

  const validated = validateProperties(body.properties);
  if (!validated.ok) {
    return NextResponse.json(
      { error: "invalid_properties", detail: validated.reason },
      { status: 400 },
    );
  }

  if (overLimit(sessionId, Date.now())) {
    // 429 without Retry-After: the caller is fire-and-forget and must not
    // retry. Silently dropping the event is the intended behaviour.
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // Identity comes from the cookie, never the payload. Anonymous visitors
  // legitimately have no user — those rows are back-filled at signup by
  // /api/analytics/identify.
  let userId: string | null = null;
  try {
    const sb = await getServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // An unreadable session is not a reason to drop the event — log it
    // anonymously, exactly as it would have been for a logged-out visitor.
  }

  const { error } = await serviceSupabase.from("analytics_events").insert({
    event_name: eventName,
    session_id: sessionId,
    user_id: userId,
    properties: validated.properties,
  });

  if (error) {
    console.error("[api/analytics/event] insert failed:", error.message);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  // 204: the client has nothing to read and the body would be wasted bytes on
  // a call that fires on nearly every page view.
  return new NextResponse(null, { status: 204 });
}
