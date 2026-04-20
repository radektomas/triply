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

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photos.length]);

  if (photos.length === 0) {
    return <div className="absolute inset-0" style={{ background: fallbackGradient }} />;
  }

  return (
    <>
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

      {/* Text readability overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === activeIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Photo ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Photographer credit */}
      <a
        href={photos[activeIndex]?.photographerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-4 text-white/50 text-xs hover:text-white/80 transition-colors z-10"
      >
        📷 {photos[activeIndex]?.photographer}
      </a>
    </>
  );
}
