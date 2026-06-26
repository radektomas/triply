"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

// Fires `landing_view` once per browser session. The sessionStorage flag keeps
// it to one event per session (survives client re-renders / fast-refresh, resets
// when the tab session ends) rather than one per mount. Renders nothing.
const FLAG = "triply_landing_view_tracked";

export function LandingView() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(FLAG)) return;
      sessionStorage.setItem(FLAG, "1");
    } catch {
      // sessionStorage unavailable (private mode) — fall through and still
      // fire once for this mount rather than not at all.
    }
    track("landing_view");
  }, []);

  return null;
}
