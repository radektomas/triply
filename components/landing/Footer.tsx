import { Wordmark } from "@/components/ui/Wordmark";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <Wordmark size="sm" />

        <div className="flex gap-6">
          <a href="#" className="hover:text-accent transition-colors">About</a>
          <a href="#" className="hover:text-accent transition-colors">Privacy</a>
          <a href="#" className="hover:text-accent transition-colors">Contact</a>
        </div>

        <span>Made with ❤️ in Prague</span>
      </div>
    </footer>
  );
}
