"use client";

import { usePathname } from "next/navigation";

// Routes that bring their own page chrome (header/footer). The invest
// one-pager renders its own slim sticky header + bilingual footer, so the
// global fixed Header (logo top-left) and English Footer would double up.
// usePathname resolves during SSR too, so the no-JS HTML is already correct.
const STANDALONE_ROUTES = ["/invest"];

export function GlobalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = STANDALONE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (standalone) return null;
  return <>{children}</>;
}
