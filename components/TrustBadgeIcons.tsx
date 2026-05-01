// Outline SVG icons for the hero trust badges. Single-color via `currentColor`
// so the consumer drives the hue with a Tailwind text-* class. Style aligns
// with the rest of the inline-SVG icons used across the site (VibeIcons,
// InstagramIcon): 24x24 viewBox, 1.5 stroke, rounded caps/joins, no fill.

interface IconProps {
  size?: number;
  className?: string;
}

const COMMON_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function PlaneIcon({ size = 22, className }: IconProps) {
  // Paper airplane in mid-flight: outer wing silhouette + interior fold crease.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M 3 11.5 L 21 3.5 L 14 20.5 L 10.5 13 Z" {...COMMON_PROPS} />
      <path d="M 10.5 13 L 21 3.5" {...COMMON_PROPS} />
    </svg>
  );
}

export function HotelIcon({ size = 22, className }: IconProps) {
  // Minimal hotel facade: building rectangle + central door + two windows.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="6" width="16" height="15" rx="0.5" {...COMMON_PROPS} />
      <rect x="10" y="14" width="4" height="7" {...COMMON_PROPS} />
      <line x1="7" y1="10" x2="9" y2="10" {...COMMON_PROPS} />
      <line x1="15" y1="10" x2="17" y2="10" {...COMMON_PROPS} />
    </svg>
  );
}

export function TicketIcon({ size = 22, className }: IconProps) {
  // Ticket outline with semicircle perforation notches cut into left + right
  // edges. Single closed path so the stroke flows uninterrupted around it.
  // Right notch: arcs CCW from (19, 11.25) to (19, 12.75) bowing inward (left).
  // Left  notch: arcs CW  from (5, 12.75) to (5, 11.25) bowing inward (right).
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M 5 7 L 19 7 L 19 11.25 A 1.5 1.5 0 0 0 19 12.75 L 19 17 L 5 17 L 5 12.75 A 1.5 1.5 0 0 0 5 11.25 Z"
        {...COMMON_PROPS}
      />
    </svg>
  );
}

export function StarIcon({ size = 22, className }: IconProps) {
  // 5-point star outline, single closed path. Outer radius 10, inner 4,
  // centered at (12, 12). Vertices computed from polar coordinates and
  // rounded to one decimal so the path stays compact.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M 12 2 L 14.4 8.8 L 21.5 9 L 15.8 13.2 L 18 20 L 12 16 L 6 20 L 8.2 13.2 L 2.5 9 L 9.6 8.8 Z"
        {...COMMON_PROPS}
      />
    </svg>
  );
}
