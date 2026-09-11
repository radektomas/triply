"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getGradient } from "@/lib/utils/gradient";
import { flagEmoji } from "@/lib/data/countryCodes";
import { RATING_LABELS, type PlaceRating, type VisitedPlace } from "@/lib/traveler";

const EASE = [0.22, 1, 0.36, 1] as const;
const SCALE: PlaceRating[] = [1, 2, 3, 4, 5];

interface Props {
  /** The stamp being rated; null closes the modal. */
  place: VisitedPlace | null;
  onRate: (id: string, rating: PlaceRating) => void;
  onClose: () => void;
}

// Pops up the moment a country is stamped: photo, name, one question, five
// dots. Tapping a dot saves and closes on its own — no confirm button. The
// dots fill left-to-right like the vibe tray, in the theme gradient.
export function RateCountryModal({ place, onRate, onClose }: Props) {
  return (
    <AnimatePresence>
      {place && <Sheet key={place.countryCode} place={place} onRate={onRate} onClose={onClose} />}
    </AnimatePresence>
  );
}

function Sheet({ place, onRate, onClose }: { place: VisitedPlace } & Omit<Props, "place">) {
  const reduceMotion = useReducedMotion();
  const [hover, setHover] = useState<PlaceRating | null>(null);
  const [picked, setPicked] = useState<PlaceRating | null>(place.rating);
  const [locked, setLocked] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const photo = place.photoUrl ?? place.stockPhotoUrl;
  const flag = flagEmoji(place.countryCode);
  const shown = hover ?? picked;

  useEffect(() => {
    // Focus the sheet itself, not a dot — focusing a dot would preview a
    // rating the traveler hasn't chosen. Tab reaches the dots from here.
    dialogRef.current?.focus({ preventScroll: true });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [onClose]);

  function pick(r: PlaceRating) {
    if (locked) return;
    setPicked(r);
    setLocked(true);
    onRate(place.id, r);
    // Let the fill land and the label read before the sheet leaves.
    closeTimer.current = setTimeout(onClose, reduceMotion ? 250 : 720);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        aria-label="Skip rating"
        onClick={onClose}
        className="absolute inset-0 bg-[#1a1a1a]/45 backdrop-blur-sm cursor-default"
      />
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rate-title"
        initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97, transition: { duration: 0.18 } }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="relative w-full max-w-md rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] overflow-hidden focus:outline-none"
        style={{ willChange: "transform" }}
      >
        {/* Hero */}
        <div className="relative aspect-[16/10]">
          <div className="absolute inset-0" style={{ background: getGradient(place.id) }} />
          {photo && (
            <motion.img
              key={photo}
              src={photo}
              alt={place.name}
              draggable={false}
              initial={reduceMotion ? false : { opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white flex items-end gap-3">
            {flag && <span className="text-4xl leading-none drop-shadow">{flag}</span>}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Stamped</p>
              <p className="font-display font-bold text-3xl leading-none truncate drop-shadow-sm">{place.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Skip"
            className="absolute top-3 right-3 rounded-full bg-black/40 text-white text-xs font-semibold px-3 py-1.5 backdrop-blur-sm hover:bg-black/60 transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Question */}
        <div className="px-6 pt-5 pb-6 text-center">
          <h2 id="rate-title" className="font-display text-2xl font-bold text-[#1a1a1a] leading-tight">
            How was {place.name}?
          </h2>
          <p className="text-sm text-[#1a1a1a]/55 mt-1">One tap. It teaches Triply what you like.</p>

          <div
            role="radiogroup"
            aria-label={`Rate ${place.name}`}
            className="mt-6 flex items-center justify-center gap-3 sm:gap-4"
            onMouseLeave={() => setHover(null)}
          >
            {SCALE.map((r, i) => {
              const filled = shown !== null && r <= shown;
              const isPicked = picked === r;
              return (
                <motion.button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={picked === r}
                  aria-label={`${r} of 5, ${RATING_LABELS[r]}`}
                  disabled={locked}
                  onMouseEnter={() => setHover(r)}
                  onFocus={() => setHover(r)}
                  onBlur={() => setHover(null)}
                  onClick={() => pick(r)}
                  whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                  animate={
                    reduceMotion
                      ? undefined
                      : { scale: isPicked ? [1, 1.28, 1] : 1 }
                  }
                  transition={{ duration: 0.36, ease: EASE }}
                  className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full cursor-pointer disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
                  style={{ willChange: "transform" }}
                >
                  {/* Empty ring */}
                  <span className="absolute inset-0 rounded-full border-2 border-dashed border-[#1a1a1a]/20 bg-white" />
                  {/* Filled disc — opacity/scale only */}
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full shadow-[0_8px_20px_-8px_rgba(255,107,71,0.6)]"
                    style={{
                      background: "linear-gradient(135deg, #0D7377 0%, #FF6B47 100%)",
                      willChange: "transform, opacity",
                    }}
                    initial={false}
                    animate={{ opacity: filled ? 1 : 0, scale: filled ? 1 : 0.55 }}
                    transition={{
                      type: "spring",
                      stiffness: 520,
                      damping: 30,
                      delay: reduceMotion || !filled ? 0 : i * 0.03,
                    }}
                  />
                  <span
                    className={`absolute inset-0 flex items-center justify-center font-display font-bold text-base transition-colors ${
                      filled ? "text-white" : "text-[#1a1a1a]/35"
                    }`}
                  >
                    {r}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-4 h-6 relative" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={shown ?? "none"}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.12 } }}
                transition={{ duration: 0.18, ease: EASE }}
                className={`absolute inset-x-0 text-sm font-semibold ${
                  shown ? "text-[#1a1a1a]" : "text-[#1a1a1a]/40"
                }`}
              >
                {shown ? RATING_LABELS[shown] : "Meh → take me back"}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
