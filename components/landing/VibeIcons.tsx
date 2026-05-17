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
