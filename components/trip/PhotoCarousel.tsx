"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (photos.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photos.length, isPaused]);

  if (photos.length === 0) {
    return <div className="absolute inset-0" style={{ background: fallbackGradient }} />;
  }

  return (
    <>
      {/* Photo layers */}
      {photos.map((photo, idx) => (
        <div
          key={photo.url}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            backgroundImage: `url('${photo.urlLarge}'), ${fallbackGradient}`,
            backgroundSize: "cover, 100% 100%",
            backgroundPosition: "center",
            opacity: idx === activeIndex ? 1 : 0,
          }}
          role="img"
          aria-label={photo.alt}
        />
      ))}

      {/* Bottom-fade gradient for text legibility + hover detection area */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%, transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
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
