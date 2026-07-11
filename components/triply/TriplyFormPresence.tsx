"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { TriplyMascot } from "./TriplyMascot";
import { TriplyBubble } from "./TriplyBubble";
import {
  useTriplyFormReaction,
  type FormReactionInput,
} from "./useTriplyFormReaction";

// Desktop-only, absolute-positioned standing sidekick to the right of the
// form. Pose + quote come from useTriplyFormReaction. There is no mobile
// form mascot — the form-modernization pass removed the inline variant.
type TriplyFormPresenceProps = FormReactionInput;

export function TriplyFormPresence(props: TriplyFormPresenceProps) {
  const { triplyState, quote } = useTriplyFormReaction(props);

  // Window-scroll-driven fade-in matched to TriplyHeroPresence's fade-out
  // window — overlap zone 400–600 reads as one character migrating from
  // hero to form.
  const { scrollY } = useScroll();
  const formOpacity = useTransform(scrollY, [400, 750], [0, 1]);
  const formY = useTransform(scrollY, [400, 750], [30, 0]);

  // Pause the drift when scrolled out of view, on reduced-motion, or while the
  // form is submitting (the LoadingOverlay covers the form tree underneath).
  const driftRef = useRef<HTMLDivElement>(null);
  const inView = useInView(driftRef, { margin: "200px" });
  const reduceMotion = useReducedMotion();
  const drift = inView && !reduceMotion && !props.loading;

  return (
    <motion.div
      ref={driftRef}
      className="absolute pointer-events-none z-20 hidden md:block"
      style={{
        top: "20%",
        right: "-280px",
        willChange: "transform",
        opacity: formOpacity,
        y: formY,
      }}
      animate={drift ? { x: [0, 4, -2, 3, 0] } : undefined}
      transition={
        drift ? { duration: 12, repeat: Infinity, ease: "easeInOut" } : undefined
      }
      aria-hidden="true"
    >
      <div className="relative">
        <TriplyMascot state={triplyState} size="lg" paused={props.loading} />
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
