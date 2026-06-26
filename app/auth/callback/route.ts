import { NextResponse, type NextRequest } from "next/server";
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

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  // `next` is always an app-relative path (set by our own redirectTo). Guard
  // against absolute / protocol-relative values so the flagged redirect below
  // can't be turned into an open redirect.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Backfill a profiles row for the freshly-authenticated user. Safe to
      // call repeatedly thanks to upsert on primary key.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let freshSignup = false;
      if (user) {
        freshSignup = isFreshSignup(user);
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
      if (freshSignup) redirectUrl.searchParams.set("triply_new", "google");
      return NextResponse.redirect(redirectUrl);
    }
    console.warn("[auth/callback] exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
