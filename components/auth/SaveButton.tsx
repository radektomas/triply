"use client";

import { useEffect, useState, useTransition } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { saveDestination } from "@/app/actions/saved";
import { useAuth } from "@/contexts/AuthContext";
import { HeartIcon } from "./AuthIcons";
import type { APIDestination, SavedTripContext } from "@/lib/types";

interface Props {
  destination: APIDestination;
  context?: SavedTripContext;
  /**
   * Visual treatment:
   * - `card` (default): absolute corner heart used on result cards.
   * - `chip`: inline glass pill used on the trip detail hero, alongside
   *   the Share button.
   */
  variant?: "card" | "chip";
}

export function SaveButton({ destination, context, variant = "card" }: Props) {
  const { user, openAuthModal } = useAuth();
  const [saved, setSaved] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user) {
        setSaved(false);
        setRowId(null);
        return;
      }
      const supabase = getBrowserSupabase();
      const { data } = await supabase
        .from("saved_destinations")
        .select("id, destination")
        .eq("user_id", user.id);
      if (cancelled || !data) return;
      const rows = data as Array<{ id: string; destination: Partial<APIDestination> | null }>;
      const match = rows.find((row) => row.destination?.id === destination.id);
      if (match) {
        setSaved(true);
        setRowId(match.id);
      } else {
        setSaved(false);
        setRowId(null);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [user, destination.id]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      if (saved && rowId) {
        const { error } = await supabase
          .from("saved_destinations")
          .delete()
          .eq("id", rowId);
        if (!error) {
          setSaved(false);
          setRowId(null);
        }
      } else {
        // Insert goes through a Server Action so the confirmation email is
        // sent in-process, replacing the saved_destinations database webhook.
        // The action still writes with the cookie-bound client, so the same
        // RLS policy applies as when this ran in the browser.
        const result = await saveDestination({ destination, context });
        if (result.ok) {
          setSaved(true);
          setRowId(result.rowId);
        }
      }
    });
  }

  if (variant === "chip") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? "Unsave destination" : "Save destination"}
        className={`inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-white text-sm font-medium hover:bg-white/25 active:scale-95 transition-all duration-200 cursor-pointer ${
          busy ? "opacity-60" : ""
        }`}
      >
        <span
          className={`inline-flex items-center justify-center transition-colors ${
            saved ? "text-rose-300" : "text-white"
          }`}
        >
          <HeartIcon filled={saved} size={18} color="currentColor" />
        </span>
        <span>{saved ? "Saved" : "Save"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Unsave destination" : "Save destination"}
      className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center bg-white/85 backdrop-blur-sm ring-1 ring-black/5 transition-all duration-150 cursor-pointer ${
        saved ? "text-rose-500" : "text-slate-500 hover:text-rose-500"
      } ${busy ? "opacity-60" : "hover:scale-110"}`}
    >
      <HeartIcon filled={saved} size={18} />
    </button>
  );
}
