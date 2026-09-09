"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GradientMesh } from "@/components/landing/GradientMesh";
import { LoadingOverlay } from "@/components/landing/LoadingOverlay";
import { ErrorOverlay } from "@/components/landing/ErrorOverlay";
import { TriplyMascot } from "@/components/triply/TriplyMascot";
import type { GlobeCountry } from "./CountryGlobe";
import { useAuth } from "@/contexts/AuthContext";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { resizeImage } from "@/lib/imageResize";
import { track } from "@/lib/analytics";
import type { Airport } from "@/lib/data/airports";
import {
  VISITED_PHOTOS_BUCKET,
  buildFirstPicksInput,
  type TravelerPrefs,
  type TravelerProfile,
  type TravelerVibe,
  type TravelWindow,
  type VisitedPlace,
} from "@/lib/traveler";
import {
  addTravelWindow,
  addVisitedPlace,
  completeOnboarding,
  removeTravelWindow,
  removeVisitedPlace,
  saveTravelerPrefs,
  setVisitedPlacePhoto,
} from "@/app/onboarding/actions";
import { StepVibes } from "./StepVibes";
import { StepPlaces } from "./StepPlaces";
import { StepBudget } from "./StepBudget";
import { StepWindows } from "./StepWindows";
import { StepDone } from "./StepDone";

const STEPS = ["Vibe", "Been there", "Budget", "Windows"] as const;
const DONE_STEP = STEPS.length; // index 4

const EASE = [0.22, 1, 0.36, 1] as const;

// What Triply says beside each step (desktop sidekick).
const BUBBLES: Record<number, string> = {
  0: "Let's make Triply yours.",
  1: "Ooh, show me where you've been!",
  2: "No judgement. Cheap trips are my thing.",
  3: "I'll keep an eye out for deals on these.",
  4: "I've got a few places in mind already…",
};

// Enter-to-continue must never steal Enter from a control that owns it
// (autocomplete pick, button, calendar day). Same guard the planner uses.
function isInteractiveEnterTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || tag === "A") {
    return true;
  }
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  return !!el.closest('[role="combobox"],[role="listbox"],[aria-expanded="true"],[role="grid"]');
}

interface Props {
  firstName: string;
  initial: TravelerProfile;
}

export function OnboardingFlow({ firstName, initial }: Props) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const editing = initial.completedAt !== null;

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const [prefs, setPrefs] = useState<TravelerPrefs>(() => ({
    ...initial.prefs,
    // Prague is the planner's default too — the audience is mostly CZ.
    homeAirport: initial.prefs.homeAirport ?? "PRG",
    homeCity: initial.prefs.homeCity ?? "Prague",
  }));
  const [places, setPlaces] = useState<VisitedPlace[]>(initial.places);
  const [windows, setWindows] = useState<TravelWindow[]>(initial.windows);
  const [uploading, setUploading] = useState<Set<string>>(() => new Set());
  const [addingWindow, setAddingWindow] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [, startSave] = useTransition();

  // First-picks generation.
  const [generating, setGenerating] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [genError, setGenError] = useState<{ heading: string; sub: string } | null>(null);
  const generatingRef = useRef(false);

  // ── toast ────────────────────────────────────────────────────────────────
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // ── autosave ─────────────────────────────────────────────────────────────
  const persistPrefs = useCallback(
    (patch: Partial<TravelerPrefs>) => {
      startSave(async () => {
        const r = await saveTravelerPrefs(patch);
        if (!r.ok) notify(r.error);
      });
    },
    [notify],
  );

  function savePrefsForStep(s: number) {
    if (s === 0) persistPrefs({ vibes: prefs.vibes });
    if (s === 2) {
      persistPrefs({
        budgetEur: prefs.budgetEur,
        homeAirport: prefs.homeAirport,
        travelParty: prefs.travelParty,
      });
    }
  }

  // ── navigation ───────────────────────────────────────────────────────────
  const canContinue = useMemo(() => {
    if (step === 0) return prefs.vibes.length > 0;
    if (step === 2) return !!prefs.homeAirport;
    return true;
  }, [step, prefs.vibes.length, prefs.homeAirport]);

  const optional = step === 1 || step === 3;

  function goTo(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function next() {
    if (!canContinue || step >= DONE_STEP) return;
    savePrefsForStep(step);
    goTo(step + 1);
  }

  function back() {
    if (step === 0) return;
    goTo(step - 1);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (generating || genError) return;
      if (isInteractiveEnterTarget(document.activeElement)) return;
      if (step < DONE_STEP && canContinue) {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canContinue, generating, genError]);

  // ── places ───────────────────────────────────────────────────────────────
  function addPlace(c: GlobeCountry) {
    if (places.some((p) => p.countryCode === c.alpha2)) {
      notify(`${c.name} is already in your passport.`);
      return;
    }
    const tmpId = `tmp-${Date.now()}`;
    const optimistic: VisitedPlace = {
      id: tmpId,
      kind: "country",
      name: c.name,
      country: c.name,
      countryCode: c.alpha2,
      lat: c.lat,
      lng: c.lng,
      photoPath: null,
      photoUrl: null,
      stockPhotoUrl: null,
    };
    setPlaces((prev) => [...prev, optimistic]);
    void (async () => {
      const r = await addVisitedPlace({
        kind: "country",
        name: c.name,
        country: c.name,
        countryCode: c.alpha2,
        lat: c.lat,
        lng: c.lng,
      });
      if (!r.ok) {
        setPlaces((prev) => prev.filter((p) => p.id !== tmpId));
        notify(r.error);
        return;
      }
      setPlaces((prev) => prev.map((p) => (p.id === tmpId ? r.data : p)));
    })();
  }

  function removePlace(id: string) {
    const snapshot = places;
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    void (async () => {
      const r = await removeVisitedPlace(id);
      if (!r.ok) {
        setPlaces(snapshot);
        notify(r.error);
      }
    })();
  }

  async function uploadPhoto(id: string, file: File) {
    if (!user) {
      notify("You need to be signed in.");
      return;
    }
    setUploading((prev) => new Set(prev).add(id));
    try {
      let blob: Blob;
      let contentType: string;
      try {
        const r = await resizeImage(file);
        blob = r.blob;
        contentType = r.contentType;
      } catch {
        // Undecodable in-browser (HEIC on some desktops). Send the original
        // if it's under the bucket cap, otherwise tell the user.
        if (file.size > 5 * 1024 * 1024) throw new Error("too_large");
        blob = file;
        contentType = file.type || "image/jpeg";
      }
      const localUrl = URL.createObjectURL(blob);
      // `mock-` ids mean the DB migration isn't applied (see actions.ts):
      // preview the photo locally and skip the bucket, which doesn't exist yet.
      if (id.startsWith("mock-")) {
        setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, photoUrl: localUrl } : p)));
        return;
      }
      const supabase = getBrowserSupabase();
      const path = `${user.id}/${id}.jpg`;
      const { error } = await supabase.storage
        .from(VISITED_PHOTOS_BUCKET)
        .upload(path, blob, { upsert: true, contentType, cacheControl: "3600" });
      if (error) throw error;
      const r = await setVisitedPlacePhoto(id);
      if (!r.ok) throw new Error(r.error);
      setPlaces((prev) =>
        prev.map((p) => (p.id === id ? { ...p, photoPath: r.data.photoPath, photoUrl: localUrl } : p)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      notify(
        msg === "too_large"
          ? "That photo is over 5 MB — try a smaller one."
          : "Couldn't upload that photo. Please try again.",
      );
    } finally {
      setUploading((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  }

  // ── windows ──────────────────────────────────────────────────────────────
  function addWindow(startDate: string, endDate: string) {
    if (windows.some((w) => w.startDate === startDate && w.endDate === endDate)) {
      notify("You already have that window.");
      return;
    }
    const tmpId = `tmp-${Date.now()}`;
    setWindows((prev) => [...prev, { id: tmpId, startDate, endDate, label: null }]);
    setAddingWindow(true);
    void (async () => {
      const r = await addTravelWindow({ startDate, endDate });
      setAddingWindow(false);
      if (!r.ok) {
        setWindows((prev) => prev.filter((w) => w.id !== tmpId));
        notify(r.error);
        return;
      }
      setWindows((prev) => prev.map((w) => (w.id === tmpId ? r.data : w)));
    })();
  }

  function removeWindow(id: string) {
    const snapshot = windows;
    setWindows((prev) => prev.filter((w) => w.id !== id));
    void (async () => {
      const r = await removeTravelWindow(id);
      if (!r.ok) {
        setWindows(snapshot);
        notify(r.error);
      }
    })();
  }

  // ── finish ───────────────────────────────────────────────────────────────
  async function finish(mode: "picks" | "profile") {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGenError(null);

    const done = await completeOnboarding();
    if (!done.ok) {
      generatingRef.current = false;
      notify(done.error);
      return;
    }

    if (mode === "profile") {
      router.push("/profile");
      return;
    }

    setGenerating(true);
    const input = buildFirstPicksInput({ prefs, windows });
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        let body: { stage?: string; detail?: string; message?: string } = {};
        try {
          body = await res.json();
        } catch {
          // keep empty
        }
        setGenerating(false);
        generatingRef.current = false;
        if (res.status === 429 || body.stage === "rate_limit") {
          setGenError({
            heading: body.stage === "rate_limit" ? "Daily limit reached" : "You're going a bit fast",
            sub:
              body.detail ||
              body.message ||
              "Give it a moment and try again — your profile is saved.",
          });
        } else if (body.stage === "upstream_timeout" || res.status === 504) {
          setGenError({
            heading: "The trip planner timed out",
            sub: "It didn't respond in time. Your profile is saved — try again in a moment.",
          });
        } else {
          setGenError({
            heading: "Our trip planner didn't respond",
            sub: "Couldn't reach the planner right now. Your profile is saved — try again in a moment.",
          });
        }
        return;
      }
      const data = (await res.json()) as { tripId: string };
      track("trip_generated", {
        vibe: input.vibe,
        budget: input.budget,
        travelers: input.travelers,
        origin: input.originCity,
        source: "onboarding",
      });
      setPendingRedirect(`/trip/${data.tripId}`);
    } catch {
      setGenerating(false);
      generatingRef.current = false;
      setGenError({
        heading: "Something glitched",
        sub: "Your profile is saved. Try again, or head to your profile.",
      });
    }
  }

  function exitToProfile() {
    savePrefsForStep(step);
    router.push("/profile");
  }

  // ── render ───────────────────────────────────────────────────────────────
  const slide = {
    enter: (d: 1 | -1) => (reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 36 * d }),
    center: { opacity: 1, x: 0 },
    exit: (d: 1 | -1) => (reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -36 * d }),
  };

  return (
    <main className="relative min-h-[100dvh] overflow-x-clip bg-cream">
      <GradientMesh variant="absolute-tall" />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-24 pb-28 min-h-[100dvh] flex flex-col">
        {/* Progress */}
        <div
          role="group"
          aria-label={`Setup progress: step ${Math.min(step + 1, STEPS.length)} of ${STEPS.length}`}
          className="mb-10"
        >
          <div className="flex items-start gap-2.5">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => (done ? goTo(i) : undefined)}
                  disabled={!done}
                  aria-current={active ? "step" : undefined}
                  className="flex-1 group cursor-pointer disabled:cursor-default"
                >
                  <div className="h-1.5 rounded-full overflow-hidden bg-[#1a1a1a]/10">
                    <div
                      aria-hidden
                      className="h-full w-full rounded-full origin-left transition-transform duration-500 ease-out motion-reduce:transition-none"
                      style={{
                        backgroundColor: active ? "var(--color-accent)" : "rgba(255,107,71,0.5)",
                        transform: done || active ? "scaleX(1)" : "scaleX(0)",
                      }}
                    />
                  </div>
                  <span
                    aria-hidden
                    className="mt-2 hidden sm:block text-center text-[11px] font-semibold uppercase tracking-widest transition-colors"
                    style={{
                      color: active
                        ? "var(--color-accent)"
                        : done
                          ? "rgba(255,107,71,0.75)"
                          : "rgba(26,26,26,0.4)",
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
            >
              {step === 0 && (
                <StepVibes
                  firstName={firstName}
                  value={prefs.vibes}
                  onChange={(vibes: TravelerVibe[]) => setPrefs((p) => ({ ...p, vibes }))}
                />
              )}
              {step === 1 && (
                <StepPlaces
                  places={places}
                  uploading={uploading}
                  onAdd={addPlace}
                  onRemove={removePlace}
                  onPhoto={uploadPhoto}
                />
              )}
              {step === 2 && (
                <StepBudget
                  budgetEur={prefs.budgetEur}
                  homeAirport={prefs.homeAirport}
                  travelParty={prefs.travelParty}
                  onBudget={(budgetEur) => setPrefs((p) => ({ ...p, budgetEur }))}
                  onAirport={(a: Airport) =>
                    setPrefs((p) => ({ ...p, homeAirport: a.iata, homeCity: a.city }))
                  }
                  onParty={(travelParty) => setPrefs((p) => ({ ...p, travelParty }))}
                />
              )}
              {step === 3 && (
                <StepWindows
                  windows={windows}
                  adding={addingWindow}
                  onAdd={addWindow}
                  onRemove={removeWindow}
                />
              )}
              {step === DONE_STEP && (
                <StepDone profile={{ prefs, places, windows }} firstName={firstName} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Desktop sidekick — outside the animated column so it never
              re-mounts between steps; only the bubble copy changes. */}
          <div
            className="hidden xl:block absolute pointer-events-none"
            style={{ top: 40, right: -250 }}
            aria-hidden="true"
          >
            <TriplyMascot
              state="happy"
              size="md"
              calm
              bubbleText={BUBBLES[step]}
              bubblePosition="above"
              paused={generating}
            />
          </div>
        </div>

        {/* Footer controls */}
        <div className="mt-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm ring-1 ring-black/5 px-4 py-2.5 text-sm font-semibold text-[#1a1a1a]/70 hover:text-[#1a1a1a] hover:bg-white transition-colors cursor-pointer"
              >
                <span aria-hidden>←</span> Back
              </button>
            )}
            {editing && step < DONE_STEP && (
              <button
                type="button"
                onClick={exitToProfile}
                className="hidden sm:inline-flex rounded-full px-3 py-2.5 text-sm font-semibold text-[#1a1a1a]/55 hover:text-[#1a1a1a] transition-colors cursor-pointer"
              >
                Save & back to profile
              </button>
            )}
          </div>

          {step < DONE_STEP ? (
            <div className="flex items-center gap-2">
              {optional && (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-full px-3 py-2.5 text-sm font-semibold text-[#1a1a1a]/55 hover:text-[#1a1a1a] transition-colors cursor-pointer"
                >
                  Skip
                </button>
              )}
              <motion.button
                type="button"
                onClick={next}
                disabled={!canContinue}
                whileTap={reduceMotion || !canContinue ? undefined : { scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent-deep text-white font-semibold text-base px-6 py-3 shadow-[0_10px_30px_-10px_rgba(255,107,71,0.6)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Continue <span aria-hidden>→</span>
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <button
                type="button"
                onClick={() => finish("profile")}
                className="rounded-full px-3 py-2.5 text-sm font-semibold text-[#1a1a1a]/55 hover:text-[#1a1a1a] transition-colors cursor-pointer"
              >
                Go to my profile
              </button>
              <motion.button
                type="button"
                onClick={() => finish("picks")}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent-deep text-white font-semibold text-base px-6 py-3 shadow-[0_10px_30px_-10px_rgba(255,107,71,0.6)] transition-colors cursor-pointer"
              >
                Show me my picks <span aria-hidden>✈</span>
              </motion.button>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-[#1a1a1a]/40 font-medium hidden sm:block">
          Press Enter to continue
        </p>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            role="status"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-[#1a1a1a] text-white text-sm font-medium px-4 py-2.5 shadow-lg max-w-[90vw]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {generating && (
        <LoadingOverlay
          loadingComplete={pendingRedirect !== null}
          onReady={() => {
            if (pendingRedirect) router.push(pendingRedirect);
          }}
        />
      )}

      {genError && (
        <ErrorOverlay
          heading={genError.heading}
          sub={genError.sub}
          onRetry={() => {
            setGenError(null);
            void finish("picks");
          }}
          onDismiss={() => setGenError(null)}
        />
      )}
    </main>
  );
}
