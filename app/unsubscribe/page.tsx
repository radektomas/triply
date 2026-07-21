import type { Metadata } from "next";
import Link from "next/link";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribeToken";
import { unsubscribeAction } from "./actions";

// Human-facing unsubscribe page, reached from the footer link in marketing
// email. Deliberately session-free: the link is opened straight from an inbox,
// often on a device that has never signed in, so identity comes from the
// HMAC-signed token in `?t=` and nothing else.
//
// This GET is PURE — it validates the token and renders, but changes nothing.
// Corporate mail gateways and link-preview scanners routinely fetch every URL
// in a message; a mutating GET would unsubscribe those recipients without them
// ever seeing the page. The opt-out happens only when the user presses the
// button, which POSTs through ./actions.ts.
//
// The RFC 8058 endpoint (app/api/unsubscribe) is the intentional exception —
// there, POST-to-unsubscribe with no confirmation is exactly what the spec
// requires of a mail client's built-in button.
//
// Auth email (sign-in links, password resets, email changes) is transactional
// and is NOT affected by this page — see emails/classification.ts.

export const metadata: Metadata = {
  title: "Email preferences",
  description: "Manage the emails Triply sends you.",
  // Never index a page whose whole meaning lives in a per-recipient token.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Post-action outcomes, carried in `?state=` after the redirect. */
type ResultState = "done" | "already" | "invalid" | "error";

const RESULT_COPY: Record<ResultState, { title: string; body: string }> = {
  done: {
    title: "You're unsubscribed.",
    body: "We won't send you any more trip reminders or suggestions. You'll still get essential account emails — sign-in links, password resets and confirmations — because those are needed to use your account.",
  },
  already: {
    title: "You're already unsubscribed.",
    body: "There's nothing left to do — you're not on the marketing list. You'll still get essential account emails such as sign-in links and password resets.",
  },
  invalid: {
    title: "This link isn't valid.",
    body: "The unsubscribe link looks incomplete or has been altered in transit — some mail clients truncate long links. Open the original email and try again, or email hello@flytriply.eu and we'll take you off the list by hand.",
  },
  error: {
    title: "Something went wrong.",
    body: "We couldn't record your preference just now. Please try the link again in a minute, or email hello@flytriply.eu and we'll unsubscribe you manually.",
  },
};

function isResultState(v: string | undefined): v is ResultState {
  return v === "done" || v === "already" || v === "invalid" || v === "error";
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; state?: string }>;
}) {
  const { t, state } = await searchParams;

  // ── Result view: rendered after the action redirects back here ─────────────
  if (isResultState(state)) {
    const { title, body } = RESULT_COPY[state];
    const succeeded = state === "done" || state === "already";
    return (
      <Shell title={title} body={body}>
        {succeeded && (
          <p className="text-sm text-muted leading-relaxed mb-8">
            Changed your mind? You can opt back in any time by emailing{" "}
            <MailLink />.
          </p>
        )}
      </Shell>
    );
  }

  // ── Confirm view: pure read, no state change ───────────────────────────────
  const userId = t ? verifyUnsubscribeToken(t) : null;
  if (!userId) {
    const { title, body } = RESULT_COPY.invalid;
    return <Shell title={title} body={body} />;
  }

  return (
    <Shell
      title="Unsubscribe from trip emails?"
      body="Confirm below and we'll stop sending trip reminders and suggestions. You'll still get essential account emails — sign-in links, password resets and confirmations — because those are needed to use your account."
    >
      <form action={unsubscribeAction} className="mb-8">
        <input type="hidden" name="token" value={t} />
        <button
          type="submit"
          className="px-5 py-3 rounded-full bg-accent text-white font-semibold text-sm hover:bg-accent-deep transition-colors cursor-pointer"
        >
          Yes, unsubscribe me
        </button>
      </form>
    </Shell>
  );
}

function MailLink() {
  return (
    <a
      href="mailto:hello@flytriply.eu"
      className="text-accent hover:underline underline-offset-2"
    >
      hello@flytriply.eu
    </a>
  );
}

function Shell({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="max-w-xl mx-auto px-6 py-20 md:py-28">
      <p className="font-mono text-[11px] font-medium uppercase text-accent tracking-[0.18em] mb-3">
        Email preferences
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-4">
        {title}
      </h1>
      <p className="text-[#1a1a1a]/80 leading-relaxed mb-8">{body}</p>

      {children}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Link
          href="/"
          className="text-accent hover:underline underline-offset-2 font-medium"
        >
          Back to Triply
        </Link>
        <Link
          href="/privacy"
          className="text-muted hover:text-[#1a1a1a] transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </main>
  );
}
