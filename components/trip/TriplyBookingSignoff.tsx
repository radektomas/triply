"use client";

import { useEffect, useState } from "react";
import { TriplyWithBubble } from "@/components/triply/TriplyWithBubble";

const SIGNOFF_QUOTES = [
  "Alright, my work here's done. Don't overthink it — just book the dang thing.",
  "Three tabs, three vibes, one trip. Easy. Or just keep scrolling, I'll wait.",
  "Heads up — prices don't get cheaper while you debate this with your girlfriend.",
  "I found you the trip. Booking it is on you. No pressure. (Okay, a little pressure.)",
  "You came for budget travel, you got it. Now go before someone else snags the cheap flights.",
];

const ROTATE_MS = 7000;

export function TriplyBookingSignoff() {
  // Start at index 0 on both server render and first client hydration to
  // avoid a TriplyBubble text mismatch. Pick a random starting quote post-
  // mount, then rotate from there on the existing interval.
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * SIGNOFF_QUOTES.length));
    const id = setInterval(
      () => setIndex((i) => (i + 1) % SIGNOFF_QUOTES.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <TriplyWithBubble
      state="smug"
      size="md"
      quote={SIGNOFF_QUOTES[index]}
      bubbleSide="right"
    />
  );
}
