import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Triply collects, uses, and protects your data. GDPR-compliant privacy policy for our AI trip planner.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "May 7, 2026";

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 md:py-20">
      <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-3">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted mb-12">Last updated: {LAST_UPDATED}</p>

      <Section title="Who we are">
        <p>
          Triply (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is an AI trip planner that
          turns a budget and a few preferences into 3 destination
          recommendations. We operate flytriply.eu from the European Union.
        </p>
        <p>
          Questions about this policy? Email{" "}
          <a href="mailto:hello@flytriply.eu" className="text-accent hover:underline underline-offset-2">
            hello@flytriply.eu
          </a>
          .
        </p>
      </Section>

      <Section title="What we collect">
        <p>To recommend trips, we collect what you tell us in the trip form:</p>
        <Bullets>
          <li>Budget (per person, in EUR)</li>
          <li>Origin city or airport</li>
          <li>Travel dates and number of travelers</li>
          <li>Vibe / trip style preferences</li>
          <li>Optional destination preferences (region or specific city)</li>
        </Bullets>
        <p>If you submit feedback, we store the message you wrote and any contact details you choose to include.</p>
        <p>
          Like most websites we also collect standard server logs (IP address, user agent, request timestamp) and anonymous traffic
          statistics from Vercel Analytics. We do not use third-party advertising trackers.
        </p>
      </Section>

      <Section title="Why we collect it">
        <Bullets>
          <li><strong className="text-[#1a1a1a]">To generate your trip.</strong> Form inputs are sent to our AI pipeline and are required for the service to work.</li>
          <li><strong className="text-[#1a1a1a]">To improve the product.</strong> Aggregate analytics help us see which features are useful and which are not.</li>
          <li><strong className="text-[#1a1a1a]">To respond to feedback.</strong> If you write to us, we read it and may reply.</li>
        </Bullets>
      </Section>

      <Section title="Legal basis (GDPR)">
        <Bullets>
          <li><strong className="text-[#1a1a1a]">Performance of a contract</strong> (Art. 6(1)(b)) — when you submit the trip form, processing your inputs is necessary to deliver the recommendations you asked for.</li>
          <li><strong className="text-[#1a1a1a]">Legitimate interests</strong> (Art. 6(1)(f)) — anonymous analytics, server logs, and abuse-prevention rate limits.</li>
          <li><strong className="text-[#1a1a1a]">Consent</strong> (Art. 6(1)(a)) — if we ever introduce optional newsletters or marketing, we will ask first.</li>
        </Bullets>
      </Section>

      <Section title="Third-party processors">
        <p>We work with the following processors. Each handles only the data necessary for its role:</p>
        <Bullets>
          <li><strong className="text-[#1a1a1a]">Vercel</strong> — hosting, edge delivery, server logs, anonymous traffic analytics.</li>
          <li><strong className="text-[#1a1a1a]">Supabase</strong> — database for trip records and a cross-user cache that lets us reuse trip results for identical inputs.</li>
          <li><strong className="text-[#1a1a1a]">n8n cloud</strong> — workflow automation that orchestrates trip generation between our app and the AI model.</li>
          <li><strong className="text-[#1a1a1a]">OpenAI</strong> — large language model (GPT-class) that drafts the destination shortlist and itinerary.</li>
          <li><strong className="text-[#1a1a1a]">Pexels</strong> — destination photography (image lookups only; no personal data sent).</li>
          <li><strong className="text-[#1a1a1a]">Booking.com</strong> (and its affiliate network Awin) — partner links for hotel reservations. When you click through, Booking.com may set its own cookies under its own policy.</li>
        </Bullets>
      </Section>

      <Section title="Data retention">
        <Bullets>
          <li><strong className="text-[#1a1a1a]">Trip records</strong> are kept for up to 30 days, then deleted. Cached trips (used to speed up identical re-queries) follow the same window.</li>
          <li><strong className="text-[#1a1a1a]">Server logs</strong> are retained for up to 90 days for security and debugging.</li>
          <li><strong className="text-[#1a1a1a]">Feedback messages</strong> are kept until the issue is resolved, then deleted unless we need them as a reference.</li>
        </Bullets>
      </Section>

      <Section title="Your rights">
        <p>Under the GDPR you have the right to:</p>
        <Bullets>
          <li>access the personal data we hold about you;</li>
          <li>correct inaccuracies;</li>
          <li>request deletion (&ldquo;right to be forgotten&rdquo;);</li>
          <li>receive your data in a portable format;</li>
          <li>object to processing based on legitimate interests;</li>
          <li>withdraw consent at any time, where consent is the basis.</li>
        </Bullets>
        <p>
          To exercise any of these, email{" "}
          <a href="mailto:hello@flytriply.eu" className="text-accent hover:underline underline-offset-2">
            hello@flytriply.eu
          </a>
          . You may also lodge a complaint with the Czech data protection authority,{" "}
          <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline underline-offset-2">
            Úřad pro ochranu osobních údajů (ÚOOÚ)
          </a>
          .
        </p>
      </Section>

      <Section title="Cookies and tracking">
        <p>
          We use Vercel Analytics for anonymous, privacy-friendly traffic measurement — no cross-site tracking, no advertising
          identifiers. Outbound links to Booking.com and other partners may set cookies on those destination sites, governed by
          their own policies.
        </p>
      </Section>

      <Section title="International transfers">
        <p>
          OpenAI processes data in the United States. Transfers rely on the European Commission&rsquo;s Standard Contractual Clauses
          plus additional safeguards offered by OpenAI&rsquo;s data-processing addendum. Other processors are EU-based or transfer under
          equivalent safeguards.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update this policy from time to time. Material changes will be highlighted on the website. The &ldquo;Last
          updated&rdquo; date at the top reflects the latest revision.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For privacy questions or to exercise your rights, email{" "}
          <a href="mailto:hello@flytriply.eu" className="text-accent hover:underline underline-offset-2">
            hello@flytriply.eu
          </a>
          .
        </p>
        <p className="text-sm text-muted mt-8">
          Looking for the rules of using the service? See our{" "}
          <Link href="/terms" className="text-accent hover:underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">{title}</h2>
      <div className="space-y-4 text-[#1a1a1a]/80 leading-relaxed">{children}</div>
    </section>
  );
}

function Bullets({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 space-y-1.5">{children}</ul>;
}
