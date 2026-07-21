"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { deleteAccount } from "@/app/profile/actions";

// Two-step account deletion. Step one is an ordinary button; step two demands
// the word DELETE be typed before the confirm button enables, so the
// irreversible action can't be reached by a single stray click or by a
// keyboard user tabbing into it.
//
// Animation: the panel changes the page's layout when it opens, so per
// AGENTS.md the size change rides Motion's `layout` prop (FLIP transforms)
// rather than an animated height. Only opacity is animated directly.

const CONFIRM_WORD = "DELETE";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD && !pending;

  function close() {
    setOpen(false);
    setConfirmText("");
    setError(null);
  }

  function submit() {
    if (!canDelete) return;
    setError(null);
    startTransition(async () => {
      // On success the action redirects and never returns a value.
      const result = await deleteAccount();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <motion.section
      layout={!reduceMotion}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mt-14 rounded-2xl border border-rose-200 bg-rose-50/40 p-5 sm:p-6"
    >
      <h2 className="text-base font-bold text-[#1a1a1a]">Delete your account</h2>
      <p className="mt-1.5 text-sm text-muted leading-relaxed max-w-prose">
        Permanently removes your profile, your saved destinations, your trip
        history and your activity records. This cannot be undone.
      </p>

      <AnimatePresence initial={false} mode="wait">
        {!open ? (
          <motion.div
            key="trigger"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 px-4 py-2.5 rounded-full border border-rose-300 bg-white text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Delete account
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="confirm"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-4"
          >
            <p className="text-sm font-semibold text-[#1a1a1a]">
              This is permanent. Type {CONFIRM_WORD} to confirm.
            </p>
            <ul className="mt-2 mb-3 text-xs text-muted list-disc pl-5 space-y-1">
              <li>Your profile and sign-in are removed.</li>
              <li>Saved destinations and trip history are deleted.</li>
              <li>Your analytics events are deleted.</li>
              <li>
                Anonymous cached trip results stay — they contain no information
                about you and are shared across everyone using Triply.
              </li>
            </ul>

            <label htmlFor="delete-confirm" className="sr-only">
              Type {CONFIRM_WORD} to confirm account deletion
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              disabled={pending}
              className="w-full max-w-[220px] px-3 py-2 rounded-lg border border-rose-300 bg-white text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-400/40 disabled:opacity-60"
            />

            {error && (
              <p
                role="alert"
                className="mt-3 text-xs text-rose-700 bg-rose-100 px-3 py-2 rounded-lg max-w-prose"
              >
                {error}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={!canDelete}
                className="px-4 py-2.5 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {pending ? "Deleting…" : "Permanently delete my account"}
              </button>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="text-sm font-medium text-muted hover:text-[#1a1a1a] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
