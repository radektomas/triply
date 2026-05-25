"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GradientMesh } from "./GradientMesh";

// ─── Inline icons ────────────────────────────────────────────────────────────
// Follows the existing project convention (VibeIcons.tsx / AuthIcons.tsx):
// small function components, inline SVG, no lucide-react.

interface IconProps {
  size?: number;
}
interface TabIconProps extends IconProps {
  color: string;
}

function CloseIcon({ size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
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
  );
}

// Tab icons — recreated locally to match the destination toggles in TripForm.
function SurpriseIcon({ color, size = 18 }: TabIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <circle cx="9" cy="9" r="1.4" fill={color} />
      <circle cx="12" cy="12" r="1.4" fill={color} />
      <circle cx="15" cy="15" r="1.4" fill={color} />
    </svg>
  );
}

function PinIcon({ color, size = 18 }: TabIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5C8 2.5 5 5.4 5 9c0 4.5 7 12 7 12s7-7.5 7-12c0-3.6-3-6.5-7-6.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="9" r="2.3" fill={color} />
    </svg>
  );
}

function CrosshairIcon({ color, size = 18 }: TabIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.6" fill={color} />
      <line x1="12" y1="2.5" x2="12" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="21.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="2.5" y1="12" x2="6" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="12" x2="21.5" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Step icons — large hero glyphs for the roadmap stops. Rendered in white
// (currentColor) on top of the coral/teal circle backgrounds.

function PlaneIcon({ size = 38 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* simple paper-plane silhouette: nose top-right, fuselage to bottom-left,
          a tail flick, and a single wing fold */}
      <path d="M28 5 L4 14 L13 18 L17 27 Z" fill="currentColor" fillOpacity="0.12" />
      <path d="M28 5 L13 18 L17 27 L28 5 Z" fill="currentColor" fillOpacity="0.22" />
      <path d="M28 5 L4 14 L13 18 L28 5" />
      <path d="M13 18 L17 27 L28 5" />
    </svg>
  );
}

function AiComputerIcon({ size = 38 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* monitor */}
      <rect x="3" y="5" width="26" height="17" rx="3" />
      {/* stand */}
      <path d="M16 22 L16 27" />
      <path d="M11 27 L21 27" />
      {/* central sparkle — friendly 4-point star with rounded joins */}
      <path
        d="M16 9.5 C 16.6 12.3, 17.7 13.4, 20.5 14 C 17.7 14.6, 16.6 15.7, 16 18.5 C 15.4 15.7, 14.3 14.6, 11.5 14 C 14.3 13.4, 15.4 12.3, 16 9.5 Z"
        fill="currentColor"
      />
      {/* tiny accent sparkle */}
      <path
        d="M23 9 C 23.2 10, 23.5 10.3, 24.5 10.5 C 23.5 10.7, 23.2 11, 23 12 C 22.8 11, 22.5 10.7, 21.5 10.5 C 22.5 10.3, 22.8 10, 23 9 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PalmTreeIcon({ size = 38 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* curved trunk — single confident sweep */}
      <path d="M16 13 C 14.5 18, 13 23, 12 29" />
      {/* ground line — a tiny beach hint */}
      <path d="M7 29 L20 29" opacity="0.55" />
      {/* four rounded fronds arching out from the crown — each a soft teardrop */}
      <path
        d="M16 13 C 11 10, 6 11, 3 14 C 7 12, 12 12, 16 13 Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <path
        d="M16 13 C 13 8, 8 6, 4 7 C 9 7, 13 10, 16 13 Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <path
        d="M16 13 C 18 8, 23 5, 28 6 C 23 7, 19 10, 16 13 Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <path
        d="M16 13 C 20 11, 25 11, 29 14 C 25 12, 20 12, 16 13 Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      {/* coconut cluster at the crown */}
      <circle cx="16" cy="13.2" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Tiny paper plane for the eyebrow — ties the modal back to the travel /
// boarding-pass motif used in the hero.
function PaperPlaneIcon({ size = 12 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21.6 2.4a1 1 0 0 0-1.07-.22L2.83 9.1a1 1 0 0 0 .05 1.88l6.4 2.07 2.07 6.4a1 1 0 0 0 1.88.05l6.92-17.7a1 1 0 0 0-.55-1.4zM10.7 13.3l7.5-7.5-5.8 9.9-1.7-2.4z" />
    </svg>
  );
}

// Per-step tints. The icon itself is drawn in the brand color; the circle
// behind it is just a faint same-color halo (~10% alpha) so the glyph reads
// as the hero and the page stays airy. Coral bookends, teal in the middle.
const STEP_TINTS: ReadonlyArray<{ icon: string; halo: string }> = [
  { icon: "#FF6B4A", halo: "rgba(255, 107, 74, 0.10)" },
  { icon: "#0D7377", halo: "rgba(13, 115, 119, 0.10)" },
  { icon: "#FF6B4A", halo: "rgba(255, 107, 74, 0.10)" },
];

// ─── Tab data ────────────────────────────────────────────────────────────────

type Tab = "surprise" | "specific" | "exact_city";

interface Step {
  title: string;
  description: string;
  Icon: (props: IconProps) => React.ReactElement;
}

const TABS: ReadonlyArray<{
  value: Tab;
  label: string;
  Icon: (props: TabIconProps) => React.ReactElement;
}> = [
  { value: "surprise", label: "Surprise me", Icon: SurpriseIcon },
  { value: "specific", label: "I know the region", Icon: PinIcon },
  { value: "exact_city", label: "I know the exact city", Icon: CrosshairIcon },
];

const STEPS_BY_TAB: Record<Tab, readonly [Step, Step, Step]> = {
  surprise: [
    {
      title: "Set your trip basics",
      description: "Budget, month, nights, and who's traveling.",
      Icon: PlaneIcon,
    },
    {
      title: "Triply's AI surprises you",
      description:
        "Three destinations you'd never think of, picked for your vibe and budget.",
      Icon: AiComputerIcon,
    },
    {
      title: "Compare breakdowns & book",
      description:
        "Side-by-side flight, hotel and daily costs, with direct booking links.",
      Icon: PalmTreeIcon,
    },
  ],
  specific: [
    {
      title: "Set your params & pick a region",
      description: "Same basics, plus a country or region you have in mind.",
      Icon: PlaneIcon,
    },
    {
      title: "AI finds the 3 best spots",
      description: "Cities within your region that fit your vibe and budget.",
      Icon: AiComputerIcon,
    },
    {
      title: "Compare breakdowns & book",
      description:
        "Side-by-side flight, hotel and daily costs, with direct booking links.",
      Icon: PalmTreeIcon,
    },
  ],
  exact_city: [
    {
      title: "Set your params & enter your city",
      description: "Same basics, plus the exact city you want to visit.",
      Icon: PlaneIcon,
    },
    {
      title: "AI builds the full plan",
      description:
        "Day plan, top places to visit, and a real budget breakdown for that city.",
      Icon: AiComputerIcon,
    },
    {
      title: "Review the day plan & book",
      description: "Read the plan, follow the links, go.",
      Icon: PalmTreeIcon,
    },
  ],
};

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

// Outer mount: only mounts the body when actually open so each open is a
// fresh instance with clean state (matches the AuthModal pattern).
export function HowItWorksModal({ open, onClose }: Props) {
  if (!open) return null;
  return <HowItWorksBody onClose={onClose} />;
}

function HowItWorksBody({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("surprise");

  // Esc closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const steps = STEPS_BY_TAB[tab];

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in-overlay overscroll-contain"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="How Triply works"
    >
      <div
        className="relative z-[101] w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-border shadow-2xl bg-cream"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated gradient blobs — same treatment as the hero, contained */}
        <GradientMesh variant="contained" />

        {/* Scroll container: the gradient stays fixed, content scrolls */}
        <div className="relative z-10 max-h-[90vh] overflow-y-auto p-7 sm:p-9">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-muted hover:text-[#1a1a1a] transition-colors cursor-pointer"
          >
            <CloseIcon />
          </button>

          <header className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-1.5 font-mono text-[11px] font-medium uppercase text-accent tracking-[0.18em] mb-1">
              <PaperPlaneIcon size={12} />
              <span>How it works</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1A1A1A]">
              Three ways to plan with Triply
            </h2>
            <p className="text-sm text-muted mt-1.5 max-w-md mx-auto">
              Pick your path. The three steps below show what happens at each
              stage.
            </p>
          </header>

          {/* Segmented tabs — match TripForm's destination toggles */}
          <div
            role="tablist"
            aria-label="How it works — choose a flow"
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-7"
          >
            {TABS.map(({ value, label, Icon }) => {
              const isActive = tab === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(value)}
                  className={`rounded-2xl py-3 px-3 inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                    isActive ? "shadow-md scale-[1.02]" : "hover:scale-[1.01]"
                  }`}
                  style={{
                    backgroundColor: isActive ? "#FF6B47" : "#F5F5F5",
                    color: isActive ? "#ffffff" : "#1a1a1a",
                    minHeight: "48px",
                  }}
                >
                  <Icon color={isActive ? "#ffffff" : "#FF6B47"} size={18} />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Roadmap — three stops laid out side-by-side on sm+ and stacked on
              mobile. A dashed coral connector sits behind the icon row, so
              each circle visually "punches through" the line. The icon is the
              hero; the step number is a small chip overlapping its circle. */}
          <div
            key={tab}
            role="tabpanel"
            aria-label={TABS.find((t) => t.value === tab)?.label}
            className="relative"
          >
            <Roadmap steps={steps} />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────

function Roadmap({ steps }: { steps: readonly [Step, Step, Step] }) {
  return (
    <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 sm:gap-3">
      {/* Dashed connector — sits behind the icons. On desktop it runs
          horizontally between icon centers; on mobile it runs vertically.
          We inset the line so it spans roughly stop1 → stop3, not edge to
          edge, and keep it low-z so the circles remain crisp on top. */}
      <div
        aria-hidden="true"
        className="hidden sm:block pointer-events-none absolute top-[24px] left-[16.66%] right-[16.66%] border-t-2 border-dashed"
        style={{ borderColor: "rgba(255,107,71,0.4)", zIndex: 0 }}
      />
      <div
        aria-hidden="true"
        className="sm:hidden pointer-events-none absolute left-[23px] top-[24px] bottom-[40px] border-l-2 border-dashed"
        style={{ borderColor: "rgba(255,107,71,0.4)", zIndex: 0 }}
      />

      {steps.map((step, i) => (
        <RoadmapStop key={i} step={step} index={i} />
      ))}
    </div>
  );
}

function RoadmapStop({ step, index }: { step: Step; index: number }) {
  const StepIcon = step.Icon;
  const tint = STEP_TINTS[index] ?? STEP_TINTS[0];

  return (
    <div
      className="relative flex sm:flex-col items-start sm:items-center gap-4 sm:gap-3 sm:flex-1 sm:min-w-0 animate-step-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Icon column — no halo, the glyph sits directly on the cream surface.
          The icon is wrapped in a fixed 48px box so the number chip has a
          stable anchor and the dashed connector lines up reliably. */}
      <div className="relative shrink-0 z-10">
        <span
          className="inline-flex items-center justify-center w-12 h-12"
          style={{ color: tint.icon }}
          aria-hidden="true"
        >
          <StepIcon size={46} />
        </span>
        <span
          className="absolute -top-1 -right-2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold text-white ring-2 ring-cream"
          style={{ backgroundColor: tint.icon }}
          aria-hidden="true"
        >
          {index + 1}
        </span>
      </div>

      {/* Copy — left-aligned on mobile (next to the icon), center-aligned in
          the desktop vertical stack */}
      <div className="min-w-0 flex-1 sm:flex-none sm:text-center sm:px-1">
        <h3 className="font-semibold text-[#1A1A1A] text-base leading-snug">
          {step.title}
        </h3>
        <p className="text-sm text-muted leading-relaxed mt-1">
          {step.description}
        </p>
      </div>
    </div>
  );
}
