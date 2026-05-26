const PARTNER_ID = process.env.NEXT_PUBLIC_GYG_PARTNER_ID;

// Returns a GetYourGuide search URL. While the partner ID is empty or the
// placeholder "PENDING", we render a clean (unaffiliated) search URL so the
// links work visually; once the real partner_id is dropped into the env, all
// existing links auto-activate affiliate tracking with no code change.
export function buildGygUrl(query: string): string {
  const base = `https://www.getyourguide.com/s/?q=${encodeURIComponent(query)}`;
  if (!PARTNER_ID || PARTNER_ID === "PENDING") return base;
  return `${base}&partner_id=${encodeURIComponent(PARTNER_ID)}`;
}

export function isGygAffiliateActive(): boolean {
  return Boolean(PARTNER_ID && PARTNER_ID !== "PENDING");
}
