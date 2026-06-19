import Link from "next/link";
import Image from "next/image";
import { HeaderUser } from "./HeaderUser";

export function Header() {
  // Fixed (not sticky) so the header doesn't occupy any layout space — the
  // hero gradient (or any page background) extends all the way to y=0 and
  // shows through the transparent bar. Pointer-events are disabled on the
  // wrapper and re-enabled on each interactive cluster so the empty middle
  // area still passes clicks through to underlying content.
  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full pointer-events-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="pointer-events-auto">
          {/* Brand wordmark → home. Reuses the same tropical wordmark asset
              as the Footer/Hero/LoadingOverlay for consistency; sized to
              balance the user pill on the right. Subtle opacity + scale
              hover matches the site's other interactive elements. */}
          <Link
            href="/"
            aria-label="Triply — home"
            className="inline-flex items-center transition hover:opacity-80 hover:scale-[1.02]"
          >
            <Image
              src="/triply-logo-tropical.webp"
              alt="Triply"
              width={936}
              height={279}
              className="w-[88px] h-auto select-none"
            />
          </Link>
        </div>
        <div className="pointer-events-auto">
          <HeaderUser />
        </div>
      </div>
    </header>
  );
}
