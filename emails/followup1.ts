import {
  renderLayout,
  escapeHtml,
  ctaButton,
  ticketCard,
  para,
  heading,
  SITE_URL,
} from "./layout";

export interface Followup1Data {
  name?: string;
  destinationName: string;
}

// Day +1 after saving: gentle, helpful angle (booking-window tip), not salesy.
export function renderFollowup1(data: Followup1Data): {
  subject: string;
  html: string;
  text: string;
} {
  const name = escapeHtml((data.name ?? "").trim() || "traveler");
  const destination = escapeHtml(data.destinationName.trim());
  const cta = `${SITE_URL}/profile?utm_source=email&utm_medium=transactional&utm_campaign=followup_1`;

  const bodyHtml = `
    ${heading(`Still thinking about ${destination}?`)}
    ${para(
      `Hey ${name}, no pressure, just a nudge from someone who looks at flight prices all day.`,
    )}
    ${ticketCard(
      "Traveler tip &middot; timing",
      para(
        `Flights are usually cheapest 6 to 8 weeks before departure, and midweek departures often shave another 15 percent off. If ${destination} is a maybe, checking prices early costs nothing and locks in the good numbers.`,
        { size: 14 },
      ),
    )}
    ${para(
      `Your saved plan still has the full budget breakdown and booking links, exactly where you left them.`,
    )}
    ${ctaButton(cta, `Open my ${destination} plan`)}`;

  return {
    subject: `Still thinking about ${data.destinationName.trim()}?`,
    html: renderLayout({
      preheader:
        "A quick timing tip: the cheap flights window is closer than you think.",
      bodyHtml,
    }),
    text: [
      `Still thinking about ${data.destinationName.trim()}?`,
      ``,
      `Hey ${data.name?.trim() || "traveler"}, no pressure, just a nudge from someone who looks at flight prices all day.`,
      ``,
      `Traveler tip: flights are usually cheapest 6 to 8 weeks before departure, and midweek departures often shave another 15 percent off.`,
      ``,
      `Open your plan: ${cta}`,
    ].join("\n"),
  };
}
