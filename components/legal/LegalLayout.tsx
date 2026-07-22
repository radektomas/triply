import Link from "next/link";

// Shared furniture for the legal pages (/privacy, /cs/privacy, /terms).
//
// Previously every legal page carried its own private copies of Section and
// Bullets — identical implementations, duplicated per file, which is how the
// two documents drifted into contradicting each other in the first place.
// One set of primitives, one place to change the typography.
//
// Deliberately NOT an i18n system. Two static documents do not justify
// next-intl or a [locale] route segment across the whole app; the Czech
// versions are separate route files that import the same primitives.

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">{title}</h2>
      <div className="space-y-4 text-[#1a1a1a]/80 leading-relaxed">{children}</div>
    </section>
  );
}

export function Bullets({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 space-y-1.5">{children}</ul>;
}

/** Emphasised lead-in inside a bullet, e.g. a defined term. */
export function Term({ children }: { children: React.ReactNode }) {
  return <strong className="text-[#1a1a1a]">{children}</strong>;
}

/**
 * Simple two-or-three column table for cookie / processor / retention
 * inventories. Scrolls horizontally on narrow screens rather than forcing the
 * page body to scroll sideways.
 */
export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[32rem] text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left font-semibold text-[#1a1a1a] py-2 pr-4 align-bottom"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4 align-top text-[#1a1a1a]/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Language switch rendered at the top of each legal page.
 *
 * Plain links between two concrete routes — no locale detection, no cookie, no
 * middleware rewrite. `hrefLang` on each anchor tells crawlers what the other
 * side is, complementing the `alternates.languages` metadata on the page.
 */
export function LanguageToggle({
  current,
  enHref,
  csHref,
}: {
  current: "en" | "cs";
  enHref: string;
  csHref: string;
}) {
  const base =
    "px-2.5 py-1 rounded-full text-xs font-semibold transition-colors";
  const active = "bg-[#1a1a1a] text-white";
  const idle = "text-muted hover:text-[#1a1a1a] border border-border";

  return (
    <nav aria-label="Language" className="flex items-center gap-2 mb-8">
      <Link
        href={enHref}
        hrefLang="en"
        lang="en"
        aria-current={current === "en" ? "true" : undefined}
        className={`${base} ${current === "en" ? active : idle}`}
      >
        English
      </Link>
      <Link
        href={csHref}
        hrefLang="cs"
        lang="cs"
        aria-current={current === "cs" ? "true" : undefined}
        className={`${base} ${current === "cs" ? active : idle}`}
      >
        Čeština
      </Link>
    </nav>
  );
}

/**
 * Page shell: title, last-updated line, language toggle.
 *
 * `lang` is set on <main> rather than <html>. The root layout hardcodes
 * lang="en" and there is no [locale] segment to vary it — scoping the
 * attribute to the document body is valid HTML and gives screen readers and
 * translation tools the right language for the content that matters.
 */
export function LegalPage({
  lang,
  title,
  lastUpdatedLabel,
  lastUpdated,
  enHref,
  csHref,
  children,
}: {
  lang: "en" | "cs";
  title: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  enHref: string;
  csHref: string;
  children: React.ReactNode;
}) {
  return (
    <main lang={lang} className="max-w-3xl mx-auto px-6 py-16 md:py-20">
      <LanguageToggle current={lang} enHref={enHref} csHref={csHref} />
      <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-3">
        {title}
      </h1>
      <p className="text-sm text-muted mb-12">
        {lastUpdatedLabel} {lastUpdated}
      </p>
      {children}
    </main>
  );
}
