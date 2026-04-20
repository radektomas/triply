export function HeroSection() {
  return (
    <div className="text-center pt-16 pb-10 px-4">
      <div className="inline-block bg-accent-light text-accent text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
        AI-powered trip planning
      </div>
      <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[#1A1A1A] leading-tight mb-4">
        Discover where your{" "}
        <span className="text-accent">budget</span>{" "}
        takes you
      </h1>
      <p className="text-lg text-muted max-w-md mx-auto">
        Enter your budget, pick a month, and tell us how many nights — we'll find your perfect European escape.
      </p>
    </div>
  );
}
