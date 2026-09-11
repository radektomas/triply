"use client";

interface Props {
  busy: boolean;
  /** Daily generations left, from checkGenerationLimit. */
  remaining: number;
  onClick: () => void;
  label?: string;
  variant?: "primary" | "quiet";
}

// The "3 more" button. The request itself lives in PickedForYou so the
// section can animate the cards in place while the planner works.
export function GeneratePicks({ busy, remaining, onClick, label = "Find me 3 more", variant = "primary" }: Props) {
  const exhausted = remaining <= 0;
  const cls =
    variant === "primary"
      ? "inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent-deep text-white text-sm font-semibold px-5 py-2.5 shadow-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      : "inline-flex items-center gap-2 rounded-full bg-white border border-border text-[#1A1A1A] text-sm font-semibold px-4 py-2 hover:bg-accent-light hover:text-accent transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={exhausted || busy}
      aria-busy={busy}
      title={exhausted ? "You've used today's generations — resets at midnight UTC." : undefined}
      className={cls}
    >
      {busy ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin"
        />
      ) : (
        <span aria-hidden>✦</span>
      )}
      {exhausted ? "Back tomorrow for more" : busy ? "Finding places…" : label}
    </button>
  );
}
