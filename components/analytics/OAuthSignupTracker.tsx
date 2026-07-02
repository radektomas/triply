"use client";

import { useEffect } from "react";
import { track, identify } from "@/lib/analytics";

// The OAuth callback (/auth/callback) runs server-side, where the browser's
// localStorage session id isn't reachable — so it can't fire account_created or
// run the identity backfill itself. Instead, for a genuinely new account it
// appends ?triply_new=<method> to the post-login redirect; we pick that up on
// the first authenticated landing and fire the funnel event + backfill here,
// where getSessionId() works. The flag is stripped from the URL before we do
// anything else, so a reload or React re-mount can't double-count.
const PARAM = "triply_new";
// `google` = OAuth callback; `email` = confirmed email-signup callback (the
// verifyOtp success path). Both land here with ?triply_new=<method> only on a
// genuinely new account, so both should fire account_created once.
const KNOWN_METHODS = new Set(["google", "email"]);

export function OAuthSignupTracker() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const method = url.searchParams.get(PARAM);
      if (!method) return;
      // Consume the flag immediately (before any early return) so it can never
      // fire twice for the same signup.
      url.searchParams.delete(PARAM);
      window.history.replaceState(null, "", url.toString());
      if (!KNOWN_METHODS.has(method)) return;
      // Fire-and-forget. track() attaches the new user_id; identify() backfills
      // the session's anonymous pre-signup rows. Mirrors the email path.
      track("account_created", { method });
      identify();
    } catch {
      // never break the page
    }
  }, []);

  return null;
}
