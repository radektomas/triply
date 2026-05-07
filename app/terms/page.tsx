import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The rules for using Triply — what we provide, what we do not, and what to expect when you book through our partner links.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "May 7, 2026";

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 md:py-20">
      <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-3">
        Terms of Service
      </h1>
      <p className="text-sm text-muted mb-12">Last updated: {LAST_UPDATED}</p>

      <Section title="About Triply">
        <p>
          Triply is an AI trip planner. You tell us a budget and a few preferences; we use a large language model to draft 3
          destination ideas with a sample itinerary and budget breakdown. Recommendations are <strong className="text-[#1a1a1a]">suggestions</strong>, not
          guarantees. Prices, availability, and travel conditions change all the time — verify the details before you book.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          We do our best, but the service is provided &ldquo;as is&rdquo;. We do not warrant that:
        </p>
        <Bullets>
          <li>destination prices match what booking sites show at the moment you click through;</li>
          <li>flights, hotels, or activities will be available on the dates we suggest;</li>
          <li>the AI&rsquo;s recommendations are exhaustive, optimal, or free of errors.</li>
        </Bullets>
        <p>Treat our output as a starting point, then check the real-time options on the booking sites we link to.</p>
      </Section>

      <Section title="Booking happens elsewhere">
        <p>
          Triply is not a travel agency, tour operator, or seller of travel services. When you book a flight, hotel, or activity,
          you do so directly with the third-party provider (Booking.com, GetYourGuide, airlines, hotels, etc.). The contract for
          that booking is between you and that provider, and is governed by their terms.
        </p>
      </Section>

      <Section title="Affiliate disclosure">
        <p>
          Some outbound links — particularly hotel links to Booking.com — are <strong className="text-[#1a1a1a]">affiliate links</strong>.
          If you book after clicking one, Triply may earn a small commission from the partner. <strong className="text-[#1a1a1a]">This does not change the price you pay.</strong>
        </p>
        <p>
          Affiliate revenue is what keeps Triply free. It does not influence which destinations the AI recommends — the model has
          no knowledge of which partners pay commission.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>You agree not to:</p>
        <Bullets>
          <li>scrape the site or automate requests beyond reasonable personal use;</li>
          <li>abuse the trip-generation endpoint (we rate-limit and may block IPs that flood it);</li>
          <li>attempt to reverse-engineer, probe, or exploit the API or AI pipeline;</li>
          <li>use the service to generate content that violates law or third-party rights.</li>
        </Bullets>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, Triply is not liable for:
        </p>
        <Bullets>
          <li>price changes, sold-out inventory, or availability differences between our suggestion and the booking site at click-through;</li>
          <li>travel disruptions (delays, cancellations, weather, strikes, force majeure);</li>
          <li>disputes, refunds, or service quality issues with third-party providers;</li>
          <li>indirect, incidental, or consequential damages arising from use of the service.</li>
        </Bullets>
        <p>
          Nothing in these terms limits liability for fraud, gross negligence, or anything else that cannot lawfully be excluded
          under EU consumer law.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these terms from time to time. Material changes will be highlighted on the website; the &ldquo;Last
          updated&rdquo; date at the top reflects the latest revision. Continued use after changes means you accept the new terms.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These terms are governed by the laws of the Czech Republic. Disputes that cannot be resolved by email will be brought
          before the competent Czech courts, without prejudice to mandatory consumer-protection rules of your country of residence.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms? Email{" "}
          <a href="mailto:hello@flytriply.eu" className="text-accent hover:underline underline-offset-2">
            hello@flytriply.eu
          </a>
          .
        </p>
        <p className="text-sm text-muted mt-8">
          For how we handle your data, see our{" "}
          <Link href="/privacy" className="text-accent hover:underline underline-offset-2">
            Privacy Policy
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
