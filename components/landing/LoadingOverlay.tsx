"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/ui/Wordmark";

const QUOTES = [
  { text: "The world is a book, and those who do not travel read only one page.", author: "Saint Augustine" },
  { text: "Travel is the only thing you buy that makes you richer.", author: "Anonymous" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "To travel is to live.", author: "Hans Christian Andersen" },
  { text: "Life is short and the world is wide.", author: "Simon Raven" },
  { text: "Adventure is worthwhile in itself.", author: "Amelia Earhart" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Travel makes one modest — you see what a tiny place you occupy in the world.", author: "Gustave Flaubert" },
  { text: "Once a year, go somewhere you've never been before.", author: "Dalai Lama" },
];

export function LoadingOverlay() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setQuoteIndex((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 400);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[quoteIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden animate-fade-in-overlay"
      style={{
        background: "linear-gradient(160deg, #0F0805 0%, #2C1406 35%, #451E09 65%, #0F0805 100%)",
      }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute rounded-full opacity-20 animate-mesh-1 pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, #FF6B47 0%, transparent 70%)",
          top: "-120px",
          right: "-120px",
        }}
      />
      <div
        className="absolute rounded-full opacity-15 animate-mesh-2 pointer-events-none"
        style={{
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, #FFB088 0%, transparent 70%)",
          bottom: "-80px",
          left: "-80px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full mx-auto px-8 text-center">
        <div className="flex justify-center mb-12">
          <Wordmark size="sm" />
        </div>

        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 400ms ease, transform 400ms ease",
          }}
        >
          <blockquote className="text-white text-2xl md:text-3xl font-light leading-relaxed mb-6">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <cite className="text-white/40 text-sm not-italic tracking-wide">
            — {quote.author}
          </cite>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-16">
          {QUOTES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: i === quoteIndex ? "24px" : "6px",
                height: "6px",
                backgroundColor:
                  i === quoteIndex ? "#FF6B47" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>

        <p className="text-white/20 text-xs mt-10 tracking-[0.2em] uppercase">
          Planning your escape…
        </p>
      </div>
    </div>
  );
}
