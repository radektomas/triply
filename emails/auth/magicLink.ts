import {
  renderLayout,
  escapeHtml,
  ctaButton,
  ticketCard,
  para,
  heading,
} from "../layout";

export function renderMagicLink(actionUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const url = escapeHtml(actionUrl);
  const bodyHtml = `
    ${heading("Your sign-in link")}
    ${para(`No password needed. This link signs you straight into Triply.`)}
    ${ticketCard(
      "Fast lane &middot; one use only",
      para(
        `This link works once and expires shortly, so use it while it is warm.`,
        { size: 14 },
      ),
    )}
    ${ctaButton(url, "Sign me in")}
    ${para(
      `If the button does not work, paste this link into your browser:<br><a href="${url}" style="color: #0D7377; word-break: break-all;">${url}</a>`,
      { muted: true, size: 12 },
    )}
    ${para(
      `If you did not request this link, you can safely ignore this email.`,
      { muted: true, size: 12 },
    )}`;

  return {
    subject: "Your Triply sign-in link",
    html: renderLayout({
      preheader: "No password needed. This link signs you straight in.",
      bodyHtml,
    }),
    text: [
      `Your sign-in link`,
      ``,
      `Sign in: ${actionUrl}`,
      ``,
      `The link works once and expires shortly. If you did not request it, ignore this email.`,
    ].join("\n"),
  };
}
