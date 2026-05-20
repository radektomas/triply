"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { VibeTag } from "@/components/ui/VibeTag";
import { getGradient } from "@/lib/utils/gradient";
import { FormattedPrice } from "@/components/shared/FormattedPrice";
import { HeartIcon, TrashIcon } from "@/components/auth/AuthIcons";
import type { APIDestination } from "@/lib/types";

interface SavedRow {
  id: string;
  destination: APIDestination & {
    __context?: {
      tripId?: string;
      checkIn: string;
      checkOut: string;
      budget: number;
      vibe: string;
      originCity: string;
    };
  };
  photoUrl: string | null;
  created_at: string;
  /**
   * tripId resolved server-side. May come from the embedded `__context`
   * or, if that's absent (older saves), backfilled by matching against
   * the user's generation_history.
   */
  resolvedTripId: string | null;
}

export function SavedDestinationCard({
  row,
  onRemoved,
}: {
  row: SavedRow;
  onRemoved: (id: string) => void;
}) {
  const [busy, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);
  const { destination, photoUrl, resolvedTripId } = row;
  const gradient = getGradient(destination.id);

  // Prefer the deep-link to the destination's detail view. Fall back to the
  // results route (3-card selector) when only the parent trip is known.
  const detailHref = resolvedTripId
    ? `/trip/${resolvedTripId}?d=${destination.id}`
    : null;
  const tripHref = resolvedTripId ? `/trip/${resolvedTripId}` : null;
  const primaryHref = detailHref ?? tripHref;

  function remove() {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("saved_destinations")
        .delete()
        .eq("id", row.id);
      if (!error) {
        setHidden(true);
        onRemoved(row.id);
      }
    });
  }

  if (hidden) return null;

  return (
    <div className="group bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-orange-200 h-full">
      <div className="h-40 relative shrink-0 overflow-hidden">
        {primaryHref ? (
          <Link
            href={primaryHref}
            prefetch
            aria-label={`View ${destination.name} trip`}
            className="absolute inset-0 z-0"
          >
            <span
              className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
              style={{
                background: photoUrl
                  ? `linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%), url('${photoUrl}') center/cover, ${gradient}`
                  : gradient,
              }}
            />
          </Link>
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={{
              background: photoUrl
                ? `linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%), url('${photoUrl}') center/cover, ${gradient}`
                : gradient,
            }}
          />
        )}

        <button
          type="button"
          onClick={remove}
          disabled={busy}
          aria-label="Remove from saved"
          title="Remove"
          className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white/85 backdrop-blur-sm ring-1 ring-black/5 text-rose-500 hover:text-rose-600 transition cursor-pointer disabled:opacity-50"
        >
          <HeartIcon filled size={18} />
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          aria-label="Remove from saved"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white/85 backdrop-blur-sm ring-1 ring-black/5 text-slate-600 hover:text-rose-600 transition cursor-pointer disabled:opacity-50"
        >
          <TrashIcon size={15} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 z-[1] p-4 pointer-events-none">
          <p className="text-white/75 text-xs font-semibold uppercase tracking-widest mb-0.5">
            {destination.country}
          </p>
          <h3 className="text-white text-xl font-bold leading-tight">
            {destination.name}
          </h3>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm text-muted mb-3 leading-relaxed line-clamp-2">
          {destination.tagline}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(destination.vibes ?? []).slice(0, 3).map((v) => (
            <VibeTag key={v} label={v} />
          ))}
        </div>
        <div className="mt-auto pt-3 border-t border-slate-200 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1">
              Estimated total
            </p>
            <p className="text-2xl font-bold text-slate-900 leading-none">
              <FormattedPrice eur={destination.estimates.totalEstimate.typical} />
            </p>
          </div>
          {primaryHref ? (
            <Link
              href={primaryHref}
              prefetch
              className="inline-flex items-center gap-1 shrink-0 px-3.5 py-2 rounded-full bg-[#0D7377] hover:bg-[#0A5D60] text-white text-xs font-semibold transition-colors shadow-sm"
            >
              View trip
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span
              className="text-xs text-muted/70 italic"
              title="Trip data isn't available anymore"
            >
              Trip unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
