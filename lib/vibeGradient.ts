// Vibe → background-gradient mapping shared between DayPlans (free-form
// model-generated vibe strings) and QuickPicks (fixed vibe enum values).
//
// Free-form callers like DayPlans pass strings such as "Hiking & adventure" or
// "Romantic mountain day" — substring matching handles those. Fixed-enum
// callers like QuickPickCard pass exact codes like "hidden_gem" or
// "underrated" — the same substring matcher catches those via dedicated
// branches added at the bottom of the cascade.
//
// Ordering matters: the first matching branch wins. Branches with the most
// specific tokens come first; the most generic ("default warm peach") last.

const GRADIENTS = {
  peach: "linear-gradient(135deg, #FFF4E8 0%, #FFE4CC 100%)",
  mint: "linear-gradient(135deg, #E8F4F0 0%, #D4E9DD 100%)",
  rose: "linear-gradient(135deg, #FCE8F3 0%, #F5D7E5 100%)",
  cream: "linear-gradient(135deg, #FFF8E1 0%, #FFE8B0 100%)",
  purple: "linear-gradient(135deg, #E8E4F8 0%, #D4CCED 100%)",
  blue: "linear-gradient(135deg, #E4EEF8 0%, #CCDDED 100%)",
  aqua: "linear-gradient(135deg, #D7EEF4 0%, #B4DCE6 100%)",
  emerald: "linear-gradient(135deg, #E0F2E9 0%, #BFE5CC 100%)",
  gold: "linear-gradient(135deg, #FFF8DC 0%, #FFE9A8 100%)",
  coral: "linear-gradient(135deg, #FFEDD9 0%, #FFD8A8 100%)",
  violet: "linear-gradient(135deg, #E6E0F2 0%, #D0C4E8 100%)",
  default: "linear-gradient(135deg, #FFF5EC 0%, #FFE4D0 100%)",
} as const;

export function getVibeGradient(vibe: string | null | undefined): string {
  const v = (vibe ?? "").toLowerCase();

  // Outdoorsy / active
  if (
    v.includes("hik") ||
    v.includes("adventur") ||
    v.includes("natur") ||
    v.includes("mountain") ||
    v.includes("outdoor")
  ) {
    return GRADIENTS.peach;
  }
  // Spa / wellness / chill
  if (
    v.includes("spa") ||
    v.includes("relax") ||
    v.includes("wellness") ||
    v.includes("chill") ||
    v.includes("cozy")
  ) {
    return GRADIENTS.mint;
  }
  // Romance
  if (v.includes("romant") || v.includes("couples")) {
    return GRADIENTS.rose;
  }
  // Food
  if (v.includes("food") || v.includes("foodie") || v.includes("culinary")) {
    return GRADIENTS.cream;
  }
  // Nightlife / party
  if (v.includes("nightlife") || v.includes("party") || v.includes("bars")) {
    return GRADIENTS.purple;
  }
  // City / culture
  if (
    v.includes("explorer") ||
    v.includes("culture") ||
    v.includes("history") ||
    v.includes("city") ||
    v.includes("art")
  ) {
    return GRADIENTS.blue;
  }
  // Beach (added for QuickPicks beach vibe + free-form "beach" strings)
  if (v.includes("beach") || v.includes("coast") || v.includes("shore")) {
    return GRADIENTS.aqua;
  }
  // Hidden gems — match "gem" so "hidden_gem" / "hidden gem" / "gem" all hit
  if (v.includes("gem")) {
    return GRADIENTS.emerald;
  }
  // Budget / value
  if (v.includes("budget") || v.includes("cheap") || v.includes("value")) {
    return GRADIENTS.gold;
  }
  // Family / group
  if (v.includes("family") || v.includes("kids")) {
    return GRADIENTS.coral;
  }
  // Underrated / sleeper picks
  if (v.includes("underrated") || v.includes("sleeper")) {
    return GRADIENTS.violet;
  }

  return GRADIENTS.default;
}
