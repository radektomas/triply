import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/emails/layout";

// Signed, login-free unsubscribe tokens.
//
// An unsubscribe link lands in an inbox and must work without a session, so the
// URL itself has to carry the identity. A bare user id would let anyone
// unsubscribe anyone (and enumerate accounts), so the id travels inside an
// opaque, HMAC-signed token instead:
//
//   <base64url(userId)>.<base64url(HMAC-SHA256(secret, "unsubscribe.v1:" + userId))>
//
// The id is recoverable from the token by design — the route needs an O(1)
// lookup, and it is the recipient's OWN id in the recipient's OWN mail. What
// the signature buys is integrity: the token cannot be forged or edited to
// point at a different account without the server-side secret.
//
// The SCOPE prefix domain-separates the MAC so a signature minted here can
// never be replayed against a different HMAC feature added later on the same
// secret.

const SCOPE = "unsubscribe.v1";

/** UUID v4 shape — the only payload we ever accept back out of a token. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Signing secret. Prefers a dedicated UNSUBSCRIBE_SECRET; falls back to
 * TRIPLY_EMAIL_SECRET so the flow works on existing deployments without a new
 * env var. Returns null when neither is set — callers must fail closed rather
 * than sign with a default.
 */
function getSecret(): string | null {
  return (
    process.env.UNSUBSCRIBE_SECRET?.trim() ||
    process.env.TRIPLY_EMAIL_SECRET?.trim() ||
    null
  );
}

function mac(secret: string, userId: string): string {
  return createHmac("sha256", secret)
    .update(`${SCOPE}:${userId}`)
    .digest("base64url");
}

/**
 * Mint an unsubscribe token for a user id. Returns null when no secret is
 * configured — the caller should then omit the unsubscribe link entirely
 * rather than ship a broken one (which is the bug this module exists to fix).
 */
export function signUnsubscribeToken(userId: string): string | null {
  const secret = getSecret();
  if (!secret || !UUID_RE.test(userId)) return null;
  const payload = Buffer.from(userId, "utf8").toString("base64url");
  return `${payload}.${mac(secret, userId)}`;
}

/**
 * Verify a token and return the user id it authenticates, or null if the token
 * is malformed, unsigned, or tampered with. Constant-time signature compare.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  const secret = getSecret();
  if (!secret || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  let userId: string;
  try {
    userId = Buffer.from(parts[0], "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!UUID_RE.test(userId)) return null;

  const expected = Buffer.from(mac(secret, userId), "utf8");
  const provided = Buffer.from(parts[1], "utf8");
  // timingSafeEqual throws on length mismatch, so length-check first. Length is
  // a fixed property of base64url-encoded SHA-256, not a secret.
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? userId : null;
}

/**
 * Human-facing unsubscribe URL — the link rendered in the email footer. Opens
 * a page that records the unsubscribe and confirms it.
 */
export function buildUnsubscribeUrl(userId: string): string | null {
  const token = signUnsubscribeToken(userId);
  return token
    ? `${SITE_URL}/unsubscribe?t=${encodeURIComponent(token)}`
    : null;
}

/**
 * RFC 8058 one-click endpoint — the URL that goes in the List-Unsubscribe
 * header. Mail clients POST to it directly; it renders nothing.
 */
export function buildOneClickUnsubscribeUrl(userId: string): string | null {
  const token = signUnsubscribeToken(userId);
  return token
    ? `${SITE_URL}/api/unsubscribe?t=${encodeURIComponent(token)}`
    : null;
}
