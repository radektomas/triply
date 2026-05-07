"use client";

import { useEffect, useRef, useState } from "react";
import { GUESS_CITIES, type GuessCity } from "@/lib/game/cities";
import {
  CORRECT_QUOTES,
  MID_QUOTES,
  PERFECT_QUOTES,
  WRONG_QUOTES,
  ZERO_QUOTES,
  getRandomQuote,
} from "@/lib/quotes";
import { LoadingFooter } from "@/components/shared/LoadingFooter";

interface Props {
  /** Parent flips this true once the n8n response arrives. */
  loadingComplete: boolean;
  /** Parent's redirect handler — fires after the summary reveal. */
  onGameEnd: () => void;
}

interface PhotoState {
  status: "loading" | "ready" | "error";
  url: string | null;
  photographer: string | null;
  photographerUrl: string | null;
}

const REVEAL_DELAY_MS = 2500;       // how long the reveal/fact stays before next round
const SUMMARY_DELAY_MS = 1500;      // how long the final summary card sits before redirect
const MAX_PHOTO_RETRIES = 3;        // skip-to-next-city attempts before giving up on photo

// ISO-3166-1 alpha-2 → regional indicator symbols (flag emoji).
function flagEmoji(countryCode: string): string {
  const cps = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...cps);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Pick a target city + 3 distractors. Distractors prefer same difficulty;
// if that pool is too small we top up from any other city.
function buildRound(prevId: string | null): { target: GuessCity; choices: GuessCity[] } {
  const eligible = prevId
    ? GUESS_CITIES.filter((c) => c.id !== prevId)
    : GUESS_CITIES;
  const target = eligible[Math.floor(Math.random() * eligible.length)];

  const sameTier = GUESS_CITIES.filter(
    (c) => c.id !== target.id && c.difficulty === target.difficulty,
  );
  const distractorPool = sameTier.length >= 3
    ? sameTier
    : GUESS_CITIES.filter((c) => c.id !== target.id);

  const distractors = shuffle(distractorPool).slice(0, 3);
  const choices = shuffle([target, ...distractors]);
  return { target, choices };
}

export function GuessTheCity({ loadingComplete, onGameEnd }: Props) {
  // Round state
  const [target, setTarget] = useState<GuessCity | null>(null);
  const [choices, setChoices] = useState<GuessCity[]>([]);
  const [photo, setPhoto] = useState<PhotoState>({
    status: "loading",
    url: null,
    photographer: null,
    photographerUrl: null,
  });
  const [selected, setSelected] = useState<GuessCity | null>(null);
  const [revealing, setRevealing] = useState(false);
  // Picked once per guess so re-renders don't reroll the line under the user.
  const [revealQuote, setRevealQuote] = useState<string | null>(null);

  // Game-wide stats
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);

  // Refs that shouldn't drive re-renders
  const lastCityIdRef = useRef<string | null>(null);
  const photoRetriesRef = useRef(0);
  const onGameEndRef = useRef(onGameEnd);
  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  });
  const summaryFiredRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Summary state — final overlay shown when loadingComplete fires.
  // `line` is picked once when the summary is built so it stays stable across
  // the brief reveal-before-redirect window.
  const [summary, setSummary] = useState<{
    score: number;
    total: number;
    line: string;
  } | null>(null);

  // Build the first round on mount.
  useEffect(() => {
    startRound();
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startRound() {
    const { target: nextTarget, choices: nextChoices } = buildRound(
      lastCityIdRef.current,
    );
    lastCityIdRef.current = nextTarget.id;
    photoRetriesRef.current = 0;
    setTarget(nextTarget);
    setChoices(nextChoices);
    setSelected(null);
    setRevealing(false);
    setRevealQuote(null);
    setPhoto({
      status: "loading",
      url: null,
      photographer: null,
      photographerUrl: null,
    });
    void fetchPhoto(nextTarget);
  }

  async function fetchPhoto(city: GuessCity) {
    try {
      const res = await fetch(
        `/api/game/city-photo?q=${encodeURIComponent(city.pexelsQuery)}`,
        { cache: "force-cache" },
      );
      if (!res.ok) throw new Error(`photo ${res.status}`);
      const data = (await res.json()) as {
        url?: string;
        photographer?: string | null;
        photographerUrl?: string | null;
      };
      // Ignore stale responses — only apply if this city is still the target.
      if (lastCityIdRef.current !== city.id) return;
      if (!data.url) throw new Error("no url");
      setPhoto({
        status: "ready",
        url: data.url,
        photographer: data.photographer ?? null,
        photographerUrl: data.photographerUrl ?? null,
      });
    } catch (err) {
      console.warn("[GuessTheCity] photo fetch failed:", err);
      photoRetriesRef.current += 1;
      if (photoRetriesRef.current < MAX_PHOTO_RETRIES) {
        // Try a different city — quietly reroll the round.
        startRound();
      } else {
        setPhoto((prev) => ({ ...prev, status: "error" }));
      }
    }
  }

  function handleAnswer(choice: GuessCity) {
    if (revealing || selected || summary || !target) return;
    setSelected(choice);
    setRevealing(true);
    const correct = choice.id === target.id;
    setRevealQuote(getRandomQuote(correct ? CORRECT_QUOTES : WRONG_QUOTES));
    if (correct) setScore((s) => s + 1);
    setTotalAnswered((n) => n + 1);

    // Auto-advance to next round after the reveal pause.
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      // If loading already finished, the summary effect will have taken
      // over by now and we don't need to start another round.
      if (summaryFiredRef.current) return;
      setRoundIndex((i) => i + 1);
      startRound();
    }, REVEAL_DELAY_MS);
  }

  // When loading finishes, freeze gameplay (let any active reveal finish
  // visually if it can), then show summary + redirect once.
  useEffect(() => {
    if (!loadingComplete) return;
    if (summaryFiredRef.current) return;
    summaryFiredRef.current = true;

    // Cancel any pending auto-advance — we're ending the game instead.
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

    // Snapshot stats at the moment loading completed. State is stale-by-one
    // for the in-flight reveal but that's fine: the user already locked in
    // their answer, we just don't credit any future round.
    const finalScore = score;
    const finalTotal = totalAnswered;
    // Pick a flavor line that matches the run shape. `total === 0` means the
    // user never answered before loading finished, so we keep that branch
    // copy-only with no flavor (handled at render time).
    const bank =
      finalTotal === 0
        ? null
        : finalScore === finalTotal && finalTotal >= 3
          ? PERFECT_QUOTES
          : finalScore === 0
            ? ZERO_QUOTES
            : MID_QUOTES;
    setSummary({
      score: finalScore,
      total: finalTotal,
      line: bank ? getRandomQuote(bank) : "",
    });

    const t = setTimeout(() => onGameEndRef.current(), SUMMARY_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingComplete]);

  const correctChoiceId = target?.id ?? null;
  const userChoiceId = selected?.id ?? null;
  const isCorrect = revealing && correctChoiceId === userChoiceId;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto animate-fade-in-overlay text-white"
      style={{
        background:
          "linear-gradient(160deg, #0F0805 0%, #2C1406 35%, #451E09 65%, #0F0805 100%)",
      }}
    >
      {/* Ambient blobs — match the static loading screen so the swap-in feels continuous. */}
      <div
        className="absolute rounded-full opacity-20 animate-mesh-1 pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, #FF6B47 0%, transparent 70%)",
          top: -120,
          right: -120,
        }}
      />
      <div
        className="absolute rounded-full opacity-15 animate-mesh-2 pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background: "radial-gradient(circle, #FFB088 0%, transparent 70%)",
          bottom: -80,
          left: -80,
        }}
      />

      <div className="relative z-10 max-w-3xl w-full mx-auto px-4 sm:px-8 py-8 min-h-full flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-white text-lg sm:text-xl font-bold leading-none">
              Guess the city
            </h2>
            <p className="text-white/55 text-xs sm:text-sm mt-1">
              Round {roundIndex + 1} · while we plan your trip
            </p>
          </div>
          <div
            aria-live="polite"
            className="font-mono text-xl sm:text-2xl font-bold tabular-nums tracking-tight bg-white/10 border border-white/15 rounded-full px-4 py-1.5"
          >
            {score} / {totalAnswered}
          </div>
        </header>

        {/* Photo card */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-4 sm:mb-5">
          {photo.status === "ready" && photo.url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={
                  revealing && target
                    ? `Photo of ${target.name}`
                    : "Mystery city photo"
                }
                className="w-full h-full object-cover"
              />
              {photo.photographer && (
                <span className="absolute bottom-2 right-2 text-[10px] sm:text-xs text-white/70 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                  Photo by{" "}
                  {photo.photographerUrl ? (
                    <a
                      href={photo.photographerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-white"
                    >
                      {photo.photographer}
                    </a>
                  ) : (
                    photo.photographer
                  )}{" "}
                  on Pexels
                </span>
              )}
            </>
          ) : photo.status === "loading" ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
              <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mr-2" />
              Loading photo…
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm px-6 text-center">
              Photo unavailable — guess from the names below.
            </div>
          )}
        </div>

        {/* Choice buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          {choices.map((choice) => {
            const isCorrectChoice = choice.id === correctChoiceId;
            const isUserChoice = choice.id === userChoiceId;
            let stateClass =
              "bg-white/10 hover:bg-white/20 border-white/15 text-white";
            if (revealing) {
              if (isCorrectChoice) {
                stateClass =
                  "bg-emerald-500 border-emerald-400 text-white scale-[1.04] shadow-lg";
              } else if (isUserChoice) {
                stateClass =
                  "bg-rose-500 border-rose-400 text-white";
              } else {
                stateClass =
                  "bg-white/5 border-white/10 text-white/40";
              }
            }
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => handleAnswer(choice)}
                disabled={revealing || summary !== null}
                aria-label={`${choice.name}, ${choice.country}`}
                className={`min-h-14 rounded-2xl border px-3 py-3 flex flex-col items-center justify-center gap-0.5 text-sm font-semibold transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed ${stateClass}`}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {flagEmoji(choice.countryCode)}
                </span>
                <span className="text-xs sm:text-sm leading-tight text-center">
                  {choice.name}
                </span>
                <span className="text-[10px] sm:text-xs opacity-70 leading-tight">
                  {choice.country}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fact bubble — appears once a guess is made. */}
        {revealing && target && (
          <div
            role="status"
            aria-live="polite"
            className="bg-card text-[#1A1A1A] rounded-2xl border border-border shadow-md p-4 sm:p-5 animate-fade-in-overlay"
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5">
              <span className={isCorrect ? "text-emerald-700" : "text-rose-700"}>
                {isCorrect ? "Correct!" : `It was ${target.name}`}
              </span>
            </p>
            {revealQuote && (
              <p className="text-sm font-medium text-[#1A1A1A]/70 mb-2">
                {revealQuote}
              </p>
            )}
            <p className="text-sm sm:text-base leading-relaxed">{target.fact}</p>
            <p className="text-xs text-muted mt-3">→ Next round in 2s…</p>
          </div>
        )}

        <LoadingFooter className="text-white/30 text-xs text-center tracking-[0.2em] uppercase mt-auto pt-6" />
      </div>

      {/* Summary reveal — overlays the entire game once loading completes. */}
      {summary && (
        <div
          role="status"
          aria-live="assertive"
          className="absolute inset-0 z-[70] flex items-center justify-center px-6 animate-fade-in-overlay"
          style={{ backgroundColor: "rgba(15, 8, 5, 0.85)" }}
        >
          <div className="bg-card rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center text-[#1A1A1A]">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
              Trip ready
            </p>
            <h3 className="text-xl sm:text-2xl font-bold leading-tight mb-3">
              {summary.total === 0
                ? "Trip ready! Off you go."
                : `You got ${summary.score}/${summary.total} correct`}
            </h3>
            {summary.total > 0 && (
              <p className="font-mono text-3xl sm:text-4xl font-bold text-accent tabular-nums">
                {summary.score}
              </p>
            )}
            {summary.line && (
              <p className="text-sm font-medium text-[#1A1A1A]/70 mt-3">
                {summary.line}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
