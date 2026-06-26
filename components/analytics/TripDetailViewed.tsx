"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

// Fires `trip_detail_viewed` once when a destination detail page opens. The
// parent (TripDetailView) is an async server component, so this client child
// does the firing on mount. Guarded by destination identity: re-renders and
// React strict-mode double-invokes don't double-count, while navigating to a
// different destination (new `destination`) fires a fresh event. Renders
// nothing.
export function TripDetailViewed({
  destination,
  vibe,
}: {
  destination: string;
  vibe?: string | null;
}) {
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (firedFor.current === destination) return;
    firedFor.current = destination;
    track("trip_detail_viewed", {
      destination,
      ...(vibe ? { vibe } : {}),
    });
  }, [destination, vibe]);

  return null;
}
