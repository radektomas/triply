import { CyclingText } from "@/components/ui/CyclingText";

export default function ResultsLoading() {
  return (
    <main className="flex-1 flex items-center justify-center min-h-[70vh]">
      <div className="text-center px-6 max-w-md">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-orange-400 animate-pulse-slow opacity-80" />
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 text-3xl">✈️</div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Triply is thinking...</h1>
        <CyclingText />
        <div className="flex gap-1.5 justify-center">
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce-1" />
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce-2" />
          <span className="w-2 h-2 rounded-full bg-accent animate-bounce-3" />
        </div>
        <p className="text-xs text-muted/60 mt-12">First search may take up to 15 seconds</p>
      </div>
    </main>
  );
}
