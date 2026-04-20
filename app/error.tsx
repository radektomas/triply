"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-bold text-muted mb-4">Oops</p>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          Something went wrong
        </h1>
        <p className="text-muted mb-8 leading-relaxed">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center bg-accent text-white font-semibold px-6 py-3 rounded-xl hover:brightness-110 hover:scale-[1.02] transition-all cursor-pointer"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
