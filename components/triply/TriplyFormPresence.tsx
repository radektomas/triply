"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { TriplyMascot } from "./TriplyMascot";
import { TriplyBubble } from "./TriplyBubble";
import {
  useTriplyFormReaction,
  type FormReactionInput,
} from "./useTriplyFormReaction";

// Desktop variant — absolute-positioned standing sidekick to the right of
// the form card. Pose + quote come from useTriplyFormReaction. Hidden on
// mobile; the mobile variant (TriplyFormPresenceMobile) renders inline
// inside the form card after ProgressDots.
type TriplyFormPresenceProps = FormReactionInput;

export function TriplyFormPresence(props: TriplyFormPresenceProps) {
  const { triplyState, quote } = useTriplyFormReaction(props);

  // Window-scroll-driven fade-in matched to TriplyHeroPresence's fade-out
  // window — overlap zone 400–600 reads as one character migrating from
  // hero to form.
  const { scrollY } = useScroll();
  const formOpacity = useTransform(scrollY, [400, 750], [0, 1]);
  const formY = useTransform(scrollY, [400, 750], [30, 0]);

  return (
    <motion.div
      className="absolute pointer-events-none z-20 hidden md:block"
      style={{
        top: "20%",
        right: "-280px",
        willChange: "transform",
        opacity: formOpacity,
        y: formY,
      }}
      animate={{ x: [0, 4, -2, 3, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <div className="relative">
        <TriplyMascot state={triplyState} size="lg" />
        <div
          className="absolute pointer-events-auto"
          style={{
            top: "20%",
            left: "calc(100% + 0.5rem)",
            width: "200px",
          }}
        >
          <TriplyBubble text={quote} side="left" />
        </div>
      </div>
    </motion.div>
  );
}

// Mobile inline variant — renders inside the form card after ProgressDots.
// No absolute positioning, no scroll-fade. Same reactivity hook so pose
// and quote stay consistent with the desktop instance.
type TriplyFormPresenceMobileProps = FormReactionInput;

export function TriplyFormPresenceMobile(
  props: TriplyFormPresenceMobileProps,
) {
  const { triplyState, quote } = useTriplyFormReaction(props);

  return (
    <div className="md:hidden flex items-end justify-center gap-3 mb-6 mt-2">
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <TriplyMascot state={triplyState} size="sm" />
      </motion.div>
      <div className="mb-4 max-w-[60%]">
        <TriplyBubble text={quote} side="left" />
      </div>
    </div>
  );
}
