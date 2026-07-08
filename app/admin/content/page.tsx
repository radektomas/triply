import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { supabase as serviceSupabase } from "@/lib/supabase";
import { pickIdea, discardIdea, markPosted, logResult } from "./actions";

// Internal content dashboard: idea backlog → pick → post → log results.
// Protected by the same email allowlist (ADMIN_EMAILS) as /admin/funnel — any
// non-listed or anonymous visitor gets a 404 so the route never reveals it
// exists. All rows are read server-side with the service-role key
// (content_ideas / content_results have RLS enabled with no public policies).
export const dynamic = "force-dynamic";

type Pillar = "young_broke" | "travel_hacks" | "product_proof" | "founder_story";
type Persona = "broke_explorer" | "weekend_couple" | "both";

type Beat = { t: string; overlay: string; broll: string };

type Idea = {
  id: string;
  created_at: string;
  pillar: Pillar;
  persona: Persona;
  series_part: number | null;
  city: string | null;
  country: string | null;
  hook: string;
  script: { beats?: Beat[] } | null;
  caption: string | null;
  hashtags: string | null;
  engagement_question: string | null;
  why_now: string | null;
  status: "new" | "picked" | "posted" | "discarded";
  sound_hint: string | null;
};

type ResultRow = {
  id: string;
  idea_id: string;
  platform: "reels" | "tiktok";
  posted_at: string;
  views: number | null;
  saves: number | null;
  comments: number | null;
  profile_visits: number | null;
  notes: string | null;
};

const PILLARS: Record<Pillar, { label: string; className: string }> = {
  young_broke: { label: "Young & Broke", className: "bg-accent/10 text-accent-deep" },
  travel_hacks: { label: "Travel Hacks", className: "bg-teal/10 text-teal-deep" },
  product_proof: { label: "Product Proof", className: "bg-peach/25 text-[#9A3412]" },
  founder_story: { label: "Founder Story", className: "bg-cream text-[#92400E]" },
};

const PERSONAS: Record<Persona, string> = {
  broke_explorer: "Broke explorer",
  weekend_couple: "Weekend couple",
  both: "Both personas",
};

const PLATFORMS: Record<ResultRow["platform"], string> = {
  reels: "Reels",
  tiktok: "TikTok",
};

const CARD_SHADOW = "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)";

function fmtPct(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(value < 10 ? 1 : 0)}%`;
}

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default async function ContentPage() {
  // ── Access control (same allowlist guard as /admin/funnel) ─────────────────
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email = user?.email?.toLowerCase();
  if (!email || !allowlist.includes(email)) {
    notFound();
  }

  // ── Data (service role; tiny tables, so fetch whole and split in JS) ───────
  const [ideasRes, resultsRes] = await Promise.all([
    serviceSupabase
      .from("content_ideas")
      .select("*")
      .order("created_at", { ascending: false }),
    serviceSupabase
      .from("content_results")
      .select("*")
      .order("posted_at", { ascending: false }),
  ]);
  if (ideasRes.error)
    console.error("[admin/content] ideas query failed:", ideasRes.error.message);
  if (resultsRes.error)
    console.error("[admin/content] results query failed:", resultsRes.error.message);

  const ideas = (ideasRes.data ?? []) as Idea[];
  const results = (resultsRes.data ?? []) as ResultRow[];

  const todayIdeas = ideas.filter((i) => i.status === "new");
  const pickedIdeas = ideas.filter((i) => i.status === "picked");
  const postedIdeas = ideas.filter((i) => i.status === "posted");

  const resultsByIdea = new Map<string, ResultRow[]>();
  for (const r of results) {
    const list = resultsByIdea.get(r.idea_id) ?? [];
    list.push(r);
    resultsByIdea.set(r.idea_id, list);
  }

  // ── Per-pillar save rate (reels only, saves ÷ views) ───────────────────────
  const pillarByIdea = new Map(ideas.map((i) => [i.id, i.pillar]));
  const stats = new Map<Pillar, { posts: number; views: number; saves: number }>();
  for (const r of results) {
    if (r.platform !== "reels") continue;
    const pillar = pillarByIdea.get(r.idea_id);
    if (!pillar) continue;
    const s = stats.get(pillar) ?? { posts: 0, views: 0, saves: 0 };
    s.posts += 1;
    s.views += r.views ?? 0;
    s.saves += r.saves ?? 0;
    stats.set(pillar, s);
  }

  return (
    <main className="min-h-screen bg-bg px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <header className="mb-10">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent mb-2">
            Triply · Internal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
            Content dashboard
          </h1>
          <p className="mt-2 text-sm text-muted">
            {todayIdeas.length} new idea{todayIdeas.length === 1 ? "" : "s"} ·{" "}
            {pickedIdeas.length} picked · {postedIdeas.length} posted ·{" "}
            {results.length} result{results.length === 1 ? "" : "s"} logged
          </p>
        </header>

        {/* ── Today ─────────────────────────────────────────────────────────── */}
        <SectionHeading
          Icon={SparkleIcon}
          title="Today"
          blurb="Fresh ideas — pick what you'll shoot, discard what you won't."
        />
        {todayIdeas.length === 0 ? (
          <EmptyNote>No new ideas right now — the backlog is clear.</EmptyNote>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {todayIdeas.map((idea) => (
              <TodayCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}

        {/* ── Pipeline ──────────────────────────────────────────────────────── */}
        <SectionHeading
          Icon={ClapperIcon}
          title="Pipeline"
          blurb="Picked ideas waiting to be shot, and posted ones waiting on numbers."
        />
        {pickedIdeas.length === 0 && postedIdeas.length === 0 ? (
          <EmptyNote>Nothing in the pipeline — pick an idea above to start.</EmptyNote>
        ) : (
          <div className="space-y-4">
            {pickedIdeas.map((idea) => (
              <PickedCard key={idea.id} idea={idea} />
            ))}
            {postedIdeas.map((idea) => (
              <PostedCard
                key={idea.id}
                idea={idea}
                results={resultsByIdea.get(idea.id) ?? []}
              />
            ))}
          </div>
        )}

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <SectionHeading
          Icon={ChartIcon}
          title="Stats"
          blurb="Save rate per pillar — saves ÷ views, Reels only."
        />
        <StatsTable stats={stats} />

        <p className="mt-8 text-center text-xs text-muted/60">
          Save rate counts Reels results only. Signed in as {email}.
        </p>
      </div>
    </main>
  );
}

// ── Section chrome ────────────────────────────────────────────────────────────

type IconComponent = (props: { color: string; size?: number }) => React.JSX.Element;

function SectionHeading({
  Icon,
  title,
  blurb,
}: {
  Icon: IconComponent;
  title: string;
  blurb: string;
}) {
  return (
    <div className="mb-4 mt-10 flex items-center gap-3 first:mt-0">
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--color-accent-light)" }}
        aria-hidden="true"
      >
        <Icon color="var(--color-accent)" size={18} />
      </span>
      <div>
        <h2 className="font-display text-xl font-bold text-[#1A1A1A]">{title}</h2>
        <p className="text-xs text-muted">{blurb}</p>
      </div>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-3xl border border-dashed border-border bg-card/60 px-5 py-8 text-center text-sm text-muted">
      {children}
    </p>
  );
}

function Badges({ idea }: { idea: Idea }) {
  const pillar = PILLARS[idea.pillar];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${pillar.className}`}
      >
        {pillar.label}
      </span>
      <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {PERSONAS[idea.persona]}
      </span>
      {idea.series_part !== null && (
        <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-deep">
          Part {idea.series_part}
          {idea.city ? ` · ${idea.city}` : ""}
          {idea.country ? `, ${idea.country}` : ""}
        </span>
      )}
      {idea.series_part === null && idea.city && (
        <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-deep">
          {idea.city}
          {idea.country ? `, ${idea.country}` : ""}
        </span>
      )}
    </div>
  );
}

// Expandable script details — a native <details> keeps the whole card
// server-rendered (no client JS), matching the funnel page's approach.
function ScriptDetails({ idea }: { idea: Idea }) {
  const beats = idea.script?.beats ?? [];
  return (
    <details className="mt-3">
      <summary className="cursor-pointer select-none text-xs font-semibold text-accent">
        Script · {beats.length} beat{beats.length === 1 ? "" : "s"}
      </summary>
      <ol className="mt-2 space-y-2">
        {beats.map((beat, i) => (
          <li key={i} className="rounded-xl bg-bg p-3 text-xs">
            <span className="font-mono font-bold text-accent">{beat.t}</span>
            <p className="mt-1 font-semibold text-[#1A1A1A]">{beat.overlay}</p>
            <p className="mt-0.5 text-muted">B-roll: {beat.broll}</p>
          </li>
        ))}
      </ol>
      {(idea.caption || idea.hashtags || idea.engagement_question || idea.sound_hint) && (
        <dl className="mt-2 space-y-1.5 rounded-xl bg-bg p-3 text-xs">
          {idea.caption && <MetaRow label="Caption">{idea.caption}</MetaRow>}
          {idea.hashtags && <MetaRow label="Hashtags">{idea.hashtags}</MetaRow>}
          {idea.engagement_question && (
            <MetaRow label="Engagement">{idea.engagement_question}</MetaRow>
          )}
          {idea.sound_hint && <MetaRow label="Sound">{idea.sound_hint}</MetaRow>}
        </dl>
      )}
    </details>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="inline font-semibold uppercase tracking-wide text-[10px] text-muted/70">
        {label}:{" "}
      </dt>
      <dd className="inline text-muted">{children}</dd>
    </div>
  );
}

// ── Today: new ideas with Pick / Discard ──────────────────────────────────────

function TodayCard({ idea }: { idea: Idea }) {
  return (
    <article
      className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <Badges idea={idea} />
      <h3 className="mt-3 font-display text-xl font-bold leading-snug text-[#1A1A1A]">
        {idea.hook}
      </h3>
      {idea.why_now && (
        <p className="mt-2 text-xs leading-snug text-muted">
          <span className="font-bold uppercase tracking-wide text-[10px] text-teal">
            Why now
          </span>{" "}
          {idea.why_now}
        </p>
      )}
      <ScriptDetails idea={idea} />
      <form className="mt-auto flex gap-2 pt-4">
        <input type="hidden" name="id" value={idea.id} />
        <button
          formAction={pickIdea}
          className="flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-deep"
        >
          Pick
        </button>
        <button
          formAction={discardIdea}
          className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-bg"
        >
          Discard
        </button>
      </form>
    </article>
  );
}

// ── Pipeline: picked (waiting to shoot) and posted (log results) ──────────────

function PickedCard({ idea }: { idea: Idea }) {
  return (
    <article
      className="rounded-3xl border border-border bg-card p-5 shadow-sm"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Badges idea={idea} />
          <h3 className="mt-2 font-display text-lg font-bold leading-snug text-[#1A1A1A]">
            {idea.hook}
          </h3>
        </div>
        <form className="flex shrink-0 gap-2">
          <input type="hidden" name="id" value={idea.id} />
          <button
            formAction={markPosted}
            className="rounded-xl bg-teal px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-teal-deep"
          >
            Mark posted
          </button>
          <button
            formAction={discardIdea}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-bg"
          >
            Discard
          </button>
        </form>
      </div>
      <ScriptDetails idea={idea} />
    </article>
  );
}

function PostedCard({ idea, results }: { idea: Idea; results: ResultRow[] }) {
  return (
    <article
      className="rounded-3xl border border-border bg-card p-5 shadow-sm"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-deep">
          Posted
        </span>
        <Badges idea={idea} />
      </div>
      <h3 className="mt-2 font-display text-lg font-bold leading-snug text-[#1A1A1A]">
        {idea.hook}
      </h3>

      {/* Already-logged results */}
      {results.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {results.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-xl bg-bg px-3 py-2 text-xs"
            >
              <span className="font-bold text-[#1A1A1A]">{PLATFORMS[r.platform]}</span>
              <span className="text-muted/70">{fmtDay(r.posted_at)}</span>
              <span className="tabular-nums text-muted">
                {(r.views ?? 0).toLocaleString()} views
              </span>
              <span className="tabular-nums text-muted">
                {(r.saves ?? 0).toLocaleString()} saves
              </span>
              <span className="tabular-nums text-muted">
                {(r.comments ?? 0).toLocaleString()} comments
              </span>
              <span className="tabular-nums text-muted">
                {(r.profile_visits ?? 0).toLocaleString()} profile visits
              </span>
              {r.notes && <span className="w-full text-muted/70">{r.notes}</span>}
            </li>
          ))}
        </ul>
      )}

      {/* Compact inline results form, one submission per platform */}
      <form className="mt-3 flex flex-wrap items-end gap-2">
        <input type="hidden" name="idea_id" value={idea.id} />
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted/70">
          Platform
          <select
            name="platform"
            className="h-9 rounded-xl border border-border bg-card px-2 text-sm font-medium text-[#1A1A1A]"
          >
            <option value="reels">Reels</option>
            <option value="tiktok">TikTok</option>
          </select>
        </label>
        <NumberField name="views" label="Views" />
        <NumberField name="saves" label="Saves" />
        <NumberField name="comments" label="Comments" />
        <NumberField name="profile_visits" label="Profile visits" />
        <label className="flex min-w-32 flex-1 flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted/70">
          Notes
          <input
            type="text"
            name="notes"
            placeholder="Optional"
            className="h-9 rounded-xl border border-border bg-card px-2 text-sm text-[#1A1A1A] placeholder:text-muted/50"
          />
        </label>
        <button
          formAction={logResult}
          className="h-9 rounded-xl bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-accent-deep"
        >
          Log
        </button>
      </form>
    </article>
  );
}

function NumberField({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted/70">
      {label}
      <input
        type="number"
        name={name}
        min={0}
        placeholder="0"
        className="h-9 w-24 rounded-xl border border-border bg-card px-2 text-sm tabular-nums text-[#1A1A1A] placeholder:text-muted/50"
      />
    </label>
  );
}

// ── Stats: per-pillar save rate (reels only) ──────────────────────────────────

function StatsTable({
  stats,
}: {
  stats: Map<Pillar, { posts: number; views: number; saves: number }>;
}) {
  const rows = (Object.keys(PILLARS) as Pillar[])
    .map((pillar) => ({ pillar, ...(stats.get(pillar) ?? { posts: 0, views: 0, saves: 0 }) }))
    .filter((r) => r.posts > 0);

  return (
    <section
      className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
      style={{ boxShadow: CARD_SHADOW }}
    >
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          No Reels results logged yet — save rates will show up here once numbers
          come in.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wide text-muted/70">
                <th className="pb-2 pr-4 font-semibold">Pillar</th>
                <th className="pb-2 pr-4 text-right font-semibold">Posts</th>
                <th className="pb-2 pr-4 text-right font-semibold">Views</th>
                <th className="pb-2 pr-4 text-right font-semibold">Saves</th>
                <th className="pb-2 text-right font-semibold">Save rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.pillar} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 font-semibold text-[#1A1A1A]">
                    {PILLARS[r.pillar].label}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted">
                    {r.posts.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted">
                    {r.views.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-muted">
                    {r.saves.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right font-bold tabular-nums text-accent">
                    {fmtPct(r.views > 0 ? (r.saves / r.views) * 100 : null)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Inline SVG icons (VibeIcons.tsx pattern: { color, size }) ─────────────────

function SparkleIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
      <path d="M19 14l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 14z" opacity="0.65" />
    </svg>
  );
}

function ClapperIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10h16v8.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5V10z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 10l1-4.5 15 1.8-1 4.2" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 6.2l2 3.3M13 6.8l2 3.2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4v15a1 1 0 0 0 1 1h15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="8" y="12" width="3" height="5" rx="0.8" fill={color} />
      <rect x="13" y="8" width="3" height="9" rx="0.8" fill={color} opacity="0.75" />
      <rect x="18" y="5" width="3" height="12" rx="0.8" fill={color} opacity="0.5" />
    </svg>
  );
}
