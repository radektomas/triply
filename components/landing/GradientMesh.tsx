"use client";

type Variant = "contained" | "fixed" | "absolute-tall";

const wrapperClass: Record<Variant, string> = {
  contained: "absolute inset-0 overflow-hidden -z-10",
  fixed: "fixed inset-0 overflow-hidden -z-10 pointer-events-none",
  "absolute-tall": "absolute inset-0 overflow-hidden -z-10",
};

export function GradientMesh({ variant = "contained" }: { variant?: Variant }) {
  const isTall = variant === "absolute-tall";

  return (
    <div className={wrapperClass[variant]}>
      <div className="absolute inset-0 bg-cream" />

      {/* Two soft blobs (down from 3–4) at blur-2xl/40px (down from blur-3xl/
          64px) to slash per-frame compositing cost. The radial gradients fade
          to transparent at 70%, so a smaller blur looks nearly identical but is
          far cheaper. `will-change: transform` (set on the animate-mesh-*
          classes) keeps them on their own GPU layer so they aren't repainted
          during scroll; the drift is translate-only and is disabled on mobile +
          reduced-motion via globals.css. On tall pages the second blob drops
          lower to keep the long page covered with only two blobs. */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-70 blur-2xl animate-mesh-1"
        style={{ background: "radial-gradient(circle, #FF6B4A 0%, transparent 70%)" }}
      />
      <div
        className={`absolute rounded-full opacity-60 blur-2xl animate-mesh-2 right-[-15%] ${
          isTall ? "top-[45%] w-[65%] h-[70%]" : "top-[30%] w-[60%] h-[60%]"
        }`}
        style={{ background: "radial-gradient(circle, #FFB088 0%, transparent 70%)" }}
      />

      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
