"use client";

import { useEffect, useState } from "react";
import { LOADING_QUOTES } from "@/lib/quotes";

// Rotating Duolingo-style loading line. Replaces the static "Planning your
// escape…" footer in both LoadingOverlay (default state) and GuessTheCity
// (mini-game state). Caller controls layout/colors via `className`.
interface Props {
  className?: string;
}

const ROTATE_MS = 2500;
const FADE_MS = 300;

export function LoadingFooter({ className = "" }: Props) {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * LOADING_QUOTES.length),
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % LOADING_QUOTES.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <p
      className={`transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      {LOADING_QUOTES[index]}
    </p>
  );
}
