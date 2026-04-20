"use client";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TripError({ error: _error, reset }: Props) {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-4xl font-bold text-accent mb-4">Oops</p>
        <p className="text-lg font-semibold text-[#1A1A1A] mb-2">
          Something went wrong loading this trip plan
        </p>
        <p className="text-xs text-muted mb-8">
          First loads can take up to 30 seconds.
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
            ← Home
          </a>
        </div>
      </div>
    </main>
  );
}
