import Link from "next/link";
import { GradientMesh } from "@/components/landing/GradientMesh";
import { TriplyMascot } from "@/components/triply/TriplyMascot";
import { TicketButton } from "@/components/ui/TicketButton";

export default function NotFound() {
  return (
    <main className="relative flex-1 flex items-center justify-center px-6 py-12 overflow-hidden">
      <GradientMesh />

      <div className="relative z-10 w-full max-w-xl mx-auto text-center">
        <div className="flex justify-center sm:hidden">
          <TriplyMascot state="lost" size="md" />
        </div>
        <div className="hidden sm:flex sm:justify-center">
          <TriplyMascot state="lost" size="lg" />
        </div>

        <p className="font-bold text-6xl sm:text-7xl md:text-8xl text-teal-800 leading-none -mt-10 sm:-mt-12 mb-6">
          404
        </p>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-3">
          This destination doesn&apos;t exist.
        </h1>

        <p className="text-base sm:text-lg text-muted leading-relaxed max-w-md mx-auto mb-8">
          Looks like Triply got lost. Let&apos;s get you home.
        </p>

        <div className="flex justify-center">
          <TicketButton href="/" size="md" serial="LOST · 404">
            Take me home →
          </TicketButton>
        </div>

        <div className="mt-6">
          <Link
            href="/#planner"
            className="text-sm font-medium text-accent hover:text-accent-deep transition-colors"
          >
            Or start a new trip →
          </Link>
        </div>
      </div>
    </main>
  );
}
