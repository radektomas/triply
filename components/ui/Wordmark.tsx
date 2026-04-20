const TAG_GREEN = "#0D7377";
const CREAM = "#FFE4CC";
const CORAL = "#FF6B47";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const configs = {
  sm: {
    text: "text-xl",
    padding: "px-5 py-2.5",
    perforation: "w-3 h-3",
    emoji: "text-sm",
    showString: false,
  },
  md: {
    text: "text-3xl md:text-4xl",
    padding: "px-8 py-4 md:px-10 md:py-5",
    perforation: "w-4 h-4",
    emoji: "text-xl",
    showString: true,
  },
  lg: {
    text: "text-4xl md:text-5xl",
    padding: "px-10 py-5",
    perforation: "w-5 h-5",
    emoji: "text-2xl",
    showString: true,
  },
};

export function Wordmark({ size = "md", className = "" }: Props) {
  const c = configs[size];

  return (
    // group drives both the CSS hover selector and the scale transition
    <div className={`relative inline-block group ${className}`}>
      {/* Pin + string — fixed, does not swing */}
      {c.showString && (
        <svg
          className="absolute left-1/2 -translate-x-1/2 -top-7 w-5 h-8 z-10 pointer-events-none"
          viewBox="0 0 20 32"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="10" cy="4" r="3" fill={TAG_GREEN} />
          <line
            x1="10" y1="7" x2="10" y2="32"
            stroke={TAG_GREEN}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Scale wrapper — hover scale only, no rotation */}
      <div className="transition-transform duration-500 group-hover:scale-105">
        {/* Swinging tag — rotation only, pivots from top */}
        <div
          className={`relative ${c.padding} rounded-xl select-none cursor-default animate-swing`}
          style={{
            backgroundColor: TAG_GREEN,
            boxShadow: "0 8px 28px rgba(13,115,119,0.35), 0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          {/* Left perforation */}
          <div
            className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 ${c.perforation} rounded-full`}
            style={{ backgroundColor: CREAM }}
          />

          {/* Right perforation */}
          <div
            className={`absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 ${c.perforation} rounded-full`}
            style={{ backgroundColor: CREAM }}
          />

          {/* Wordmark */}
          <div className={`relative ${c.text} font-bold italic tracking-tight leading-none flex items-center`}>
            <span style={{ color: CORAL }}>t</span>
            <span style={{ color: CREAM }}>riply</span>
            <span className={`${c.emoji} not-italic ml-2`}>✈️</span>
          </div>
        </div>
      </div>
    </div>
  );
}
