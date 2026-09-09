"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CityAutocomplete,
  type CitySelection,
} from "@/components/shared/CityAutocomplete";
import { getGradient } from "@/lib/utils/gradient";
import { MAX_VISITED_PLACES, type VisitedPlace } from "@/lib/traveler";
import { StepShell, Pill } from "./StepShell";

interface Props {
  places: VisitedPlace[];
  /** Set of place ids with a photo upload in flight. */
  uploading: ReadonlySet<string>;
  adding: boolean;
  onAdd: (sel: CitySelection) => void;
  onRemove: (id: string) => void;
  onPhoto: (id: string, file: File) => void;
}

function CameraIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function StepPlaces({ places, uploading, adding, onAdd, onRemove, onPhoto }: Props) {
  const reduceMotion = useReducedMotion();
  // Remount the autocomplete after each pick so the field clears itself —
  // the component keeps its own query text after onChange fires.
  const [pickerKey, setPickerKey] = useState(0);
  const full = places.length >= MAX_VISITED_PLACES;

  function handlePick(sel: CitySelection | null) {
    if (!sel) return;
    onAdd(sel);
    setPickerKey((k) => k + 1);
  }

  return (
    <StepShell
      eyebrow="Step 2 · Been there"
      title={
        <>
          Where have you <span className="text-teal">already been?</span>
        </>
      }
      sub="Add the places you've visited, with a photo if you like. Triply learns your taste from them and skips what you've done. Photos stay private to you."
    >
      <div className="max-w-xl mx-auto w-full -mt-2">
        <label htmlFor="visited-city" className="sr-only">
          Add a place you&apos;ve visited
        </label>
        <CityAutocomplete
          key={pickerKey}
          inputId="visited-city"
          value={null}
          onChange={handlePick}
          mode="city"
          disabled={full || adding}
          placeholder={full ? "That's plenty for now" : "Type a city… Lisbon, Kraków, Bangkok"}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-[#1a1a1a]/50 font-medium px-1">
          <span>Pick it from the list to stamp it in.</span>
          <Pill tone={places.length ? "teal" : "neutral"}>
            {places.length} {places.length === 1 ? "stamp" : "stamps"}
          </Pill>
        </div>
      </div>

      <div className="min-h-[160px]">
        {places.length === 0 ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md rounded-3xl border-2 border-dashed border-[#1a1a1a]/12 bg-white/40 px-6 py-10 text-center"
          >
            <p className="font-display text-xl font-bold text-[#1a1a1a]/70">Your passport is empty.</p>
            <p className="text-sm text-[#1a1a1a]/50 mt-1">
              Add a city above and it lands here as a stamp. Or skip this — you can fill it in any time.
            </p>
          </motion.div>
        ) : (
          <motion.ul
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            aria-label="Places you've visited"
          >
            <AnimatePresence initial={false}>
              {places.map((place, i) => (
                <PlaceStamp
                  key={place.id}
                  place={place}
                  tilt={i % 2 === 0 ? -1.2 : 1.2}
                  uploading={uploading.has(place.id)}
                  onRemove={() => onRemove(place.id)}
                  onPhoto={(file) => onPhoto(place.id, file)}
                  reduceMotion={!!reduceMotion}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </StepShell>
  );
}

function PlaceStamp({
  place,
  tilt,
  uploading,
  onRemove,
  onPhoto,
  reduceMotion,
}: {
  place: VisitedPlace;
  tilt: number;
  uploading: boolean;
  onRemove: () => void;
  onPhoto: (file: File) => void;
  reduceMotion: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const hasPhoto = !!place.photoUrl;
  const pending = place.id.startsWith("tmp-");

  return (
    <motion.li
      layout
      initial={reduceMotion ? false : { opacity: 0, scale: 0.8, rotate: tilt * 4 }}
      animate={{ opacity: 1, scale: 1, rotate: tilt }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      whileHover={reduceMotion ? undefined : { rotate: 0, scale: 1.02 }}
      className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-[0_10px_30px_-12px_rgba(13,115,119,0.35)] bg-white ring-4 ring-white"
      style={{ willChange: "transform" }}
    >
      {hasPhoto ? (
        // Plain <img>: signed Supabase URLs and blob: previews are outside
        // next/image's remotePatterns and change on every load anyway.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={place.photoUrl!}
          alt={`${place.name}, ${place.country}`}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: getGradient(place.id) }}
        >
          <span className="font-display text-6xl font-bold text-white/25 select-none">
            {place.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Gradient legibility band for the name. */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />

      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <p className="font-display font-bold text-base leading-tight drop-shadow-sm truncate">
          {place.name}
        </p>
        <p className="text-[11px] font-medium text-white/80 truncate">{place.country}</p>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        disabled={pending}
        aria-label={`Remove ${place.name}`}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 text-white backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer disabled:opacity-40"
      >
        <XIcon />
      </button>

      {/* Add / change photo */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading || pending}
        aria-label={hasPhoto ? `Change photo for ${place.name}` : `Add a photo for ${place.name}`}
        className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 text-[#1a1a1a] px-2.5 py-1 text-[11px] font-semibold shadow-sm hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
      >
        <CameraIcon />
        {hasPhoto ? "Change" : "Photo"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPhoto(f);
          e.target.value = "";
        }}
      />

      {(uploading || pending) && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-[#FF6B47]/30 border-t-[#FF6B47] animate-spin" />
        </div>
      )}
    </motion.li>
  );
}
