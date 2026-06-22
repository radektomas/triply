"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingOverlay } from "@/components/landing/LoadingOverlay";
import { TriplyMascot } from "@/components/triply/TriplyMascot";
import type { GenerationLimitStatus } from "@/lib/generationLimits";

// Replaces the old "Pick your own city" picker below the 3 result cards.
// Lets the user generate a fresh set of 3 destinations with the SAME search
// params, gated by the daily generation limit:
//   • logged-in  → server-counted limit (limitStatus from checkGenerationLimit)
//   • anonymous  → 1/day tracked in localStorage (backend doesn't count anon)
// Viewing trips and affiliate clicks remain free — only NEW generations count.

const ANON_DAILY_LIMIT = 1;
const ANON_KEY = "triply_anon_gen_date";
// Cosmetic dedupe only (not security): remembers that this browser already
// joined the Triply Plus waitlist so we don't re-show the button after a
// remount. /api/waitlist already ignores duplicate emails, so this is harmless.
const WAITLIST_KEY = "triply_waitlist_joined";

interface TripParams {
  budget: number;
  travelers: number;
  vibe: string;
  originCity: string;
  checkIn: string;
  checkOut: string;
}

interface Props {
  tripParams: TripParams;
  /** Server-computed limit for the logged-in user; `anonymous: true` when there
   *  is no session (then we fall back to the localStorage rule below). */
  limitStatus: GenerationLimitStatus;
  /** Names of the destinations already shown — passed to the API as a
   *  forward-compatible exclude seam (not yet honored server-side). */
  shownDestinations: string[];
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Read today's anon generation count from localStorage (SSR-safe). */
function readAnonCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(ANON_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date?: string; count?: number };
    if (parsed.date !== utcToday()) return 0; // stale day → reset
    return typeof parsed.count === "number" ? parsed.count : 0;
  } catch {
    return 0;
  }
}

function writeAnonCount(count: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ANON_KEY,
      JSON.stringify({ date: utcToday(), count }),
    );
  } catch {
    // ignore (private mode / storage disabled)
  }
}

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
      <path d="M19 14l.9 2.6L22.5 17.5l-2.6.9L19 21l-.9-2.6L15.5 17.5l2.6-.9L19 14z" opacity="0.7" />
    </svg>
  );
}

function ArrowRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function GenerateMore({
  tripParams,
  limitStatus,
  shownDestinations,
}: Props) {
  const router = useRouter();
  const { openAuthModal, user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Anon state is only knowable on the client → resolve after mount to avoid a
  // hydration mismatch / button-then-upsell flash. Logged-in state comes from
  // the server (limitStatus) and is correct at first paint.
  const isAnon = limitStatus.anonymous;
  const [mounted, setMounted] = useState(false);
  const [anonCount, setAnonCount] = useState(0);
  useEffect(() => {
    setMounted(true);
    setAnonCount(readAnonCount());
  }, []);

  // The limit status is computed on the server and frozen into a prop at first
  // paint. A client-side sign-in (auth modal / Google OAuth) updates useAuth()'s
  // reactive `user` but NOT this prop, so the block would stay stuck on the
  // anonymous "sign in" state. When the server said "anonymous" yet the client
  // now has a user, the prop is stale → ask the server to re-render this route
  // (router.refresh re-runs the page server component, which reads the freshly
  // set auth cookies and returns the logged-in limitStatus). The ref guards
  // against firing the refresh more than once during the brief stale window.
  const awaitingLogin = limitStatus.anonymous && !!user;
  const refreshedRef = useRef(false);
  useEffect(() => {
    if (awaitingLogin && !refreshedRef.current) {
      refreshedRef.current = true;
      router.refresh();
    }
  }, [awaitingLogin, router]);

  const anonRemaining = Math.max(0, ANON_DAILY_LIMIT - anonCount);
  const canGenerate = isAnon ? anonRemaining > 0 : limitStatus.remaining > 0;

  async function generate() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: tripParams.budget,
          travelers: tripParams.travelers,
          vibe: tripParams.vibe,
          originCity: tripParams.originCity,
          checkIn: tripParams.checkIn,
          checkOut: tripParams.checkOut,
          destinationMode: "surprise",
          // Forward-compatible exclude seam — currently ignored by the API /
          // n8n workflow (TripInput has no exclude field), so repeats are
          // possible until the backend honors it.
          excludeDestinations: shownDestinations,
        }),
      });
      if (!res.ok) {
        const body = (await res
          .clone()
          .json()
          .catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Generation failed (${res.status})`);
      }
      const { tripId } = (await res.json()) as { tripId: string };
      // Count the anon generation locally (logged-in is counted server-side).
      if (isAnon) {
        const next = anonCount + 1;
        writeAnonCount(next);
        setAnonCount(next);
      }
      // Replace, don't append: each generation is its own trip URL, and the
      // cards are server-rendered. Navigate to the new set.
      setRedirectTo(`/trip/${tripId}`);
    } catch (err) {
      console.error("[GenerateMore] generation failed:", err);
      setError("Couldn't generate more right now. Please try again.");
      setSubmitting(false);
    }
  }

  function handleClick() {
    // Anon who's out of generations → push them to sign in instead.
    if (isAnon && anonRemaining === 0) {
      openAuthModal();
      return;
    }
    generate();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Brief neutral placeholder while anon state resolves (prevents flash), and
  // while a just-signed-in user waits for the server re-render to swap the
  // stale anonymous prop for their real logged-in limit status.
  if ((isAnon && !mounted) || awaitingLogin) {
    return (
      <section className="mt-12 mx-auto max-w-2xl">
        <div className="h-[120px] rounded-2xl bg-card border border-border shadow-sm animate-pulse" />
      </section>
    );
  }

  // Logged-in, limit reached → Triply Plus upsell.
  if (!isAnon && limitStatus.remaining === 0) {
    return (
      <section className="mt-12 mx-auto max-w-2xl">
        <TriplyPlusCard limit={limitStatus.limit} />
      </section>
    );
  }

  // Anon out of generations → sign-in prompt (reuses the existing auth modal).
  const anonExhausted = isAnon && anonRemaining === 0;

  return (
    <section className="mt-12 mx-auto max-w-2xl">
      {anonExhausted ? (
        // Anonymous, out of quota → sign-in prompt. UNCHANGED.
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">
            Want more destinations?
          </h2>
          <p className="text-sm text-muted mt-1 mb-5">
            You&apos;ve used your free search for today. Sign in to get 3
            searches a day, free.
          </p>
          <button
            type="button"
            onClick={openAuthModal}
            className="inline-flex items-center justify-center gap-2 bg-[#0D7377] text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-[#0A5D60] active:scale-95 transition-all cursor-pointer shadow-md"
          >
            <span>Sign in to generate more</span>
            <ArrowRightIcon />
          </button>
        </div>
      ) : (
        // In-quota "Generate 3 more" — mascot-forward, warm coral-tinted panel.
        // Mascot + copy + CTA read as one horizontal unit (stacks on mobile),
        // killing the old empty-white-box dead space. The mascot self-gates its
        // float via useInView + useReducedMotion, so no always-on loop is added.
        <div
          className="overflow-hidden rounded-2xl border border-accent/15 shadow-sm px-6 py-6 sm:px-8 sm:py-7"
          style={{
            background:
              "linear-gradient(135deg, #FFF0ED 0%, rgba(255,228,204,0.55) 100%)",
          }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-7">
            <div className="shrink-0 -mb-2 sm:mb-0">
              <TriplyMascot state="smug" size="md" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] leading-tight">
                Not feeling these three?
              </h2>
              <p className="text-sm text-muted mt-1 mb-4">
                Same budget &amp; vibe. A fresh set of ideas.
              </p>
              <button
                type="button"
                onClick={handleClick}
                disabled={!canGenerate}
                className="inline-flex items-center justify-center gap-2 bg-accent text-white text-sm font-semibold px-6 py-3 rounded-full hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparkleIcon />
                <span>Generate 3 more destinations</span>
              </button>
              {!isAnon && (
                <p className="text-xs text-muted mt-3">
                  {limitStatus.remaining} of {limitStatus.limit} free searches
                  left today
                </p>
              )}
              {error && <p className="text-xs text-rose-600 mt-3">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {submitting && (
        <LoadingOverlay
          loadingComplete={redirectTo !== null}
          onReady={() => {
            if (redirectTo) router.push(redirectTo);
          }}
        />
      )}
    </section>
  );
}

// ── Triply Plus upsell card (logged-in, limit reached) ───────────────────────

function TriplyPlusCard({ limit }: { limit: number }) {
  // This state only renders for LOGGED-IN users (you must be signed in to hit
  // the server-counted 3/day limit), so we already have their email from the
  // Supabase Auth session — no need to ask them to type it.
  const { user } = useAuth();
  const authEmail = user?.email ?? "";

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );

  // Persist the confirmed state across remounts. `state` is per-mount, so on its
  // own the card would re-show the button after the user navigates away (profile,
  // a trip from history) and back. Resolve the flag after mount to stay SSR-safe.
  const [joined, setJoined] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(WAITLIST_KEY)) setJoined(true);
    } catch {
      // ignore (private mode / storage disabled)
    }
  }, []);

  async function submit(value: string) {
    const target = value.trim();
    if (state === "saving" || !target) return;
    setState("saving");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target, source: "triply_plus" }),
      });
      if (!res.ok) throw new Error(`Waitlist failed (${res.status})`);
      try {
        window.localStorage.setItem(WAITLIST_KEY, "true");
      } catch {
        // ignore (private mode / storage disabled)
      }
      setJoined(true);
      setState("done");
    } catch (err) {
      console.error("[TriplyPlusCard] waitlist failed:", err);
      setState("error");
    }
  }

  // Confirmed either in-session (just clicked) or from a prior visit (flag).
  const confirmed = state === "done" || joined;

  return (
    <div className="rounded-2xl border border-accent/25 bg-accent-light p-6 sm:p-8 shadow-sm text-center">
      <h2 className="text-2xl font-bold text-[#1A1A1A]">
        That&apos;s today&apos;s free batch
      </h2>
      <p className="text-sm text-muted mt-2 mb-2 max-w-md mx-auto">
        Loving the browsing? Same here. Unlimited destinations are coming soon.
        Be the first to know.
      </p>
      <p className="text-xs text-muted mb-6">
        You&apos;ve used all {limit} free searches today.
      </p>

      {confirmed ? (
        <p className="text-sm font-semibold text-[#0D7377]">
          You&apos;re on the list. We&apos;ll let you know.
        </p>
      ) : authEmail ? (
        // Common path: one tap, email pulled from the auth session.
        <button
          type="button"
          onClick={() => submit(authEmail)}
          disabled={state === "saving"}
          className="inline-flex items-center justify-center gap-2 bg-accent text-white text-sm font-semibold px-6 py-3 rounded-full hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
        >
          <SparkleIcon />
          {state === "saving" ? "Adding you…" : "Notify me when it's live"}
        </button>
      ) : (
        // Rare fallback: signed in but no email on the profile → ask for one.
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(email);
          }}
          className="flex flex-col sm:flex-row items-stretch gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={state === "saving"}
            className="flex-1 rounded-full border border-border bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={state === "saving"}
            className="inline-flex items-center justify-center gap-2 bg-accent text-white text-sm font-semibold px-6 py-3 rounded-full hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {state === "saving" ? "Saving…" : "Notify me"}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="text-xs text-rose-600 mt-3">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
