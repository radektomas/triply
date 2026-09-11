import {
  renderLayout,
  escapeHtml,
  ctaButton,
  ticketCard,
  para,
  heading,
  SITE_URL,
  BRAND,
} from "./layout";

export interface SavedDestinationData {
  name?: string;
  destinationName: string;
}

export function renderSavedDestination(data: SavedDestinationData): {
  subject: string;
  html: string;
  text: string;
} {
  const name = escapeHtml((data.name ?? "").trim() || "traveler");
  const destination = escapeHtml(data.destinationName.trim());
  const cta = `${SITE_URL}/profile?utm_source=email&utm_medium=transactional&utm_campaign=saved_destination`;

  const bodyHtml = `
    ${heading(`${destination} is on your watchlist.`)}
    ${para(
      `Good eye, ${name}. We tucked <strong>${destination}</strong> into your watchlist with the full plan attached: the budget breakdown, the places worth your time, and the booking links.`,
    )}
    ${ticketCard(
      "Watchlist &middot; price alerts on",
      `<span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: ${BRAND.ink};">${destination}</span>
       ${para(`When a good price shows up for it in one of your free windows, you get one email. Mute it any time from your dashboard.`, { muted: true, size: 13 })}`,
    )}
    ${para(
      `No rush. Plans keep. But if you find yourself daydreaming at your desk, you know where it lives.`,
    )}
    ${ctaButton(cta, "View my watchlist")}`;

  return {
    subject: `${data.destinationName.trim()} is on your Triply watchlist`,
    html: renderLayout({
      unsubscribe: false,
      preheader: `${data.destinationName.trim()} is on your watchlist — we'll email you when the price is right.`,
      bodyHtml,
    }),
    text: [
      `${data.destinationName.trim()} is on your watchlist.`,
      ``,
      `Good eye, ${data.name?.trim() || "traveler"}. We tucked ${data.destinationName.trim()} into your watchlist with the full plan attached: the budget breakdown, the places worth your time, and the booking links. When a good price shows up for it in one of your free windows, you get one email.`,
      ``,
      `View your watchlist: ${cta}`,
    ].join("\n"),
  };
}
