import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";

// A brand-new OAuth user has their account created and signed in within the
// same code exchange, so created_at and last_sign_in_at land within a few
// seconds of each other. A returning login has last_sign_in_at well after
// created_at. 30s is comfortably above the intra-exchange gap and far below any
// realistic return visit, so it reliably separates the two.
const NEW_ACCOUNT_WINDOW_MS = 30_000;

function isFreshSignup(user: {
  created_at?: string;
  last_sign_in_at?: string | null;
}): boolean {
  const created = user.created_at ? Date.parse(user.created_at) : NaN;
  const lastSignIn = user.last_sign_in_at
    ? Date.parse(user.last_sign_in_at)
    : NaN;
  if (Number.isNaN(created)) return false;
  // No prior sign-in recorded → unambiguously new.
  if (Number.isNaN(lastSignIn)) return true;
  return Math.abs(lastSignIn - created) < NEW_ACCOUNT_WINDOW_MS;
}

// Email links (signup confirmation, magic-link, recovery, invite, email change)
// arrive with `token_hash` + `type` and are completed via verifyOtp — NOT the
// PKCE `?code=` flow used by OAuth. We accept the standard EmailOtpType set so
// those links establish a session instead of dead-ending on "check your inbox".
// Unlike `?code=` (which needs the browser-local code_verifier), verifyOtp also
// works when the email is opened on a different device than signup.
const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "email",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const nextParam = searchParams.get("next") ?? "/";
  // `next` is always an app-relative path (set by our own redirectTo). Guard
  // against absolute / protocol-relative values so the flagged redirect below
  // can't be turned into an open redirect.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const supabase = await getServerSupabase();

  // Establish a session via whichever variant this callback received:
  //   1. ?code=           → PKCE exchange (OAuth / Google; same-device email).
  //   2. token_hash+type  → verifyOtp (email confirmation / magic-link / etc.).
  // `method` only labels the fresh-signup redirect flag consumed client-side.
  let authed = false;
  let method: "google" | "email" = "google";
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.warn("[auth/callback] code exchange failed:", error.message);
    } else {
      authed = true;
    }
  } else if (
    tokenHash &&
    typeParam &&
    ALLOWED_OTP_TYPES.has(typeParam as EmailOtpType)
  ) {
    method = "email";
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) {
      console.warn("[auth/callback] verifyOtp failed:", error.message);
    } else {
      authed = true;
    }
  }

  if (authed) {
    // Backfill a profiles row for the freshly-authenticated user. Safe to
    // call repeatedly thanks to upsert on primary key.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let freshSignup = false;
    if (user) {
      // A signup/invite email confirmation completing IS the account
      // activation, so treat it as a fresh signup regardless of the
      // created_at↔last_sign_in_at window — users often confirm minutes/hours
      // after signing up, which the 30s heuristic would otherwise miss (and the
      // funnel would lose the email cohort). OAuth still uses the heuristic.
      const isNewEmailAccount =
        method === "email" && (typeParam === "signup" || typeParam === "invite");
      freshSignup = isNewEmailAccount || isFreshSignup(user);
      const displayName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        (user.user_metadata?.display_name as string | undefined) ??
        user.email ??
        "Traveler";
      const avatar =
        (user.user_metadata?.avatar_url as string | undefined) ?? null;
      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email ?? null,
            display_name: displayName,
            avatar_url: avatar,
          },
          { onConflict: "id" },
        );
    }
    // For a genuinely new account, flag the redirect so the client can fire
    // account_created + the identity backfill on landing (the session id
    // lives in client localStorage, unreachable here). Returning logins get
    // the plain redirect. Building against origin keeps it same-site.
    const redirectUrl = new URL(next, origin);
    if (freshSignup) redirectUrl.searchParams.set("triply_new", method);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
