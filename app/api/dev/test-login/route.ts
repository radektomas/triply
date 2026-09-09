import { NextResponse, type NextRequest } from "next/server";
import { supabase as admin } from "@/lib/supabase";
import { getServerSupabase } from "@/lib/supabase/server";
import { VISITED_PHOTOS_BUCKET } from "@/lib/traveler";
import {
  TEST_USER_EMAIL,
  TEST_USER_NAME,
  isTestLoginAllowed,
} from "@/lib/devTestLogin";

// GET /api/dev/test-login[?reset=1]
//
// Signs the browser in as the shared tester account and lands on /onboarding.
// `reset=1` first wipes the tester's traveler profile (vibes, budget, places,
// photos, windows, completion flag) so the wizard runs as a brand-new user.
//
// Mechanism: the service-role client mints a magic-link token for the tester,
// and the cookie-bound client verifies it immediately — same primitive the
// real email flow uses in /auth/callback, minus the email. Nothing is sent.
// Non-production only; see lib/devTestLogin.ts.

async function ensureTester(): Promise<string> {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    email_confirm: true,
    user_metadata: { full_name: TEST_USER_NAME, display_name: TEST_USER_NAME },
  });
  if (created?.user) return created.user.id;
  if (createErr && !/already|exists|registered/i.test(createErr.message)) {
    throw new Error(`createUser: ${createErr.message}`);
  }
  // Already exists — look it up. The tester is one of very few accounts with
  // this exact email, so a single page is plenty.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw new Error(`listUsers: ${listErr.message}`);
  const found = list.users.find((u) => u.email?.toLowerCase() === TEST_USER_EMAIL);
  if (!found) throw new Error("tester account not found after create");
  return found.id;
}

async function resetTester(userId: string) {
  const { data: objects } = await admin.storage
    .from(VISITED_PHOTOS_BUCKET)
    .list(userId, { limit: 1000 });
  const paths = (objects ?? []).map((o) => `${userId}/${o.name}`);
  if (paths.length > 0) {
    await admin.storage.from(VISITED_PHOTOS_BUCKET).remove(paths);
  }
  await admin.from("visited_places").delete().eq("user_id", userId);
  await admin.from("travel_windows").delete().eq("user_id", userId);
  await admin.from("saved_destinations").delete().eq("user_id", userId);
  await admin.from("generation_history").delete().eq("user_id", userId);
  await admin
    .from("profiles")
    .update({
      vibes: [],
      travel_budget_eur: null,
      home_airport: null,
      home_city: null,
      travel_party: null,
      onboarding_completed_at: null,
      generations_today: 0,
      display_name: TEST_USER_NAME,
    })
    .eq("id", userId);
}

export async function GET(request: NextRequest) {
  if (!isTestLoginAllowed()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { searchParams, origin } = new URL(request.url);
  const reset = searchParams.get("reset") === "1";

  try {
    const userId = await ensureTester();
    if (reset) await resetTester(userId);

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: TEST_USER_EMAIL,
    });
    if (linkErr || !link?.properties?.hashed_token) {
      throw new Error(`generateLink: ${linkErr?.message ?? "no token"}`);
    }

    const userClient = await getServerSupabase();
    const { error: verifyErr } = await userClient.auth.verifyOtp({
      type: "magiclink",
      token_hash: link.properties.hashed_token,
    });
    if (verifyErr) throw new Error(`verifyOtp: ${verifyErr.message}`);

    return NextResponse.redirect(new URL("/onboarding", origin));
  } catch (err) {
    console.error("[dev/test-login] failed:", err);
    return new NextResponse(
      `Test login failed: ${err instanceof Error ? err.message : String(err)}`,
      { status: 500 },
    );
  }
}
