import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-bold text-accent mb-4">404</p>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          Destination not found
        </h1>
        <p className="text-muted mb-8 leading-relaxed">
          That trip doesn&apos;t exist yet. Let&apos;s find you a real one.
        </p>
        <Link
          href="/"
          className="inline-flex items-center bg-accent text-white font-semibold px-6 py-3 rounded-xl hover:brightness-110 hover:scale-[1.02] transition-all"
        >
          Plan a trip →
        </Link>
      </div>
    </main>
  );
}
