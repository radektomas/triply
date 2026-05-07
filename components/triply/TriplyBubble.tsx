"use client";

import { motion, AnimatePresence } from "framer-motion";

interface TriplyBubbleProps {
  text: string;
  /** Direction the speech-tail points. "left" = tail on left edge of bubble. */
  side?: "left" | "right";
  className?: string;
}

export function TriplyBubble({
  text,
  side = "left",
  className = "",
}: TriplyBubbleProps) {
  // Compose the tail style without a computed-key style (which TS narrows
  // awkwardly). Using two static branches keeps types clean.
  const tailStyle: React.CSSProperties =
    side === "left"
      ? {
          width: 0,
          height: 0,
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          borderRight: "12px solid white",
        }
      : {
          width: 0,
          height: 0,
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          borderLeft: "12px solid white",
        };

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
        <div
          className={`absolute bottom-3 ${side === "left" ? "-left-2" : "-right-2"}`}
          style={tailStyle}
        />
      </motion.div>
    </AnimatePresence>
  );
}
