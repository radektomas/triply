"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon } from "@/components/landing/VibeIcons";
import { MAX_VIBES, type TravelerVibe } from "@/lib/traveler";
import { VIBE_BY_VALUE, VIBE_PRESETS } from "./vibePresets";
import { StepShell } from "./StepShell";

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
      <MixTray value={value} onRemove={(v) => toggle(v)} reduceMotion={!!reduceMotion} />

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

// "Your mix": four slots straight on the page background that fill, in
// order, with the vibes the traveler taps (the first one steers the picks).
// Tapping a filled slot removes that vibe. Replaces the old "n / 4" counter.
function MixTray({
  value,
  onRemove,
  reduceMotion,
}: {
  value: TravelerVibe[];
  onRemove: (v: TravelerVibe) => void;
  reduceMotion: boolean;
}) {
  const slots = Array.from({ length: MAX_VIBES }, (_, i) => value[i] ?? null);
  const caption =
    value.length === 0
      ? "Tap a tile to fill your mix"
      : value.length < MAX_VIBES
        ? `${MAX_VIBES - value.length} more if you want`
        : "That's a full mix";

  return (
    <div className="flex flex-col items-center gap-2 -mt-3">
      <div className="inline-flex items-center gap-3" role="list" aria-label="Your mix">
        {slots.map((v, i) => {
          const preset = v ? VIBE_BY_VALUE[v] : null;
          return (
            <div key={i} role="listitem" className="relative flex flex-col items-center">
              <AnimatePresence mode="popLayout" initial={false}>
                {preset ? (
                  <motion.button
                    key={preset.value}
                    type="button"
                    onClick={() => onRemove(preset.value)}
                    aria-label={`Remove ${preset.label}${i === 0 ? " (lead vibe)" : ""}`}
                    initial={reduceMotion ? false : { scale: 0.3, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={reduceMotion ? undefined : { scale: 0.3, opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 520, damping: 24 }}
                    whileHover={reduceMotion ? undefined : { scale: 1.08 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md cursor-pointer"
                    style={{ backgroundColor: preset.color }}
                    title={`${preset.label} — tap to remove`}
                  >
                    <preset.Icon color="#fff" size={22} />
                  </motion.button>
                ) : (
                  <motion.span
                    key="empty"
                    initial={false}
                    animate={{ opacity: 1 }}
                    className="w-12 h-12 rounded-full border-2 border-dashed border-[#1a1a1a]/20 flex items-center justify-center text-[#1a1a1a]/30 text-xs font-bold"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-xs font-medium text-[#1a1a1a]/50" aria-live="polite">
        {caption}
      </p>
    </div>
  );
}
