import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getTravelerProfile } from "@/lib/data/getTravelerProfile";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = {
  title: "Make Triply yours",
  description:
    "Tell Triply where you've been, what you love and when you're free — and get your first personalized trip picks.",
  robots: { index: false, follow: false },
};

// The wizard doubles as the editor: a user who already completed it lands
// here from the profile page with every step pre-filled.
export default async function OnboardingPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Sign-in is a global modal; the home page opens it from ?signin=1 and
    // the auth callback honours ?next= to bring the user straight back.
    redirect("/?signin=1&next=%2Fonboarding");
  }

  const profile = await getTravelerProfile(supabase);
  const firstName =
    ((user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      (user.user_metadata?.display_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "there")
      .trim()
      .split(" ")[0];

  return (
    <OnboardingFlow
      firstName={firstName}
      initial={
        profile ?? {
          prefs: { vibes: [], budgetEur: 500, homeAirport: null, homeCity: null, travelParty: 1 },
          places: [],
          windows: [],
          completedAt: null,
        }
      }
    />
  );
}
