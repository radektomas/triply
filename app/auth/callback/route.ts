import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Backfill a profiles row for the freshly-authenticated user. Safe to
      // call repeatedly thanks to upsert on primary key.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
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
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.warn("[auth/callback] exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
