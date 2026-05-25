"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GradientMesh } from "./GradientMesh";

// ─── Inline icons ────────────────────────────────────────────────────────────
// Follows the existing project convention (VibeIcons.tsx / AuthIcons.tsx):
// small function components, currentColor or `color` prop, no lucide-react.

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

// Tab icons — recreated locally to match the destination toggles in TripForm
// without importing from that heavy form component.
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

// Step icons — consistent across tabs (steps share the same shape: params →
// AI → review). Render with currentColor so the parent controls the tint.
function SlidersIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <circle cx="9" cy="6" r="2.5" fill="currentColor" stroke="none" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <circle cx="15" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <line x1="3" y1="18" x2="21" y2="18" />
      <circle cx="7" cy="18" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SparklesIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 L13.5 9 L19 10 L13.5 11 L12 17 L10.5 11 L5 10 L10.5 9 Z" />
      <path d="M19 3 L19.5 5 L21 5.5 L19.5 6 L19 8 L18.5 6 L17 5.5 L18.5 5 Z" />
      <path d="M5 16 L5.5 18 L7 18.5 L5.5 19 L5 21 L4.5 19 L3 18.5 L4.5 18 Z" />
    </svg>
  );
}

function ChecklistIcon({ size = 18 }: IconProps) {
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
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 10 L10.5 12.5 L14.5 8.5" />
      <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
  );
}

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
      Icon: SlidersIcon,
    },
    {
      title: "Triply's AI surprises you",
      description:
        "Three destinations you'd never think of, picked for your vibe and budget.",
      Icon: SparklesIcon,
    },
    {
      title: "Compare breakdowns & book",
      description:
        "Side-by-side flight, hotel and daily costs, with direct booking links.",
      Icon: ChecklistIcon,
    },
  ],
  specific: [
    {
      title: "Set your params & pick a region",
      description: "Same basics, plus a country or region you have in mind.",
      Icon: SlidersIcon,
    },
    {
      title: "AI finds the 3 best spots",
      description: "Cities within your region that fit your vibe and budget.",
      Icon: SparklesIcon,
    },
    {
      title: "Compare breakdowns & book",
      description:
        "Side-by-side flight, hotel and daily costs, with direct booking links.",
      Icon: ChecklistIcon,
    },
  ],
  exact_city: [
    {
      title: "Set your params & enter your city",
      description: "Same basics, plus the exact city you want to visit.",
      Icon: SlidersIcon,
    },
    {
      title: "AI builds the full plan",
      description:
        "Day plan, top places to visit, and a real budget breakdown for that city.",
      Icon: SparklesIcon,
    },
    {
      title: "Review the day plan & book",
      description: "Read the plan, follow the links, go.",
      Icon: ChecklistIcon,
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
            <p className="font-mono text-[11px] font-medium uppercase text-accent tracking-[0.18em] mb-1">
              How it works
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1A1A1A]">
              Three ways to plan with Triply
            </h2>
            <p className="text-sm text-muted mt-1.5 max-w-md mx-auto">
              Pick your path — the three steps below show what happens at each
              stage.
            </p>
          </header>

          {/* Segmented tabs — match TripForm's destination toggles */}
          <div
            role="tablist"
            aria-label="How it works — choose a flow"
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6"
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

          {/* Steps — keyed by tab so the fade-in re-fires on tab switch */}
          <div
            key={tab}
            role="tabpanel"
            aria-label={TABS.find((t) => t.value === tab)?.label}
            className="space-y-3 animate-fade-in-overlay"
          >
            {steps.map((step, i) => {
              const StepIcon = step.Icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-white/80 backdrop-blur-sm border border-[#0D7377]/10 rounded-2xl p-4 sm:p-5"
                >
                  <span
                    className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent text-white font-bold text-sm"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span
                    className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#0D7377]/10 text-[#0D7377]"
                    aria-hidden="true"
                  >
                    <StepIcon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#1A1A1A] text-base leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
