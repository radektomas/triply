"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/ui/Wordmark";
import { GuessTheCity } from "@/components/game/GuessTheCity";
import { LoadingFooter } from "@/components/shared/LoadingFooter";
import { TriplyMascot } from "@/components/triply/TriplyMascot";
import { TriplyBubble } from "@/components/triply/TriplyBubble";

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

// Sleep-themed lines for Triply's bubble while the AI works. Rotation runs
// at 4500ms — deliberately off-tempo from the 3800ms travel-quote rotation so
// the two banks don't sync up visually.
const SLEEP_QUOTES = [
  "zzz... give me a sec",
  "dreaming of beaches",
  "snoozing through the search",
  "five more minutes...",
  "counting destinations instead of sheep",
  "*soft snoring*",
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
  // Triply slides + fades in 400ms after mount so the quote settles first.
  const [triplyMounted, setTriplyMounted] = useState(false);
  // Sleep-quote rotation — deliberately off-tempo from the travel quotes.
  const [sleepQuoteIndex, setSleepQuoteIndex] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setSleepQuoteIndex((i) => (i + 1) % SLEEP_QUOTES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setTriplyMounted(true), 400);
    return () => clearTimeout(t);
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

        {/* Quote + Triply row. Quote stays centered; Triply sits absolutely
            in the right gutter so its presence doesn't shift the quote. */}
        <div className="relative flex items-center justify-center gap-6 mb-12">
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

          {/* Desktop variant (≥lg): md mascot in the right gutter, bubble
              alongside it pointing back toward the quote. Outer overlay's
              overflow-hidden clips any spill past the viewport edge so no
              horizontal scrollbar even on tighter desktop widths. */}
          <div
            className="hidden lg:block absolute right-0 top-1/2 pointer-events-none transition-all duration-[600ms] ease-out"
            style={{
              transform: triplyMounted
                ? "translate(100%, -50%)"
                : "translate(calc(100% + 20px), -50%)",
              opacity: triplyMounted ? 1 : 0,
            }}
            aria-hidden="true"
          >
            <div className="relative">
              <TriplyMascot state="sleepy" size="md" />
              <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: "calc(100% + 0.5rem)", width: "160px" }}
              >
                <TriplyBubble
                  text={SLEEP_QUOTES[sleepQuoteIndex]}
                  side="left"
                  className="text-xs md:text-sm px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Tablet variant (md only): sm mascot peeking in the right
              gutter at translate-x-[85%] so the mascot's center sits ~32px
              past the quote-column edge. Bubble sits ABOVE the mascot
              (side="bottom") rather than to its right — at 768–1023px the
              gutter is too narrow to fit both horizontally without heavy
              clipping. Vertical stacking keeps the bubble fully readable. */}
          <div
            className="hidden md:block lg:hidden absolute right-0 top-1/2 pointer-events-none transition-all duration-[600ms] ease-out"
            style={{
              transform: triplyMounted
                ? "translate(85%, -50%)"
                : "translate(calc(85% + 12px), -50%)",
              opacity: triplyMounted ? 1 : 0,
            }}
            aria-hidden="true"
          >
            <div className="relative flex flex-col items-center gap-1">
              <TriplyBubble
                text={SLEEP_QUOTES[sleepQuoteIndex]}
                side="bottom"
                className="text-xs px-3 py-1.5 max-w-[140px]"
              />
              <TriplyMascot state="sleepy" size="sm" />
            </div>
          </div>
        </div>

        {/* Mobile variant (<md): inline flex column between quote-row and
            progress dots. Bubble above mascot pointing down (side="bottom"),
            mascot below — fits cleanly in the centered column flow without
            absolute positioning or right-gutter math. */}
        <div
          className="flex md:hidden flex-col items-center gap-2 mb-8 transition-all duration-[600ms] ease-out"
          style={{
            opacity: triplyMounted ? 1 : 0,
            transform: triplyMounted ? "translateY(0)" : "translateY(15px)",
          }}
          aria-hidden="true"
        >
          <TriplyBubble
            text={SLEEP_QUOTES[sleepQuoteIndex]}
            side="bottom"
            className="text-sm px-4 py-2 max-w-[200px]"
          />
          <TriplyMascot state="sleepy" size="sm" />
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

        <LoadingFooter className="text-white/20 text-xs mt-10 tracking-[0.2em] uppercase" />

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
