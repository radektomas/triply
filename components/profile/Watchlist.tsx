"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HeartIcon } from "@/components/auth/AuthIcons";
import { setDealAlerts, unsaveDestination } from "@/app/actions/saved";
import { getGradient } from "@/lib/utils/gradient";
import type { APIDestination } from "@/lib/types";

export interface WatchRow {
  id: string;
  destination: APIDestination;
  photoUrl: string | null;
  /** Deep link to the destination's trip page, when the trip still exists. */
  href: string | null;
  dealAlerts: boolean;
  createdAt: string;
}

function BellIcon({ size = 14, off = false }: { size?: number; off?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

// The watchlist IS the saved list: every hearted place, as photo cards one
// size down from the picks, each with its own alerts switch. `rows` arrives
// fresh from the server after every action (revalidatePath), so the cards
// derive from props and only optimistic overrides live in local state.
export function Watchlist({ rows, email }: { rows: WatchRow[]; email: string | null }) {
  const reduceMotion = useReducedMotion();
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [alertOverrides, setAlertOverrides] = useState<Map<string, boolean>>(() => new Map());
  const [, start] = useTransition();

  const items = useMemo(
    () =>
      rows
        .filter((w) => !removed.has(w.id))
        .map((w) => ({ ...w, dealAlerts: alertOverrides.get(w.id) ?? w.dealAlerts })),
    [rows, removed, alertOverrides],
  );
  const alertsOn = items.filter((w) => w.dealAlerts).length;

  function remove(id: string) {
    setRemoved((prev) => new Set(prev).add(id));
    start(async () => {
      const r = await unsaveDestination(id);
      if (!r.ok) {
        setRemoved((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      }
    });
  }

  function toggleAlerts(id: string, next: boolean) {
    setAlertOverrides((prev) => new Map(prev).set(id, next));
    start(async () => {
      const r = await setDealAlerts(id, next);
      if (!r.ok) {
        setAlertOverrides((prev) => {
          const n = new Map(prev);
          n.delete(id);
          return n;
        });
      }
    });
  }

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase text-teal tracking-[0.18em] mb-1">
            Watchlist
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Places you&apos;re watching
          </h2>
          <p className="text-sm text-muted mt-1 max-w-xl">
            Every place you save lands here. When a good price shows up for one of them in a
            window you&apos;re free, you get an email{email ? ` at ${email}` : ""}.
          </p>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-semibold text-muted tabular-nums">
            {items.length} {items.length === 1 ? "place" : "places"} · {alertsOn} with alerts on
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-white/60 px-6 py-10 text-center">
          <p className="font-display text-lg font-bold text-[#1A1A1A]/70">Nothing on your watchlist yet.</p>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">
            Tap the heart on any place, here or in a trip, and it joins the watchlist with price
            alerts on.
          </p>
        </div>
      ) : (
        <motion.ul layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence initial={false}>
            {items.map((w) => {
              const d = w.destination;
              return (
                <motion.li
                  key={w.id}
                  layout
                  initial={false}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9, transition: { duration: 0.16 } }}
                  className="group relative rounded-2xl overflow-hidden bg-white border border-border shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-[4/3]">
                    <div className="absolute inset-0" style={{ background: getGradient(d.id) }}>
                      {w.photoUrl && (
                        <Image
                          src={w.photoUrl}
                          alt={`${d.name}, ${d.country}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
                        }}
                      />
                    </div>
                    {w.href && (
                      <Link href={w.href} prefetch aria-label={`View ${d.name}`} className="absolute inset-0" />
                    )}
                    <button
                      type="button"
                      onClick={() => remove(w.id)}
                      aria-label={`Remove ${d.name} from your watchlist`}
                      title="Remove from watchlist"
                      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/85 backdrop-blur-sm ring-1 ring-black/5 text-rose-500 hover:text-rose-600 hover:scale-110 transition cursor-pointer"
                    >
                      <HeartIcon filled size={15} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                      <p className="text-white/75 text-[10px] font-semibold uppercase tracking-widest">
                        {d.country}
                      </p>
                      <p className="text-white font-display font-bold text-base leading-tight truncate">
                        {d.name}
                      </p>
                    </div>
                  </div>

                  <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAlerts(w.id, !w.dealAlerts)}
                      role="switch"
                      aria-checked={w.dealAlerts}
                      aria-label={`Price alerts for ${d.name}`}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                        w.dealAlerts
                          ? "bg-teal/10 text-teal hover:bg-teal/20"
                          : "bg-[#F5F5F5] text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                      }`}
                    >
                      <BellIcon off={!w.dealAlerts} />
                      {w.dealAlerts ? "Alerts on" : "Muted"}
                    </button>
                    {w.href && (
                      <Link
                        href={w.href}
                        prefetch
                        className="text-[11px] font-semibold text-[#1A1A1A]/60 hover:text-accent transition-colors"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}
    </section>
  );
}
