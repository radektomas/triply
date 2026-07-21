"use client";

// Client-side product analytics. Fire-and-forget event logging via
// POST /api/analytics/event. Every helper swallows its own errors — tracking
// must NEVER throw, block, or delay the user-facing flow.
//
// Writes used to go straight from the browser into public.analytics_events
// using the anon key, which required an RLS policy of
// `for insert ... with check (true)` — an open, unauthenticated write endpoint
// on a public table. That policy is dropped; the browser now has no write path
// to the table at all, and the server route validates the event name and
// properties and resolves user_id from the auth cookie instead of trusting the
// payload.
//
// Funnel: landing_view → trip_form_started → trip_generated → account_created
//         → email_captured.

import type { AnalyticsEvent } from "@/lib/analytics.events";

const SESSION_KEY = "triply_session_id";

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (older browsers).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Stable per-browser anonymous id, persisted in localStorage. Created on first
 * read. Returns "" when storage is unavailable (private mode / SSR) so callers
 * can no-op cleanly.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = randomId();
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/**
 * Log one analytics event. Fire-and-forget: callers should NOT await this.
 * Attaches the session id; the server resolves the user id from the auth
 * cookie. Any failure (storage blocked, network down, validation) is swallowed.
 *
 * `eventName` is typed to the shared allow-list, so adding an event means
 * adding it to lib/analytics.events.ts — which is also what the server
 * validates against, keeping the two ends in step.
 */
export function track(
  eventName: AnalyticsEvent,
  properties: Record<string, unknown> = {},
): void {
  try {
    if (typeof window === "undefined") return;
    const sessionId = getSessionId();
    if (!sessionId) return;

    // keepalive so the request survives the page unload that immediately
    // follows navigation-triggered events (affiliate_clicked in particular,
    // where the click takes the user off-site).
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, sessionId, properties }),
      keepalive: true,
    }).catch(() => {
      // never throw
    });
  } catch {
    // never throw
  }
}

/**
 * Attach this session's anonymous pre-signup events to a freshly created
 * account. Called on account_created. The UPDATE itself runs server-side with
 * the service-role key (the public client has no update policy) — we POST the
 * session id and the server reads the authenticated user from the auth cookie.
 * Fire-and-forget.
 */
export function identify(): void {
  try {
    if (typeof window === "undefined") return;
    const sessionId = getSessionId();
    if (!sessionId) return;
    void fetch("/api/analytics/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      keepalive: true,
    }).catch(() => {
      // never throw
    });
  } catch {
    // never throw
  }
}
