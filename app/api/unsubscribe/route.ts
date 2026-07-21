import { NextResponse, type NextRequest } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribeToken";
import { recordUnsubscribe } from "@/lib/email/suppression";

// RFC 8058 one-click unsubscribe endpoint. This is the URL that goes in the
// List-Unsubscribe header of marketing email; Gmail/Yahoo/Outlook POST to it
// directly when the user hits their client's built-in "Unsubscribe" button,
// with no page ever rendered.
//
// Identity comes solely from the HMAC-signed `?t=` token — mail clients send
// this request from their own infrastructure with no cookies, so there is no
// session to read. The signature is what makes that safe.
//
// RFC 8058 requires a 2xx on success and that the unsubscribe take effect
// without any further user interaction. It also requires the endpoint tolerate
// being called more than once; recordUnsubscribe is idempotent.

export const dynamic = "force-dynamic";

async function applyUnsubscribe(token: string | null): Promise<NextResponse> {
  const userId = token ? verifyUnsubscribeToken(token) : null;
  if (!userId) {
    return NextResponse.json(
      { error: "invalid_token" },
      { status: 400 },
    );
  }

  const result = await recordUnsubscribe(userId);
  if (!result.ok) {
    if (result.reason === "not_found") {
      // Signature is valid but the profile is gone (deleted account). The
      // desired end state — this address receives no marketing — already
      // holds, so report success rather than making the client retry.
      return NextResponse.json({ ok: true, status: "no_profile" });
    }
    return NextResponse.json({ error: "unsubscribe_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: result.alreadyUnsubscribed ? "already_unsubscribed" : "unsubscribed",
  });
}

/** One-click POST from the mail client (List-Unsubscribe-Post). */
export async function POST(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("t");
  return applyUnsubscribe(token);
}

/**
 * Some clients (and users pasting the header URL) issue a GET instead. A GET
 * must NOT unsubscribe anyone — link scanners fetch every URL in a message —
 * so this only hands off to the confirmation page, which asks the user to
 * press a button. Nothing is mutated on this path.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe", url.origin));
  }
  return NextResponse.redirect(
    new URL(`/unsubscribe?t=${encodeURIComponent(token)}`, url.origin),
  );
}
