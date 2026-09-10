"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { unwatchDestination } from "@/app/profile/watch-actions";
import { flagEmoji } from "@/lib/data/countryCodes";

export interface WatchRow {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  tripId: string | null;
  destinationId: string | null;
  createdAt: string;
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function Watchlist({ rows, email }: { rows: WatchRow[]; email: string | null }) {
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState(rows);
  const [, start] = useTransition();

  function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((w) => w.id !== id));
    start(async () => {
      const r = await unwatchDestination(id);
      if (!r.ok) setItems(snapshot);
    });
  }

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase text-teal tracking-[0.18em] mb-1">
            Price alerts
          </p>
          <h2 className="font-display text-2xl font-bold text-[#1A1A1A]">Watching</h2>
        </div>
        <span className="text-xs text-muted">
          {items.length} {items.length === 1 ? "place" : "places"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-white/60 px-6 py-8 text-center">
          <p className="font-display text-lg font-bold text-[#1A1A1A]/70">Nothing on watch yet.</p>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">
            Tap the bell on any pick above and Triply will email you the moment a good price
            shows up for it in one of your free windows.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-border shadow-sm overflow-hidden">
          <motion.ul layout className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {items.map((w) => {
                const href = w.tripId
                  ? `/trip/${w.tripId}${w.destinationId ? `?d=${w.destinationId}` : ""}`
                  : null;
                const flag = flagEmoji(w.countryCode);
                return (
                  <motion.li
                    key={w.id}
                    layout
                    initial={false}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -12, transition: { duration: 0.15 } }}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3"
                  >
                    <span className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center text-lg shrink-0">
                      {flag || "📍"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[#1A1A1A] truncate">
                        {href ? (
                          <Link href={href} className="hover:text-teal transition-colors">
                            {w.name}
                          </Link>
                        ) : (
                          w.name
                        )}
                        {w.country && <span className="text-muted font-medium"> · {w.country}</span>}
                      </p>
                      <p className="text-[11px] text-muted">
                        Email alerts on{email ? ` · ${email}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(w.id)}
                      aria-label={`Stop watching ${w.name}`}
                      className="w-8 h-8 rounded-full text-[#1A1A1A]/40 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <XIcon />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
          <p className="px-4 sm:px-5 py-3 bg-[#F8F7F5] text-[11px] text-muted border-t border-border">
            The live deal feed is on its way. Your list is already wired to it: when a fare or
            stay drops for one of these places during a window you&apos;re free, you get one email.
          </p>
        </div>
      )}
    </section>
  );
}
