"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TriplyMascot } from "./TriplyMascot";
import { TriplyBubble } from "./TriplyBubble";
import { HERO_QUOTES, getNextQuote } from "@/lib/quotes";

const QUOTE_ROTATION_MS = 6000;

export function TriplyHeroPresence() {
  const { scrollY } = useScroll();

  // Tighter cross-fade window: hero stays full-opacity until scrollY 300, then
  // fades to 0 by 600. Form Triply (TriplyFormPresence) starts fading in at
  // 400 and is fully visible by 750 — overlap zone 400–600 reads as one
  // character migrating from hero to form.
  const opacity = useTransform(scrollY, [0, 300, 600], [1, 1, 0]);
  const y = useTransform(scrollY, [0, 600], [0, -40]);
  const scale = useTransform(scrollY, [0, 600], [1, 0.9]);

  // Rotate hero quotes every 6s. AnimatePresence inside TriplyBubble keys on
  // text and handles the fade — we just feed it a fresh string.
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(HERO_QUOTES[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const { quote, nextIndex } = getNextQuote(HERO_QUOTES, quoteIndex);
      setCurrentQuote(quote);
      setQuoteIndex(nextIndex);
    }, QUOTE_ROTATION_MS);
    return () => clearInterval(interval);
  }, [quoteIndex]);

  return (
    // pointer-events-none on the wrapper so Triply never intercepts clicks
    // meant for the adjacent CTA. The bubble re-enables pointer events for
    // itself so users can still select the quote text.
    <motion.div
      // willChange promotes the wrapper to its own compositor layer so the
      // simultaneous transforms (scroll-driven y/scale, drift x) don't force
      // paint/layout recalcs on surrounding hero content during scroll.
      style={{ opacity, y, scale, willChange: "transform" }}
      className="pointer-events-none relative"
      aria-hidden="true"
      // Subtle sinusoidal x-drift, slower and smaller-amplitude than before
      // so it doesn't compound visually with the bubble's fade transitions.
      animate={{ x: [0, 4, -2, 3, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Mascot is the layout anchor — defines the wrapper's bounding box. */}
      <TriplyMascot state="idle" size="lg" />

      {/* Ambient quote bubble — sits to the left of the mascot, hidden below
          the lg breakpoint so smaller viewports just get Triply alone. Fixed
          width avoids wrap-driven layout shifts on quote change. */}
      <div
        className="absolute pointer-events-auto hidden lg:block"
        style={{
          top: "10%",
          left: "calc(100% - 1rem)",
          width: "200px",
        }}
      >
        <TriplyBubble text={currentQuote} side="left" />
      </div>
    </motion.div>
  );
}
