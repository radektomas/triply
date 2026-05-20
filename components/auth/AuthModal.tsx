"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { CloseIcon, GoogleIcon } from "./AuthIcons";

type Mode = "signin" | "signup";

// Outer mount: keeps the URL-based auto-open behaviour and only mounts the
// modal body when actually open, so each open is a fresh instance with clean
// transient state (no need for effect-driven resets).
export function AuthModal() {
  const { modalOpen, openAuthModal, user } = useAuth();
  useEffect(() => {
    if (user) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("signin") === "1") openAuthModal();
  }, [user, openAuthModal]);

  if (!modalOpen) return null;
  return <AuthModalBody />;
}

function AuthModalBody() {
  const { closeAuthModal } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAuthModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAuthModal]);

  // Freeze background scroll while the modal is open so the hero doesn't
  // jump behind the scrim if the user wheels or swipes.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      },
    });
    if (err) {
      setError(err.message);
      setBusy(false);
    }
    // On success the browser is being redirected to Google — leave busy=true.
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = getBrowserSupabase();
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (err) {
          setError(err.message);
          return;
        }
        // If the project requires email confirmation, no session is returned
        // yet and the user must click the link in their inbox.
        if (!data.session) {
          setInfo("Check your inbox to confirm your email.");
          return;
        }
        await ensureProfileRow(displayName || email.split("@")[0]);
        closeAuthModal();
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          setError(err.message);
          return;
        }
        closeAuthModal();
      }
    } finally {
      setBusy(false);
    }
  }

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in-overlay overscroll-contain"
      onClick={closeAuthModal}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to Triply"
    >
      <div
        className="relative z-[101] w-full max-w-md bg-white rounded-3xl border border-border shadow-2xl p-7 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close"
          className="absolute top-4 right-4 text-muted hover:text-[#1a1a1a] transition-colors cursor-pointer"
        >
          <CloseIcon />
        </button>

        <div className="text-center mb-6">
          <p className="font-mono text-[11px] font-medium uppercase text-accent tracking-[0.18em] mb-1">
            Triply Account
          </p>
          <h2 className="text-2xl font-bold text-[#1a1a1a]">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted mt-1">
            Save trips, see your history, plan smarter.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-white hover:bg-[#F5F5F5] font-medium text-[#1a1a1a] text-sm transition-colors disabled:opacity-60 cursor-pointer"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5 text-xs text-muted/70 uppercase tracking-widest">
          <span className="flex-1 h-px bg-border" />
          <span>or</span>
          <span className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40"
              autoComplete="name"
            />
          )}
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          {info && (
            <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !email || !password}
            className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
          >
            {busy
              ? mode === "signup"
                ? "Creating account…"
                : "Signing in…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-5">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-accent font-semibold hover:underline cursor-pointer"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

async function ensureProfileRow(displayName: string) {
  const supabase = getBrowserSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .upsert(
      { id: user.id, display_name: displayName },
      { onConflict: "id", ignoreDuplicates: false },
    );
}
