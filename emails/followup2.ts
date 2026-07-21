import {
  renderLayout,
  escapeHtml,
  ctaButton,
  ticketCard,
  para,
  heading,
  SITE_URL,
} from "./layout";

export interface Followup2Data {
  name?: string;
  destinationName: string;
}

// Second followup (7 days after saving, per /api/cron/followups): the last soft touch. Different angle from followup_1
// (which was about flight timing): this one is about how little planning is
// actually left, then we go quiet.
export function renderFollowup2(data: Followup2Data): {
  subject: string;
  html: string;
  text: string;
} {
  const name = escapeHtml((data.name ?? "").trim() || "traveler");
  const destination = escapeHtml(data.destinationName.trim());
  const cta = `${SITE_URL}/profile?utm_source=email&utm_medium=transactional&utm_campaign=followup_2`;

  const bodyHtml = `
    ${heading(`${destination} does not need more research.`)}
    ${para(
      `Hi ${name}. The usual reason a trip stays a someday trip is the planning wall: too many tabs, too many maybes. That part is already done here.`,
    )}
    ${ticketCard(
      "Ready when you are",
      para(
        `Your ${destination} plan already covers the budget, where to stay, what is worth seeing and where to book. What is left is the fun part: picking the dates.`,
        { size: 14 },
      ),
    )}
    ${para(
      `This is our last note about it, promise. The plan stays saved either way.`,
      { muted: true, size: 14 },
    )}
    ${ctaButton(cta, "Take one more look")}`;

  return {
    subject: `${data.destinationName.trim()} is fully planned. Only the dates are missing.`,
    html: renderLayout({
      unsubscribe: true,
      preheader:
        "The research is done. This is our last nudge, the plan stays saved either way.",
      bodyHtml,
    }),
    text: [
      `${data.destinationName.trim()} does not need more research.`,
      ``,
      `Hi ${data.name?.trim() || "traveler"}. The usual reason a trip stays a someday trip is the planning wall. That part is already done here: budget, stays, sights and booking links are all in your saved plan.`,
      ``,
      `This is our last note about it, promise. The plan stays saved either way.`,
      ``,
      `Take one more look: ${cta}`,
    ].join("\n"),
  };
}
