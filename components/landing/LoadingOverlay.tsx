"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/ui/Wordmark";
import { GuessTheCity } from "@/components/game/GuessTheCity";

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

interface Props {
  /** Parent flips true when the n8n response arrives and we have a redirect. */
  loadingComplete?: boolean;
  /** Parent's redirect handler. Called immediately when loading completes
   *  in default-quote mode, or after the game's reveal sequence. */
  onReady?: () => void;
}

export function LoadingOverlay({
  loadingComplete = false,
  onReady,
}: Props = {}) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [gameActive, setGameActive] = useState(false);

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

  // No-game path: when loading finishes, redirect immediately. The game has
  // its own deferred redirect via the reveal sequence and won't be subject
  // to this branch.
  // Read `onReady` through a ref so the quote-rotator's 3.8s re-renders don't
  // produce fresh callback identities that re-fire this effect.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });
  const firedRef = useRef(false);
  useEffect(() => {
    if (gameActive) return;
    if (!loadingComplete) return;
    if (firedRef.current) return;
    firedRef.current = true;
    onReadyRef.current?.();
  }, [gameActive, loadingComplete]);

  // Render the game in place of the quote/dot UI when active.
  if (gameActive) {
    return (
      <GuessTheCity
        loadingComplete={loadingComplete}
        onGameEnd={() => onReady?.()}
      />
    );
  }

  const quote = QUOTES[quoteIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden animate-fade-in-overlay"
      style={{
        background:
          "linear-gradient(160deg, #0F0805 0%, #2C1406 35%, #451E09 65%, #0F0805 100%)",
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

        {/* Opt-in mini-game trigger. Only visible until activated. */}
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setGameActive(true)}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm rounded-full px-5 py-2.5 text-white text-sm font-medium transition-all duration-200 active:scale-95"
          >
            <span aria-hidden="true">🌍</span>
            <span>Play while you wait</span>
          </button>
        </div>
      </div>
    </div>
  );
}
