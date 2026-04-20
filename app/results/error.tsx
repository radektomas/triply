"use client";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ResultsError({ error, reset }: Props) {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-4xl font-bold text-accent mb-4">Oops</p>
        <p className="text-lg font-semibold text-[#1A1A1A] mb-2">
          Could not load trip suggestions
        </p>
        <p className="text-sm text-muted mb-8">
          {error.message?.includes("30") || error.message?.includes("timeout")
            ? "The AI took too long to respond. Try again in a moment."
            : "Something went wrong fetching your trips. Please try again."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            Try again
          </button>
          <a
            href="/"
            className="text-sm font-semibold text-muted hover:text-accent px-5 py-2.5 rounded-xl border border-border transition-colors"
          >
            ← Change search
          </a>
        </div>
      </div>
    </main>
  );
}
