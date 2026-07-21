interface EstimateMarkProps {
  /** Matches the surrounding type; inherits currentColor by default. */
  size?: number;
  color?: string;
  /** Overrides the tooltip/screen-reader wording for a specific context. */
  label?: string;
}

// Inline "this is an estimate" marker, rendered immediately after a price.
//
// Every figure Triply displays is produced by a language model reasoning about
// typical costs — not fetched from a flight, hotel or activity pricing API. So
// a number shown here is a well-informed guess, and the interface has to say so
// AT the number rather than in a footnote nobody reads. That is both honest and
// the thing that keeps "real prices" style claims defensible.
//
// Hand-rolled SVG matching the pattern in components/landing/VibeIcons.tsx —
// same props shape, same 32-unit viewBox convention scaled down, currentColor
// so it tints with the price text. No icon library.
export function EstimateMark({
  size = 13,
  color = "currentColor",
  label = "Estimated price — actual prices vary",
}: EstimateMarkProps) {
  return (
    <span
      className="inline-flex items-baseline align-baseline ml-1 opacity-60"
      title={label}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={label}
        style={{ transform: "translateY(0.12em)" }}
      >
        {/* Approximation sign (≈) — reads as "about this much" in any language,
            which matters for the Czech version too. */}
        <path
          d="M6 12 Q 11 8, 16 12 T 26 12"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M6 21 Q 11 17, 16 21 T 26 21"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}
