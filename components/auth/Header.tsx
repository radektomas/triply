"use client";

import { usePathname } from "next/navigation";
import { HeaderUser } from "./HeaderUser";
import { HeaderSearch } from "./HeaderSearch";

export function Header() {
  // Fixed (not sticky) so the header doesn't occupy any layout space — the
  // hero gradient (or any page background) extends all the way to y=0 and
  // shows through the transparent bar. Pointer-events are disabled on the
  // wrapper and re-enabled on each interactive cluster so the empty middle
  // area still passes clicks through to underlying content.
  const pathname = usePathname();
  // The search belongs to the landing page only. Everywhere else
  // (/profile, /trip/*, /trips/*, /privacy, /terms, …) the left slot
  // renders empty so the profile/avatar on the right is the only header
  // control. Mobile magnifier-trigger is part of HeaderSearch, so this
  // covers both breakpoints.
  const showSearch = pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full pointer-events-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="pointer-events-auto">
          {showSearch ? <HeaderSearch /> : <div aria-hidden="true" />}
        </div>
        <div className="pointer-events-auto">
          <HeaderUser />
        </div>
      </div>
    </header>
  );
}
