import { Wordmark } from "@/components/ui/Wordmark";
import { InstagramIcon } from "./VibeIcons";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-sm text-muted">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <Wordmark size="sm" />
          <p className="text-xs text-muted">AI trip planner</p>
          <p className="text-xs text-muted/70">© 2026 Triply</p>
        </div>

        <a
          href="https://www.instagram.com/flytriplyapp/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow Triply on Instagram"
          className="group flex items-center gap-2"
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
