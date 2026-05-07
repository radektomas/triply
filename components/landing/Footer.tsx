import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { InstagramIcon } from "./VibeIcons";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between text-sm text-muted">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <Wordmark size="sm" />
          <p className="text-xs text-muted">AI trip planner</p>
          <p className="text-xs text-muted/70">© 2026 Triply</p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm"
        >
          <Link
            href="/privacy"
            className="text-muted hover:text-[#1a1a1a] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-muted hover:text-[#1a1a1a] transition-colors"
          >
            Terms
          </Link>
          <a
            href="mailto:hello@flytriply.eu"
            className="text-muted hover:text-[#1a1a1a] transition-colors"
          >
            Contact
          </a>
        </nav>

        <a
          href="https://www.instagram.com/flytriplyapp/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow Triply on Instagram"
          className="group flex items-center gap-2 self-center sm:self-auto"
        >
          <span className="text-sm text-muted">Follow us</span>
          <span className="text-teal group-hover:text-accent transition-colors duration-200 flex">
            <InstagramIcon color="currentColor" size={28} />
          </span>
        </a>
      </div>
    </footer>
  );
}
