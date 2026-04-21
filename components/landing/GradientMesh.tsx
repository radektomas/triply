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

      <div
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-70 blur-3xl animate-mesh-1"
        style={{ background: "radial-gradient(circle, #FF6B4A 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-[30%] right-[-15%] w-[60%] h-[60%] rounded-full opacity-60 blur-3xl animate-mesh-2"
        style={{ background: "radial-gradient(circle, #FFB088 0%, transparent 70%)" }}
      />
      <div
        className={`absolute rounded-full blur-3xl animate-mesh-3 ${
          isTall
            ? "bottom-[20%] left-[20%] w-[55%] h-[55%] opacity-40"
            : "bottom-[-10%] left-[30%] w-[50%] h-[50%] opacity-50"
        }`}
        style={{ background: "radial-gradient(circle, #FF8E5E 0%, transparent 70%)" }}
      />
      {isTall && (
        <div
          className="absolute bottom-[-5%] right-[10%] w-[45%] h-[45%] rounded-full opacity-40 blur-3xl animate-mesh-2"
          style={{ background: "radial-gradient(circle, #FFB088 0%, transparent 70%)" }}
        />
      )}

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
