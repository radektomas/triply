"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Scanning destinations...",
  "Checking flight prices...",
  "Finding best hotels...",
  "Reading thousands of reviews...",
  "Matching your vibe...",
  "Calculating your budget...",
  "Almost there...",
];

export function CyclingText() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);
  return (
    <p className="text-sm text-muted mb-6 h-5 transition-opacity duration-300">
      {MESSAGES[index]}
    </p>
  );
}
