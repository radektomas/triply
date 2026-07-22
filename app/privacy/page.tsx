import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPage,
  Section,
  Bullets,
  Term,
  LegalTable,
} from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What data Triply collects, why, who processes it, and how long it is kept. Written to match what the code actually does.",
  alternates: {
    canonical: "/privacy",
    languages: { en: "/privacy", cs: "/cs/privacy" },
  },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "22 July 2026";

// Controller is a natural person, not a company.
const CONTROLLER = "Radek Tomas";

// Processor regions, as reported by each provider's dashboard. Written as
// user-facing prose rather than provider region codes (Supabase reports
// eu-west-3, which is Paris). Keep the Czech copy in app/cs/privacy in step.
const REGION_SUPABASE = "European Union (Paris)";
const REGION_VERCEL = "United States (Washington, D.C.)";
const REGION_N8N = "European Union";

export default function PrivacyPage() {
  return (
    <LegalPage
      lang="en"
      title="Privacy Policy"
      lastUpdatedLabel="Last updated:"
      lastUpdated={LAST_UPDATED}
      enHref="/privacy"
      csHref="/cs/privacy"
    >
      <Section title="Who is responsible for your data">
        <p>
          Triply (flytriply.eu) is run by <Term>{CONTROLLER}</Term>, an individual based in the
          Czech Republic. This is not a company — there is no registered entity and no company
          number. {CONTROLLER} is the data controller for everything described here.
        </p>
        <p>
          For anything in this policy, including exercising your rights, email{" "}
          <a href="mailto:hello@flytriply.eu" className="text-accent hover:underline underline-offset-2">
            hello@flytriply.eu
          </a>
          .
        </p>
      </Section>

      <Section title="What Triply does, in one paragraph">
        <p>
          You enter a budget, dates, an origin city and a few preferences. We send those to a
          language model, which suggests three destinations with an itinerary and a cost breakdown.
          Every price shown is the model&rsquo;s estimate — we do not query any flight, hotel or
          activity pricing service. Prices are marked with a ≈ symbol throughout the interface for
          that reason.
        </p>
      </Section>

      <Section title="What we collect">
        <p>
          <Term>When you use the trip planner, without an account:</Term>
        </p>
        <Bullets>
          <li>
            Budget, travel dates, number of travellers, origin city, trip style, and an optional
            destination preference.
          </li>
          <li>
            If you choose driving instead of flying: your departure city and maximum driving time.
          </li>
        </Bullets>

        <p>
          <Term>When you create an account:</Term>
        </p>
        <Bullets>
          <li>
            We use Supabase Auth. You can sign up with Google or with an email address and password.
          </li>
          <li>
            If you use Google, we receive your email address, name and profile picture URL from your
            Google profile. We copy the picture URL into our database and load the image from
            Google&rsquo;s servers — we do not store a copy of the image itself.
          </li>
          <li>
            We store: your user ID, email address, display name, profile picture URL, account
            creation date, your daily trip-generation counter, whether you opted in to marketing
            email, and whether you have unsubscribed.
          </li>
          <li>
            Your password, if you use one, is stored and verified by Supabase. We never see it.
          </li>
        </Bullets>

        <p>
          <Term>As you use your account:</Term>
        </p>
        <Bullets>
          <li>Destinations you save, including the trip they came from.</li>
          <li>A history of the trips you generate.</li>
        </Bullets>

        <p>
          <Term>Analytics:</Term>
        </p>
        <Bullets>
          <li>
            We record which steps of the product you reach: landing page viewed, trip form started,
            trip generated, destination chosen, trip detail viewed, affiliate link clicked, account
            created, email captured.
          </li>
          <li>
            Each event is tagged with <code className="text-[13px]">triply_session_id</code>, a
            random identifier stored in your browser that does not expire.{" "}
            <Term>This is not anonymous.</Term> It is a persistent pseudonymous identifier, and when
            you create an account we link every event previously recorded under that identifier to
            your account. If you want to break that link, clear your browser storage before signing
            up.
          </li>
          <li>
            We also use Vercel Analytics for aggregate traffic measurement. It sets no cookies and
            does not track you across other websites.
          </li>
        </Bullets>

        <p>
          <Term>If you send feedback:</Term> whatever you write, plus your email address if you
          choose to provide one. This is sent to our automation service for us to read and reply to.
        </p>

        <p>
          <Term>Server logs:</Term> our host, Vercel, records standard request logs including IP
          address, user agent and timestamp. These are retained under Vercel&rsquo;s own retention
          policy, which we do not control and therefore do not state a period for here.
        </p>
      </Section>

      <Section title="Why we are allowed to process it — legal bases">
        <Bullets>
          <li>
            <Term>Performance of a contract, Art. 6(1)(b).</Term> Your trip form inputs, your
            account, your saved destinations and your trip history. Without these the service cannot
            function.
          </li>
          <li>
            <Term>Consent, Art. 6(1)(a).</Term> Marketing email only. Nothing else relies on
            consent, and you can withdraw it at any time.
          </li>
          <li>
            <Term>Legitimate interests, Art. 6(1)(f).</Term> Product analytics, server logs, and the
            rate limits that stop the trip generator being abused. Our interest is in understanding
            whether the product works and keeping it running. You can object at any time using the
            contact address above.
          </li>
        </Bullets>
      </Section>

      <Section title="Email">
        <p>There are two kinds, and they are treated differently.</p>

        <p>
          <Term>
            Service email — you cannot opt out of this, because you need it to use your account:
          </Term>
        </p>
        <Bullets>
          <li>A welcome message when you sign up.</li>
          <li>A confirmation when you save a destination.</li>
          <li>
            Authentication mail: email confirmation, password reset, sign-in links, and email-change
            confirmation.
          </li>
        </Bullets>

        <p>
          <Term>Marketing email — opt-in only:</Term>
        </p>
        <Bullets>
          <li>Two reminders after you save a destination, sent one day and seven days later.</li>
          <li>
            We only send these if you ticked the marketing checkbox when signing up. It is unchecked
            by default. If you did not tick it, you will never receive them.
          </li>
          <li>
            Every marketing email contains a working unsubscribe link, unique to you and
            cryptographically signed. It also supports your mail client&rsquo;s built-in unsubscribe
            button. Unsubscribing stops marketing email immediately and permanently; service email
            continues.
          </li>
        </Bullets>

        <p>Email is delivered by Resend, in the United States.</p>
      </Section>

      <Section title="Cookies and browser storage">
        <p>
          Under the ePrivacy rules, <code className="text-[13px]">localStorage</code> and{" "}
          <code className="text-[13px]">sessionStorage</code> are treated the same as cookies.
          Everything we store on your device is listed here.
        </p>

        <p>
          <Term>Cookies:</Term>
        </p>
        <LegalTable
          headers={["Name", "Purpose", "Expiry", "Type"]}
          rows={[
            [
              <code key="c1" className="text-[13px]">
                sb-&lt;project-ref&gt;-auth-token
              </code>,
              "Keeps you signed in",
              "400 days",
              "Strictly necessary",
            ],
            [
              <code key="c2" className="text-[13px]">
                sb-&lt;project-ref&gt;-auth-token-code-verifier
              </code>,
              "Completes the secure sign-in exchange",
              "Transient, deleted on completion",
              "Strictly necessary",
            ],
          ]}
        />

        <p>
          <Term>localStorage:</Term>
        </p>
        <LegalTable
          headers={["Name", "Purpose", "Expiry"]}
          rows={[
            [
              <code key="l1" className="text-[13px]">
                triply_session_id
              </code>,
              "Analytics identifier (see above)",
              "Never expires",
            ],
            [
              "Anonymous generation counter",
              "Enforces the free daily trip limit when signed out",
              "Persistent",
            ],
            ["Waitlist flag", "Remembers you already joined, so we stop asking", "Persistent"],
            ["Selected currency", "Your currency preference", "Persistent"],
            ["Exchange-rate cache", "Avoids re-fetching rates", "24 hours"],
          ]}
        />

        <p>
          <Term>sessionStorage:</Term> a flag that records the landing page view once per browser
          session.
        </p>
        <p>
          We use no advertising cookies, no cross-site tracking, and no third-party tracking
          scripts.
        </p>
      </Section>

      <Section title="Who else processes your data">
        <LegalTable
          headers={["Processor", "What it handles", "Location"]}
          rows={[
            ["Vercel", "Hosting, server logs, aggregate analytics", REGION_VERCEL],
            ["Supabase", "Database and authentication", REGION_SUPABASE],
            ["OpenAI", "The language model that writes the recommendations", "United States"],
            ["Resend", "Sending email", "United States"],
            ["n8n", "Automation connecting our app to the model", REGION_N8N],
            ["Google", "Sign-in identity, if you use Google", "US / global"],
            [
              "Pexels, Unsplash",
              "Destination photography (no personal data sent)",
              "United States",
            ],
            [
              "photon.komoot.io",
              <>
                City autocomplete — <Term>receives the city names you type</Term>
              </>,
              "EU",
            ],
            [
              "open.er-api.com",
              "Exchange rates (no personal data sent)",
              "Location not established",
            ],
          ]}
        />
        <p>
          Where a processor handles your data outside the European Economic Area, the transfer
          relies on the European Commission&rsquo;s Standard Contractual Clauses and — where the
          provider is certified under it — the EU&ndash;US Data Privacy Framework, together with the
          provider&rsquo;s own data-processing terms.
        </p>
      </Section>

      <Section title="Affiliate links">
        <p>
          Some outbound links earn us a commission. This never changes what you pay, and the
          language model has no knowledge of which partners pay us — it cannot be influenced by
          them.
        </p>
        <Bullets>
          <li>
            <Term>Booking.com</Term>, through the affiliate network{" "}
            <Term>CJ (Commission Junction)</Term>. Clicking through takes you via a CJ tracking
            link, which records the click and forwards you to Booking.com. CJ and Booking.com set
            their own cookies under their own policies.
          </li>
          <li>
            <Term>GetYourGuide</Term> links currently carry <Term>no</Term> affiliate tracking and
            earn us nothing. If that changes, this page will be updated first.
          </li>
        </Bullets>
      </Section>

      <Section title="How long we keep things">
        <LegalTable
          headers={["Data", "Retention"]}
          rows={[
            [
              "Generated trips (shared cache, no user attached)",
              "30 days, then automatically deleted",
            ],
            ["Analytics events", "90 days, then automatically deleted"],
            [
              "Your profile, saved destinations, trip history",
              "For as long as your account exists",
            ],
          ]}
        />
        <p>
          Both automatic deletions run as scheduled jobs. We do not state a retention period for
          anything we do not actually delete on a schedule.
        </p>
        <p>
          Feedback you send is forwarded to our automation service, n8n, and is never stored in our
          own database. Its retention is therefore governed by n8n rather than by us.
        </p>
      </Section>

      <Section title="Deleting your account">
        <p>
          Go to your profile page and use &ldquo;Delete account&rdquo;. You will be asked to type
          DELETE to confirm. This immediately and permanently removes your profile, your saved
          destinations, your trip history, your analytics events, and your login itself.
        </p>
        <p>
          One thing is deliberately left behind: the shared cache of generated trips. Those records
          contain only trip parameters — budget, dates, city names — with no user ID, no email and
          no identifier of any kind, and they are shared across everyone using Triply. They expire
          on their own within 30 days.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask us to give you a copy of your data, correct it, delete it, export it in a
          portable format, restrict how we use it, or object to processing based on legitimate
          interests. Where we rely on consent, you can withdraw it at any time. Email{" "}
          <a href="mailto:hello@flytriply.eu" className="text-accent hover:underline underline-offset-2">
            hello@flytriply.eu
          </a>{" "}
          — there is no form and no process, just write to us.
        </p>
        <p>
          If you think we have handled your data badly, you can complain to the Czech supervisory
          authority: <Term>Úřad pro ochranu osobních údajů</Term>, Pplk. Sochora 27, 170 00 Praha 7,{" "}
          <a
            href="https://www.uoou.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline underline-offset-2"
          >
            uoou.cz
          </a>
          .
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes materially, we will say so on the site. The date at the top always
          reflects the current version.
        </p>
        <p className="text-sm text-muted mt-8">
          Looking for the rules of using the service? See our{" "}
          <Link href="/terms" className="text-accent hover:underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
