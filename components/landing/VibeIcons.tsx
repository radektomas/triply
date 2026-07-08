interface VibeIconProps {
  color: string;
  size?: number;
}

export function BeachIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="11" r="4" fill={color} />
      <path d="M4 22 Q 8 20, 12 22 T 20 22 T 28 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M4 26 Q 8 24, 12 26 T 20 26 T 28 26" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

export function CityIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="14" width="6" height="14" rx="1" fill={color} />
      <rect x="13" y="8" width="6" height="20" rx="1" fill={color} />
      <rect x="21" y="11" width="6" height="17" rx="1" fill={color} />
    </svg>
  );
}

export function MountainsIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 26 L 12 10 L 20 26 Z" fill={color} />
      <path d="M14 26 L 22 14 L 28 26 Z" fill={color} opacity="0.7" />
    </svg>
  );
}

export function PartyIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="10" r="2" fill={color} />
      <circle cx="16" cy="6" r="2.5" fill={color} />
      <circle cx="24" cy="9" r="2" fill={color} />
      <circle cx="11" cy="18" r="2" fill={color} opacity="0.8" />
      <circle cx="20" cy="16" r="2.5" fill={color} />
      <circle cx="26" cy="22" r="2" fill={color} opacity="0.7" />
      <circle cx="14" cy="25" r="2" fill={color} opacity="0.6" />
    </svg>
  );
}

export function CultureIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 26 L 6 16 Q 16 6, 26 16 L 26 26 Z" fill={color} />
      <rect x="14" y="18" width="4" height="8" fill="white" opacity="0.9" />
    </svg>
  );
}

export function AdventureIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 26 L 14 14 L 20 18 L 28 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="28" cy="6" r="3" fill={color} />
    </svg>
  );
}

export function InstagramIcon({ color, size = 22 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill={color} />
    </svg>
  );
}

export function RomanticIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 27 C 6 19, 4 12, 9 9 Q 13 6.5, 16 11 Q 19 6.5, 23 9 C 28 12, 26 19, 16 27 Z"
        fill={color}
      />
    </svg>
  );
}

export function HiddenGemIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 12 L 12 6 L 20 6 L 24 12 L 16 26 Z" fill={color} />
      <path d="M12 6 L 16 12 L 20 6 M 8 12 L 16 12 L 24 12" stroke="white" strokeWidth="1.2" opacity="0.6" fill="none" />
    </svg>
  );
}

export function BudgetIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="11" fill={color} />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="white"
        fontFamily="system-ui"
      >
        €
      </text>
    </svg>
  );
}

export function FamilyIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="3.5" fill={color} />
      <circle cx="22" cy="10" r="3.5" fill={color} />
      <circle cx="16" cy="18" r="2.5" fill={color} opacity="0.85" />
      <path d="M3 26 Q 10 19, 16 22 Q 22 19, 29 26 L 29 28 L 3 28 Z" fill={color} />
    </svg>
  );
}

export function UnderratedIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4 L 18 13 L 27 14 L 20 20 L 22 28 L 16 23 L 10 28 L 12 20 L 5 14 L 14 13 Z" fill={color} />
      <circle cx="25" cy="7" r="1.5" fill={color} opacity="0.6" />
      <circle cx="7" cy="9" r="1" fill={color} opacity="0.45" />
    </svg>
  );
}

export function SparkleIcon({ color, size = 22 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 4 L 17.5 12 L 25 14 L 17.5 16 L 16 24 L 14.5 16 L 7 14 L 14.5 12 Z"
        fill={color}
      />
      <path d="M25 5 L 25.8 7.5 L 28 8.3 L 25.8 9 L 25 11.5 L 24.2 9 L 22 8.3 L 24.2 7.5 Z" fill={color} opacity="0.7" />
      <path d="M6 22 L 6.6 24 L 8.5 24.5 L 6.6 25 L 6 27 L 5.4 25 L 3.5 24.5 L 5.4 24 Z" fill={color} opacity="0.55" />
    </svg>
  );
}

export function ArrowUpIcon({ color, size = 18 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="19" x2="12" y2="5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <polyline points="6 11 12 5 18 11" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function CheckIcon({ color, size = 16 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="5 12 10 17 19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function CloseIcon({ color, size = 14 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ color, size = 18 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21s-7-4.35-9.5-9.05A5.5 5.5 0 0 1 12 6.5a5.5 5.5 0 0 1 9.5 5.45C19 16.65 12 21 12 21z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function ArrowRightIcon({ color, size = 14 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <polyline points="13 6 19 12 13 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function ArrowLeftIcon({ color, size = 14 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="19" y1="12" x2="5" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <polyline points="11 6 5 12 11 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Fork tile icons v2 — "Surprise me" (FlightPathIcon), "I know the region"
// (RegionIcon), "I know the exact city" (FlagIcon). Same inline-SVG pattern:
// color prop, no icon library. Replaced the earlier dice/pin/target set.
export function FlightPathIcon({ color, size = 22 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dotted looping trajectory — the "anywhere" of Surprise me */}
      <path
        d="M4 18 C 6 12, 10 16, 12 11 S 17 7, 19 6"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeDasharray="0.5 3.4"
        fill="none"
      />
      {/* Paper plane at the end of the path */}
      <path
        d="M21.5 3.5 L 13.8 7.2 L 16.6 8.9 Z"
        fill={color}
      />
      <path
        d="M21.5 3.5 L 16.6 8.9 L 17 11.5 Z"
        fill={color}
        opacity="0.65"
      />
    </svg>
  );
}

export function RegionIcon({ color, size = 22 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Organic map-fragment outline, dashed = a boundary, not a point */}
      <path
        d="M6.5 4.5 C 9.5 3, 13 4.5, 15.5 4 C 18.5 3.5, 20.5 6, 20 9 C 19.6 11.5, 21 13.5, 19.5 16 C 18 18.5, 14.5 18, 12 19.5 C 9.5 21, 6 20, 5 17.5 C 4 15, 5.5 13, 4.5 10.5 C 3.5 8, 4.5 5.5, 6.5 4.5 Z"
        stroke={color}
        strokeWidth="1.7"
        strokeDasharray="3.2 2.4"
        strokeLinecap="round"
        fill={color}
        fillOpacity="0.13"
      />
      {/* Two soft settlement dots inside — "somewhere in here" */}
      <circle cx="10" cy="10" r="1.4" fill={color} />
      <circle cx="14.5" cy="13.5" r="1.4" fill={color} opacity="0.6" />
    </svg>
  );
}

export function FlagIcon({ color, size = 22 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Planted flag — decisiveness, "I know exactly where" */}
      <line x1="7" y1="3.5" x2="7" y2="20.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7 4.5 C 10 3, 12.5 6, 16.5 4.5 C 17.5 4.1, 18 4.6, 18 5.4 L 18 10.6 C 18 11.3, 17.6 11.7, 16.9 11.9 C 13 13.2, 10.5 10.4, 7 12"
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {/* Ground dot — the pin-point, planted */}
      <ellipse cx="7" cy="21" rx="2.6" ry="0.9" fill={color} opacity="0.35" />
    </svg>
  );
}

// Transport-mode icons for the "How are you traveling?" toggle — same
// inline-SVG pattern: color prop, no icon library.
export function PlaneIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Simple airliner silhouette pointing up — fuselage, wings, tail */}
      <path
        d="M16 3 L 17.8 5 L 17.8 12.2 L 28 18.2 L 28 21 L 17.8 17.6 L 17.8 23.6 L 21 26 L 21 28.5 L 16 26.8 L 11 28.5 L 11 26 L 14.2 23.6 L 14.2 17.6 L 4 21 L 4 18.2 L 14.2 12.2 L 14.2 5 Z"
        fill={color}
      />
    </svg>
  );
}

export function CarIcon({ color, size = 32 }: VibeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cabin */}
      <path
        d="M8 19 L 10 12.5 Q 10.6 11, 12.2 11 L 19.8 11 Q 21.4 11, 22 12.5 L 24 19 Z"
        fill={color}
        opacity="0.7"
      />
      {/* Body */}
      <rect x="4" y="18" width="24" height="6.5" rx="2.5" fill={color} />
      {/* Wheels */}
      <circle cx="10" cy="26" r="2.6" fill={color} />
      <circle cx="22" cy="26" r="2.6" fill={color} />
    </svg>
  );
}

// Quick Picks vibe enum → icon component.
// Free-form vibe strings from n8n should NOT use this — those go through
// substring matching elsewhere. This is for the fixed Quick Picks enum.
export type QuickPickVibe =
  | "romantic"
  | "mountain"
  | "hidden_gem"
  | "budget"
  | "beach"
  | "city"
  | "family"
  | "underrated";

export function getVibeIcon(vibe: QuickPickVibe) {
  switch (vibe) {
    case "romantic":
      return RomanticIcon;
    case "mountain":
      return MountainsIcon;
    case "hidden_gem":
      return HiddenGemIcon;
    case "budget":
      return BudgetIcon;
    case "beach":
      return BeachIcon;
    case "city":
      return CityIcon;
    case "family":
      return FamilyIcon;
    case "underrated":
      return UnderratedIcon;
  }
}
