"use client";

import { motion, AnimatePresence } from "framer-motion";

type BubbleSide = "left" | "right" | "top" | "bottom";

interface TriplyBubbleProps {
  text: string;
  /**
   * Which edge of the bubble the speech-tail sits on. "left" = tail on the
   * bubble's left edge pointing leftward (so the bubble reads as right-of-
   * speaker). "bottom" = tail on the bottom edge pointing downward (so the
   * bubble reads as above-the-speaker). Etc.
   */
  side?: BubbleSide;
  className?: string;
}

function getTailStyle(side: BubbleSide): React.CSSProperties {
  switch (side) {
    case "left":
      return {
        width: 0,
        height: 0,
        borderTop: "8px solid transparent",
        borderBottom: "8px solid transparent",
        borderRight: "12px solid white",
      };
    case "right":
      return {
        width: 0,
        height: 0,
        borderTop: "8px solid transparent",
        borderBottom: "8px solid transparent",
        borderLeft: "12px solid white",
      };
    case "top":
      return {
        width: 0,
        height: 0,
        borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent",
        borderBottom: "12px solid white",
      };
    case "bottom":
      return {
        width: 0,
        height: 0,
        borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent",
        borderTop: "12px solid white",
      };
  }
}

function getTailPositionClass(side: BubbleSide): string {
  switch (side) {
    case "left":
      return "absolute bottom-3 -left-2";
    case "right":
      return "absolute bottom-3 -right-2";
    case "top":
      return "absolute -top-2 left-1/2 -translate-x-1/2";
    case "bottom":
      return "absolute -bottom-2 left-1/2 -translate-x-1/2";
  }
}

export function TriplyBubble({
  text,
  side = "left",
  className = "",
}: TriplyBubbleProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`relative inline-block bg-white text-[#0d3b2e] px-5 py-3 rounded-[20px] font-medium text-sm md:text-base shadow-[0_2px_0_rgba(0,0,0,0.15)] max-w-xs ${className}`}
      >
        {text}
        <div className={getTailPositionClass(side)} style={getTailStyle(side)} />
      </motion.div>
    </AnimatePresence>
  );
}
