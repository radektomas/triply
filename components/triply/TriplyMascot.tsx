"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TriplyBubble } from "./TriplyBubble";

export type TriplyState =
  | "idle"
  | "happy"
  | "sad"
  | "sleepy"
  | "smug"
  | "sitting"
  | "lost";
export type TriplySize = "sm" | "md" | "lg" | "xl";

interface TriplyMascotProps {
  state?: TriplyState;
  size?: TriplySize;
  className?: string;
  /** Optional short reaction line. Renders a speech bubble above-right of
   *  the mascot when state is happy/sad/smug. Ignored for other states —
   *  the sleepy "z"s are a separate accessory keyed off `state` itself. */
  bubbleText?: string;
}

const BUBBLE_STATES: ReadonlySet<TriplyState> = new Set(["happy", "sad", "smug"]);

const SIZE_MAP: Record<TriplySize, number> = {
  sm: 80,
  md: 140,
  lg: 220,
  xl: 320,
};

const FLOAT_ANIMATIONS: Record<
  TriplyState,
  {
    y: number | number[];
    rotate: number | number[];
    x?: number | number[];
  }
> = {
  idle: {
    y: [0, -10, 0, -8, 0],
    rotate: [-1.5, 1.5, -1, 2, -1.5],
  },
  sleepy: {
    y: [0, -4, 0],
    rotate: [-0.5, 0.5, -0.5],
  },
  happy: {
    y: [0, -16, -2, -14, 0],
    rotate: [-3, 3, -2, 3, 0],
  },
  sad: {
    y: [0, 2, 0],
    rotate: 0,
  },
  smug: {
    y: [0, -5, 0],
    rotate: [-1, 1, -1],
  },
  // Anchored to a card edge — gentler bob, less rotation than free idle.
  sitting: {
    y: [0, -3, 0],
    rotate: [-1, 1, -1],
  },
  // Wandering side-to-side as if looking around — small y bob, small x sway,
  // gentle rotation. Slower than idle so it reads as "lost", not "energetic".
  lost: {
    y: [0, -2, 0, -1, 0],
    x: [0, -3.5, 0, 3.5, 0],
    rotate: [-2, 1.5, -1, 2, -2],
  },
};

const FLOAT_DURATIONS: Record<TriplyState, number> = {
  idle: 3.5,
  sleepy: 4.5,
  happy: 0.8,
  sad: 2,
  smug: 2.8,
  sitting: 3.2,
  lost: 4,
};

export function TriplyMascot({
  state = "idle",
  size = "md",
  className = "",
  bubbleText,
}: TriplyMascotProps) {
  const px = SIZE_MAP[size];
  const showBubble = !!bubbleText && BUBBLE_STATES.has(state);
  // Mobile mascots are ~80–140px wide; the bubble gets a tighter footprint at
  // those sizes so it doesn't crowd the photo card next to it.
  const isCompact = size === "sm" || size === "md";

  return (
    <motion.div
      className={className}
      style={{
        width: px,
        height: px * 1.2,
        display: "inline-block",
        position: "relative",
      }}
      animate={FLOAT_ANIMATIONS[state]}
      transition={{
        duration: FLOAT_DURATIONS[state],
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg
        viewBox="0 0 400 480"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="200" cy="440" rx="100" ry="10" fill="#000" opacity="0.18" />

        {/* Body — boarding ticket */}
        <rect
          x="130"
          y="60"
          width="180"
          height="260"
          rx="20"
          fill="#0d3b2e"
          stroke="#1f5d48"
          strokeWidth="3"
        />
        <line
          x1="130"
          y1="115"
          x2="310"
          y2="115"
          stroke="#2a8866"
          strokeWidth="2"
          strokeDasharray="5 4"
          opacity="0.7"
        />

        {/* Logo */}
        <rect x="148" y="75" width="80" height="26" rx="4" fill="#2a8866" opacity="0.4" />
        <text
          x="188"
          y="92"
          textAnchor="middle"
          fontSize="14"
          fill="#a8e8c8"
          fontWeight="500"
          fontFamily="system-ui"
        >
          TRIPLY
        </text>
        <rect x="236" y="75" width="58" height="26" rx="4" fill="#2a8866" opacity="0.25" />
        <text
          x="265"
          y="92"
          textAnchor="middle"
          fontSize="11"
          fill="#7dd9b0"
          fontWeight="500"
          fontFamily="system-ui"
        >
          → ESC
        </text>

        {/* Ticket details */}
        <rect x="148" y="128" width="60" height="5" rx="1" fill="#2a8866" opacity="0.5" />
        <rect x="148" y="142" width="90" height="5" rx="1" fill="#2a8866" opacity="0.5" />
        <rect x="148" y="156" width="70" height="5" rx="1" fill="#2a8866" opacity="0.5" />

        {/* FACE — state-specific */}
        <TriplyFace state={state} />

        {/* ARMS — state-specific */}
        <TriplyArms state={state} />

        {/* LEGS — standing pose has feet planted; sitting pose has legs
            dangling straight down at a slight outward angle (left swings out
            left, right swings out right) with feet tilted as if swinging. */}
        {state === "sitting" ? (
          <g>
            <line
              x1="180"
              y1="320"
              x2="172"
              y2="380"
              stroke="#0d3b2e"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <line
              x1="260"
              y1="320"
              x2="270"
              y2="380"
              stroke="#0d3b2e"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <ellipse
              cx="170"
              cy="385"
              rx="13"
              ry="4.5"
              fill="#0d3b2e"
              transform="rotate(-15 170 385)"
            />
            <ellipse
              cx="272"
              cy="385"
              rx="13"
              ry="4.5"
              fill="#0d3b2e"
              transform="rotate(15 272 385)"
            />
          </g>
        ) : (
          <g>
            <line
              x1="180"
              y1="320"
              x2="195"
              y2="370"
              stroke="#0d3b2e"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <line
              x1="260"
              y1="320"
              x2="245"
              y2="370"
              stroke="#0d3b2e"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <ellipse cx="195" cy="375" rx="14" ry="5" fill="#0d3b2e" />
            <ellipse cx="245" cy="375" rx="14" ry="5" fill="#0d3b2e" />
            <ellipse cx="190" cy="372" rx="5" ry="1.5" fill="#1f5d48" opacity="0.6" />
            <ellipse cx="240" cy="372" rx="5" ry="1.5" fill="#1f5d48" opacity="0.6" />
          </g>
        )}
      </svg>

      {/* Speech bubble — above-right of the head, anchored just inside the
          wrapper's top-right corner so it reads as part of the mascot's
          gesture. Lives inside the float wrapper so it bobs with the body.
          AnimatePresence here handles mount/unmount fade between rounds;
          TriplyBubble's internal AnimatePresence handles text-change fade
          if `bubbleText` swaps while showing. */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            key="speech-bubble"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute pointer-events-none"
            style={{
              top: "-6%",
              left: "78%",
              // `width: max-content` bypasses the CSS shrink-to-fit clamp on
              // absolutely-positioned boxes with `left` set and `right: auto`.
              // Without this the wrapper collapses to (container_width - left)
              // available space (~31px at md), which forced the bubble inside
              // to wrap one word per line. With max-content the wrapper sizes
              // to the bubble's own max-w-[150px] / max-w-[200px].
              width: "max-content",
            }}
          >
            <TriplyBubble
              text={bubbleText!}
              side="left"
              className={
                isCompact
                  ? "text-xs px-3 py-1.5 max-w-[150px] whitespace-normal leading-snug"
                  : "text-sm px-4 py-2 max-w-[200px] whitespace-normal leading-snug"
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TriplyFace({ state }: { state: TriplyState }) {
  if (state === "smug") {
    return (
      <g>
        {/* Asymmetric brows — left is arched (raised), right is flat-tilted. */}
        <path
          d="M 165 185 Q 180 178 195 188"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="208"
          y1="185"
          x2="232"
          y2="188"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <rect
          x="160"
          y="195"
          width="32"
          height="22"
          rx="6"
          fill="#1a1a1a"
          stroke="#000"
          strokeWidth="1.5"
        />
        <rect
          x="208"
          y="195"
          width="32"
          height="22"
          rx="6"
          fill="#1a1a1a"
          stroke="#000"
          strokeWidth="1.5"
        />
        <line x1="192" y1="206" x2="208" y2="206" stroke="#1a1a1a" strokeWidth="3" />
        <line
          x1="166"
          y1="200"
          x2="178"
          y2="200"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <line
          x1="214"
          y1="200"
          x2="226"
          y2="200"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M 175 245 Q 200 240 220 250"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (state === "happy") {
    return (
      <g>
        {/* High arched excited brows. */}
        <path
          d="M 165 188 Q 180 180 195 188"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 205 188 Q 220 180 235 188"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 165 200 Q 180 185 195 200"
          fill="none"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 205 200 Q 220 185 235 200"
          fill="none"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 170 240 Q 200 268 230 240"
          fill="none"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (state === "sad") {
    return (
      <g>
        {/* Inner-UP / outer-DOWN pronounced sad brows. */}
        <line
          x1="162"
          y1="202"
          x2="192"
          y2="186"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="208"
          y1="186"
          x2="238"
          y2="202"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="180" cy="210" r="9" fill="#fff" />
        <circle cx="220" cy="210" r="9" fill="#fff" />
        <circle cx="180" cy="213" r="5" fill="#0d3b2e" />
        <circle cx="220" cy="213" r="5" fill="#0d3b2e" />
        {/* Slow teardrop falling from the left eye. */}
        <motion.ellipse
          cx="180"
          cy="222"
          rx="2.5"
          ry="4"
          fill="#7dd9b0"
          opacity="0.85"
          animate={{ cy: [222, 260, 260], opacity: [0, 0.9, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: "easeIn",
          }}
        />
        <path
          d="M 175 260 Q 200 245 225 260"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (state === "lost") {
    return (
      <g>
        {/* Puzzled asymmetric brows — left arched higher, right tilted. */}
        <path
          d="M 165 190 Q 178 178 195 188"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 208 188 Q 222 184 233 192"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Eyes — slightly wider than idle (r=10 vs 9), pupils offset right
            so the mascot reads as looking around / searching. */}
        <circle cx="180" cy="210" r="10" fill="#fff" />
        <circle cx="183" cy="213" r="5" fill="#0d3b2e" />
        <circle cx="220" cy="210" r="10" fill="#fff" />
        <circle cx="223" cy="213" r="5" fill="#0d3b2e" />
        {/* Small open "o" mouth — "huh, where am I". */}
        <ellipse
          cx="200"
          cy="250"
          rx="5"
          ry="3.5"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
        />
        {/* Floating question mark above-right of the head — same easing /
            offset pattern as the sleepy z's. */}
        <motion.text
          x="318"
          y="80"
          fontSize="26"
          fill="#7dd9b0"
          fontWeight="600"
          fontFamily="system-ui"
          animate={{ y: [80, 62, 80], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          ?
        </motion.text>
        <motion.text
          x="336"
          y="58"
          fontSize="16"
          fill="#7dd9b0"
          fontWeight="600"
          fontFamily="system-ui"
          animate={{ y: [58, 42, 58], opacity: [0.2, 0.8, 0.2] }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.9,
          }}
        >
          ?
        </motion.text>
      </g>
    );
  }

  if (state === "sleepy") {
    return (
      <g>
        {/* Flat low chill brows. */}
        <line
          x1="167"
          y1="200"
          x2="193"
          y2="200"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <line
          x1="207"
          y1="200"
          x2="233"
          y2="200"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <line
          x1="165"
          y1="210"
          x2="195"
          y2="210"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="205"
          y1="210"
          x2="235"
          y2="210"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <ellipse cx="200" cy="248" rx="8" ry="4" fill="#fff" />
        <motion.text
          x="320"
          y="80"
          fontSize="22"
          fill="#7dd9b0"
          fontWeight="500"
          animate={{ y: [80, 60, 80], opacity: [0, 1, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          z
        </motion.text>
        <motion.text
          x="335"
          y="60"
          fontSize="16"
          fill="#7dd9b0"
          fontWeight="500"
          animate={{ y: [60, 40, 60], opacity: [0, 1, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
        >
          z
        </motion.text>
      </g>
    );
  }

  // idle (default) — friendly brows, bigger eyes, periodic blink + look-around.
  return (
    <g>
      {/* Slightly raised friendly brows. */}
      <path
        d="M 168 192 Q 180 188 192 192"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 208 192 Q 220 188 232 192"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <motion.g
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 4 }}
        style={{ transformOrigin: "180px 210px" }}
      >
        <circle cx="180" cy="210" r="9" fill="#fff" />
        <motion.circle
          cx="180"
          cy="213"
          r="5"
          fill="#0d3b2e"
          animate={{ cx: [180, 178, 180, 182, 180] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatDelay: 4,
            times: [0, 0.1, 0.5, 0.6, 1],
          }}
        />
      </motion.g>
      <motion.g
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 4 }}
        style={{ transformOrigin: "220px 210px" }}
      >
        <circle cx="220" cy="210" r="9" fill="#fff" />
        <motion.circle
          cx="220"
          cy="213"
          r="5"
          fill="#0d3b2e"
          animate={{ cx: [220, 218, 220, 222, 220] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatDelay: 4,
            times: [0, 0.1, 0.5, 0.6, 1],
          }}
        />
      </motion.g>
      <path
        d="M 175 245 Q 200 258 225 245"
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </g>
  );
}

function TriplyArms({ state }: { state: TriplyState }) {
  // Right arm holds coconut on idle/sleepy/smug, raised on happy, droopy on sad.
  if (state === "happy") {
    return (
      <g>
        <line
          x1="130"
          y1="180"
          x2="100"
          y2="140"
          stroke="#0d3b2e"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <circle cx="98" cy="138" r="6" fill="#0d3b2e" />
        <line
          x1="310"
          y1="180"
          x2="340"
          y2="140"
          stroke="#0d3b2e"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <circle cx="342" cy="138" r="6" fill="#0d3b2e" />
      </g>
    );
  }

  if (state === "lost") {
    // Shrug — both arms angled slightly up and out, palms-ish forward.
    // Reuses the existing single-line + hand-circle primitive; arms stay
    // outside the dark body so they read against the page background.
    return (
      <g>
        <line
          x1="130"
          y1="220"
          x2="95"
          y2="200"
          stroke="#0d3b2e"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <circle cx="92" cy="198" r="6.5" fill="#0d3b2e" />
        <line
          x1="310"
          y1="220"
          x2="345"
          y2="200"
          stroke="#0d3b2e"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <circle cx="348" cy="198" r="6.5" fill="#0d3b2e" />
      </g>
    );
  }

  if (state === "sad") {
    return (
      <g>
        <line
          x1="130"
          y1="220"
          x2="105"
          y2="265"
          stroke="#0d3b2e"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <circle cx="102" cy="268" r="6" fill="#0d3b2e" />
        <line
          x1="310"
          y1="220"
          x2="335"
          y2="265"
          stroke="#0d3b2e"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <circle cx="338" cy="268" r="6" fill="#0d3b2e" />
      </g>
    );
  }

  // idle, sleepy, smug — left arm chill, right arm holds coconut
  return (
    <g>
      <line
        x1="130"
        y1="220"
        x2="105"
        y2="245"
        stroke="#0d3b2e"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <circle cx="102" cy="248" r="6" fill="#0d3b2e" />
      <line
        x1="310"
        y1="220"
        x2="335"
        y2="245"
        stroke="#0d3b2e"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* Coconut + straw + leaf — gentle sway around the hand pivot. */}
      <motion.g
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "335px 245px" }}
      >
        <circle cx="345" cy="265" r="22" fill="#5a3520" stroke="#3d2415" strokeWidth="2" />
        <ellipse cx="345" cy="258" rx="14" ry="4" fill="#7a4a30" opacity="0.6" />
        <ellipse cx="345" cy="270" rx="10" ry="2" fill="#3d2415" opacity="0.4" />
        <ellipse cx="345" cy="248" rx="5" ry="2.5" fill="#2a1810" />
        <line
          x1="348"
          y1="247"
          x2="343"
          y2="218"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="343"
          y1="247"
          x2="343"
          y2="218"
          stroke="#e8a8a8"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M 345 244 Q 358 235 364 240 Q 360 246 345 246"
          fill="#2a8866"
          stroke="#1f5d48"
          strokeWidth="1"
        />
      </motion.g>
    </g>
  );
}
