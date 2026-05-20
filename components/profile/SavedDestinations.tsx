"use client";

import { useState } from "react";
import { SavedDestinationCard } from "./SavedDestinationCard";
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
  resolvedTripId: string | null;
}

export function SavedDestinations({ rows }: { rows: SavedRow[] }) {
  const [current, setCurrent] = useState(rows);

  if (current.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">Saved destinations</h2>
        <p className="text-sm text-muted mb-5">Places you want to come back to.</p>
        <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
          <p className="text-sm text-muted">
            Nothing saved yet — tap the heart on any destination to keep it here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Saved destinations</h2>
        <span className="text-xs text-muted">{current.length} saved</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {current.map((row) => (
          <SavedDestinationCard
            key={row.id}
            row={row}
            onRemoved={(id) =>
              setCurrent((rows) => rows.filter((r) => r.id !== id))
            }
          />
        ))}
      </div>
    </section>
  );
}
