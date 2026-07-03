import {
  renderLayout,
  escapeHtml,
  ctaButton,
  ticketCard,
  para,
  heading,
  SITE_URL,
} from "./layout";

export interface WelcomeData {
  name?: string;
}

export function renderWelcome(data: WelcomeData): {
  subject: string;
  html: string;
  text: string;
} {
  const name = escapeHtml((data.name ?? "").trim() || "traveler");
  const cta = `${SITE_URL}/?utm_source=email&utm_medium=transactional&utm_campaign=welcome`;

  const bodyHtml = `
    ${heading(`Welcome aboard, ${name}.`)}
    ${para(
      `Triply exists for one simple reason: a real trip should not take twenty browser tabs to plan. You tell us your budget, your dates and the mood you are after, and we hand you three destinations with honest numbers: flights, beds, food, the lot.`,
    )}
    ${ticketCard(
      "Boarding pass &middot; seat 1A",
      para(
        `Your first trip is ready to be generated. Pick a budget, even a small one. Some of the best weekends we have planned started under &euro;300.`,
        { size: 14 },
      ),
    )}
    ${ctaButton(cta, "Plan my first trip")}
    ${para(
      `See you out there,<br>the Triply crew`,
      { muted: true, size: 14 },
    )}`;

  return {
    subject: "Welcome to Triply. Your next trip starts here.",
    html: renderLayout({
      preheader:
        "Budget, dates, mood. We turn them into three real trips with honest numbers.",
      bodyHtml,
    }),
    text: [
      `Welcome aboard, ${data.name?.trim() || "traveler"}.`,
      ``,
      `Triply exists for one simple reason: a real trip should not take twenty browser tabs to plan. Tell us your budget, your dates and the mood you are after, and we hand you three destinations with honest numbers.`,
      ``,
      `Plan your first trip: ${cta}`,
      ``,
      `See you out there,`,
      `the Triply crew`,
    ].join("\n"),
  };
}
