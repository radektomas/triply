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
    ${heading(`${destination} is saved.`)}
    ${para(
      `Good eye, ${name}. We tucked <strong>${destination}</strong> into your profile, with the full plan attached: the budget breakdown, the places worth your time, and the booking links.`,
    )}
    ${ticketCard(
      "Saved &middot; destination stub",
      `<span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: ${BRAND.ink};">${destination}</span>
       ${para(`Waiting in your saved trips whenever you are ready.`, { muted: true, size: 13 })}`,
    )}
    ${para(
      `No rush. Plans keep. But if you find yourself daydreaming at your desk, you know where it lives.`,
    )}
    ${ctaButton(cta, "View my saved trips")}`;

  return {
    subject: `${data.destinationName.trim()} is saved to your Triply`,
    html: renderLayout({
      preheader: `The full plan for ${data.destinationName.trim()} is waiting in your profile.`,
      bodyHtml,
    }),
    text: [
      `${data.destinationName.trim()} is saved.`,
      ``,
      `Good eye, ${data.name?.trim() || "traveler"}. We tucked ${data.destinationName.trim()} into your profile, with the full plan attached: the budget breakdown, the places worth your time, and the booking links.`,
      ``,
      `View your saved trips: ${cta}`,
    ].join("\n"),
  };
}
