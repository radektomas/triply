"use client";

import {
  TriplyMascot,
  type TriplyState,
  type TriplySize,
} from "./TriplyMascot";
import { TriplyBubble } from "./TriplyBubble";

interface TriplyWithBubbleProps {
  state: TriplyState;
  size?: TriplySize;
  quote?: string;
  /** Where the bubble sits relative to the mascot — controls tail direction. */
  bubbleSide?: "left" | "right";
  className?: string;
}

export function TriplyWithBubble({
  state,
  size = "md",
  quote,
  bubbleSide = "right",
  className = "",
}: TriplyWithBubbleProps) {
  return (
    <div className={`flex items-end gap-3 md:gap-4 ${className}`}>
      <TriplyMascot state={state} size={size} />
      {quote && (
        <div className="mb-8">
          <TriplyBubble
            text={quote}
            side={bubbleSide === "right" ? "left" : "right"}
          />
        </div>
      )}
    </div>
  );
}
