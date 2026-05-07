"use client";

import { useState } from "react";
import { TriplyWithBubble } from "@/components/triply/TriplyWithBubble";
import type { TriplyState } from "@/components/triply/TriplyMascot";

const STATES: TriplyState[] = [
  "idle",
  "happy",
  "sad",
  "sleepy",
  "smug",
  "sitting",
];
const QUOTES: Record<TriplyState, string> = {
  idle: "Tell me your budget. I'll find you a trip.",
  happy: "Nailed it. ✈️",
  sad: "Bold guess. Wrong, but bold.",
  sleepy: "Bribing the algorithm...",
  smug: "3/3. Cartographer behavior.",
  sitting: "fill it in. I'll handle the rest.",
};

export default function TriplyTestPage() {
  const [state, setState] = useState<TriplyState>("idle");

  return (
    <div className="min-h-screen bg-[#0a1f17] p-8 flex flex-col items-center gap-8">
      <h1 className="text-white text-2xl font-medium">Triply mascot test</h1>

      <div className="flex gap-2 flex-wrap justify-center">
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className={`px-4 py-2 rounded-md ${
              state === s ? "bg-white text-[#0d3b2e]" : "bg-[#1f5d48] text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center min-h-[400px]">
        <TriplyWithBubble state={state} size="xl" quote={QUOTES[state]} />
      </div>
    </div>
  );
}
