import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { HeaderUser } from "./HeaderUser";

export function Header() {
  // Fixed (not sticky) so the header doesn't occupy any layout space — the
  // hero gradient (or any page background) extends all the way to y=0 and
  // shows through the transparent bar. Pointer-events are disabled on the
  // wrapper and re-enabled on each interactive child so clicks pass through
  // the empty middle area to whatever's underneath.
  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full pointer-events-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          aria-label="Triply home"
          className="inline-flex items-center pointer-events-auto"
        >
          <Wordmark size="sm" />
        </Link>
        <div className="pointer-events-auto">
          <HeaderUser />
        </div>
      </div>
    </header>
  );
}
