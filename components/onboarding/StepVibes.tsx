"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon } from "@/components/landing/VibeIcons";
import { MAX_VIBES, type TravelerVibe } from "@/lib/traveler";
import { VIBE_PRESETS } from "./vibePresets";
import { StepShell, Pill } from "./StepShell";

interface Props {
  firstName: string;
  value: TravelerVibe[];
  onChange: (next: TravelerVibe[]) => void;
}

export function StepVibes({ firstName, value, onChange }: Props) {
  const reduceMotion = useReducedMotion();
  const full = value.length >= MAX_VIBES;

  function toggle(v: TravelerVibe) {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else if (!full) {
      onChange([...value, v]);
    }
  }

  return (
    <StepShell
      eyebrow="Step 1 · Your vibe"
      title={
        <>
          Hey {firstName}, what kind of trips{" "}
          <span className="text-accent">light you up?</span>
        </>
      }
      sub={
        <>
          Pick up to {MAX_VIBES}. The first one you tap leads your picks.
        </>
      }
    >
      <div className="flex justify-center -mt-3">
        <Pill tone={value.length ? "accent" : "neutral"}>
          {value.length} / {MAX_VIBES} picked
        </Pill>
      </div>

      <div
        role="group"
        aria-label="Trip vibes"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
      >
        {VIBE_PRESETS.map((preset, i) => {
          const idx = value.indexOf(preset.value);
          const active = idx >= 0;
          const disabled = !active && full;
          const iconColor = active ? "#ffffff" : preset.color;
          return (
            <motion.button
              key={preset.value}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => toggle(preset.value)}
              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 1 }}
              animate={{ opacity: disabled ? 0.45 : 1, y: 0, scale: active ? 1.04 : 1 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.03 * i, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduceMotion || disabled || active ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion || disabled ? undefined : { scale: 0.96 }}
              className={`relative rounded-2xl py-5 px-3 flex flex-col items-center justify-center gap-2 cursor-pointer select-none transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                active ? "shadow-lg" : "hover:shadow-md"
              } ${disabled ? "cursor-not-allowed" : ""}`}
              style={{
                backgroundColor: active ? preset.color : "rgba(255,255,255,0.72)",
                color: active ? "#ffffff" : "#1a1a1a",
                minHeight: 104,
              }}
            >
              <preset.Icon color={iconColor} size={34} />
              <span className="text-sm font-semibold leading-tight">{preset.label}</span>

              <AnimatePresence>
                {active && (
                  <motion.span
                    key="badge"
                    initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={reduceMotion ? undefined : { scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 26 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-[#1a1a1a] flex items-center justify-center text-[11px] font-bold shadow-sm"
                    aria-hidden="true"
                  >
                    {idx === 0 ? <CheckIcon color={preset.color} size={13} /> : idx + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </StepShell>
  );
}
