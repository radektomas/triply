"use client";

import { useEffect, useRef, useState } from "react";

const WEBHOOK_URL = "/api/feedback";
const SUCCESS_AUTOCLOSE_MS = 2500;

interface Props {
  open: boolean;
  onClose: () => void;
}

type Status = "idle" | "submitting" | "success" | "error";

export function FeedbackModal({ open, onClose }: Props) {
  const [liked, setLiked] = useState("");
  const [missing, setMissing] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const firstFieldRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    firstFieldRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => {
      onClose();
      // reset for next open
      setLiked("");
      setMissing("");
      setEmail("");
      setStatus("idle");
    }, SUCCESS_AUTOCLOSE_MS);
    return () => clearTimeout(t);
  }, [status, onClose]);

  if (!open) return null;

  const canSubmit =
    (liked.trim().length > 0 || missing.trim().length > 0) && status !== "submitting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liked: liked.trim(),
          missing: missing.trim(),
          email: email.trim(),
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center px-4 transition-opacity duration-150"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm mt-[20vh] bg-card rounded-2xl shadow-xl p-6 transition-opacity duration-150"
      >
        <button
          type="button"
          aria-label="Close feedback"
          onClick={onClose}
          className="absolute top-3 right-3 text-muted hover:text-[#1A1A1A] transition-colors p-1"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="flex flex-col items-center text-center py-4">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent-deep mb-3"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <p className="text-base font-semibold text-[#1A1A1A]">
              Thanks — this goes straight to Radek.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2
                id="feedback-modal-title"
                className="text-lg font-bold text-[#1A1A1A]"
              >
                Quick feedback
              </h2>
              <p className="text-sm text-muted mt-1">
                Takes 30 seconds. Helps us build better.
              </p>
            </div>

            <div>
              <label
                htmlFor="feedback-liked"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                What did you like?
              </label>
              <textarea
                ref={firstFieldRef}
                id="feedback-liked"
                name="liked"
                rows={3}
                value={liked}
                onChange={(e) => setLiked(e.target.value)}
                placeholder="The destination picks, the budget breakdown..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-deep/40 focus:border-accent-deep resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="feedback-missing"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                What was missing or didn&apos;t work?
              </label>
              <textarea
                id="feedback-missing"
                name="missing"
                rows={3}
                value={missing}
                onChange={(e) => setMissing(e.target.value)}
                placeholder="Destination repeated, wanted more beach options..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-deep/40 focus:border-accent-deep resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="feedback-email"
                className="block text-sm font-medium text-[#1A1A1A] mb-1"
              >
                Your email (optional)
              </label>
              <input
                id="feedback-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="If you'd like a reply"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-deep/40 focus:border-accent-deep"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-rose-600">
                Something went wrong. Try again?
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-accent-deep text-white font-semibold rounded-full py-3 text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
            >
              {status === "submitting" ? "Sending..." : "Send feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
