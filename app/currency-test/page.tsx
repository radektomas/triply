import { CurrencySelector } from "@/components/CurrencySelector";
import { CurrencyTestSamples } from "./samples";

export const metadata = {
  title: "Currency context test",
  robots: { index: false, follow: false },
};

export default function CurrencyTestPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">
      <header>
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377] mb-2">
          Phase 1 verification
        </p>
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
          Currency context test
        </h1>
        <p className="text-sm text-[#1A1A1A]/60 max-w-lg">
          Switch currency below. Sample EUR amounts should re-format live with no
          page reload. Selection persists across refreshes via{" "}
          <span className="font-mono">localStorage</span>.
        </p>
      </header>

      <div className="flex justify-end">
        <CurrencySelector />
      </div>

      <CurrencyTestSamples />

      <footer className="text-xs text-[#1A1A1A]/45 leading-relaxed pt-6 border-t border-black/5">
        Rates source: open.er-api.com (EUR base) · cached 24h in localStorage.
        Page can be deleted after Phase 1 review.
      </footer>
    </main>
  );
}
