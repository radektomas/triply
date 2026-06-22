"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { CityPhoto } from "@/lib/photos";

interface Props {
  photos: CityPhoto[];
  fallbackGradient: string;
  destinationName: string;
  country: string;
}

export function PhotoCarousel({ photos, fallbackGradient }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Only mount image layers we've reached (+ the next one, so the crossfade is
  // instant). Avoids downloading all ~5 large2x heroes on first paint. The
  // outer layer divs always render (gradient + opacity), so the transition
  // looks identical; the <Image> inside mounts lazily.
  const [mounted, setMounted] = useState<Set<number>>(() => {
    const s = new Set<number>([0]);
    if (photos.length > 1) s.add(1);
    return s;
  });

  useEffect(() => {
    if (photos.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photos.length, isPaused]);

  // Whenever the active layer changes, ensure it and the next layer are mounted
  // ahead of their crossfade.
  useEffect(() => {
    if (photos.length === 0) return;
    setMounted((prev) => {
      const next = (activeIndex + 1) % photos.length;
      if (prev.has(activeIndex) && prev.has(next)) return prev;
      const s = new Set(prev);
      s.add(activeIndex);
      s.add(next);
      return s;
    });
  }, [activeIndex, photos.length]);

  if (photos.length === 0) {
    return <div className="absolute inset-0" style={{ background: fallbackGradient }} />;
  }

  return (
    <>
      {/* Photo layers — also carry hover-to-pause since overlays above are pointer-events-none */}
      {photos.map((photo, idx) => (
        <div
          key={photo.url}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background: fallbackGradient,
            opacity: idx === activeIndex ? 1 : 0,
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {mounted.has(idx) && (
            <Image
              src={photo.urlLarge}
              alt={photo.alt}
              fill
              sizes="100vw"
              priority={idx === 0}
              className="object-cover"
            />
          )}
        </div>
      ))}

      {/* Bottom-fade gradient — darkens top for Back/Share row and bottom for stats chips */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%, transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Carousel dots — coral pill on active, 44px tap targets */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center z-10"
          role="tablist"
          aria-label="Photo navigation"
        >
          {photos.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Show photo ${idx + 1}`}
              onClick={() => setActiveIndex(idx)}
              className="flex items-center justify-center w-11 h-11"
            >
              <span
                className="block rounded-full transition-all duration-300 ease-out"
                style={{
                  height: "8px",
                  width: idx === activeIndex ? "32px" : "8px",
                  backgroundColor:
                    idx === activeIndex
                      ? "#FF6B47"
                      : "rgba(255,228,204,0.55)",
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Photographer credit */}
      {photos[activeIndex]?.photographer && (
        <a
          href={photos[activeIndex].photographerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-4 text-white/45 text-xs hover:text-white/75 transition-colors z-10"
        >
          📷 {photos[activeIndex].photographer}
        </a>
      )}
    </>
  );
}
