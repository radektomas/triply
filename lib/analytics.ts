"use client";

// Client-side product analytics. Fire-and-forget event logging into
// public.analytics_events via the anon/authenticated browser Supabase client
// (RLS allows inserts only). Every helper swallows its own errors — tracking
// must NEVER throw, block, or delay the user-facing flow.
//
// Funnel: landing_view → trip_form_started → trip_generated → account_created
//         → email_captured.

import { getBrowserSupabase } from "@/lib/supabase/browser";

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
 * Attaches the session id and, if signed in, the current user id. Any failure
 * (storage blocked, network down, RLS) is swallowed.
 */
export function track(
  eventName: string,
  properties: Record<string, unknown> = {},
): void {
  try {
    if (typeof window === "undefined") return;
    const sessionId = getSessionId();
    if (!sessionId) return;

    const supabase = getBrowserSupabase();
    // Detached from the caller — nothing awaits this. getSession reads from
    // local storage (no network round-trip), so resolving the user id is cheap.
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { error } = await supabase.from("analytics_events").insert({
        event_name: eventName,
        session_id: sessionId,
        user_id: session?.user?.id ?? null,
        properties,
      });
      if (error) console.warn("[analytics] insert failed:", error.message);
    })().catch(() => {
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
