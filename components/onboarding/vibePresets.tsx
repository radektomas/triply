"use client";

import {
  BeachIcon,
  CityIcon,
  MountainsIcon,
  PartyIcon,
  CultureIcon,
  AdventureIcon,
  RomanticIcon,
} from "@/components/landing/VibeIcons";
import type { TravelerVibe } from "@/lib/traveler";

interface IconProps {
  color: string;
  size?: number;
}

// Three vibes the planner form doesn't offer yet — drawn in the same 32-grid,
// flat-fill language as components/landing/VibeIcons.tsx.
export function NatureIcon({ color, size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M26 6 C 14 6, 6 14, 6 26 C 18 26, 26 18, 26 6 Z" fill={color} />
      <path d="M8 24 L 20 12" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

export function FoodIcon({ color, size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9 5 V 13 C 9 15.5, 10.5 17, 12.5 17 V 27" stroke={color} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M6 5 V 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 5 V 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M22 5 C 19 5, 18 9, 18 13 C 18 16, 19.5 17, 21 17 V 27" stroke={color} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M22 5 V 17" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function RelaxIcon({ color, size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="21" cy="10" r="4" fill={color} />
      <path d="M4 22 L 10 14 L 18 22 Z" fill={color} opacity="0.85" />
      <path d="M4 26 Q 8 24, 12 26 T 20 26 T 28 26" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export interface VibePreset {
  value: TravelerVibe;
  label: string;
  Icon: (p: IconProps) => React.JSX.Element;
  color: string;
}

// Colors reuse the planner's per-vibe palette so a vibe looks the same
// everywhere it appears (form chip, profile card, onboarding tile).
export const VIBE_PRESETS: VibePreset[] = [
  { value: "beach",    label: "Beach",      Icon: BeachIcon,      color: "#F4A261" },
  { value: "city",     label: "City",       Icon: CityIcon,       color: "#0D7377" },
  { value: "mountains",label: "Mountains",  Icon: MountainsIcon,  color: "#8E7CC3" },
  { value: "party",    label: "Party",      Icon: PartyIcon,      color: "#FF6B47" },
  { value: "culture",  label: "Culture",    Icon: CultureIcon,    color: "#D4574E" },
  { value: "adventure",label: "Adventure",  Icon: AdventureIcon,  color: "#2A9D8F" },
  { value: "romantic", label: "Romantic",   Icon: RomanticIcon,   color: "#E76F8A" },
  { value: "nature",   label: "Nature",     Icon: NatureIcon,     color: "#5A9E4B" },
  { value: "food",     label: "Food",       Icon: FoodIcon,       color: "#C8742B" },
  { value: "relax",    label: "Relax",      Icon: RelaxIcon,      color: "#3E8ED0" },
];

export const VIBE_BY_VALUE: Record<string, VibePreset> = Object.fromEntries(
  VIBE_PRESETS.map((p) => [p.value, p]),
);
