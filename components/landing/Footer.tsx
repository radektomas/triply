export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <span className="font-semibold text-[#1A1A1A]">Triply · AI trip planner</span>

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
