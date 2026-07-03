import {
  renderLayout,
  escapeHtml,
  ctaButton,
  para,
  heading,
} from "../layout";

export function renderResetPassword(actionUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const url = escapeHtml(actionUrl);
  const bodyHtml = `
    ${heading("Reset your password")}
    ${para(
      `Happens to the best of us. Use the button below to choose a new password and get back to your trips.`,
    )}
    ${ctaButton(url, "Choose a new password")}
    ${para(
      `If the button does not work, paste this link into your browser:<br><a href="${url}" style="color: #0D7377; word-break: break-all;">${url}</a>`,
      { muted: true, size: 12 },
    )}
    ${para(
      `If you did not ask to reset your password, ignore this email and your password stays as it is.`,
      { muted: true, size: 12 },
    )}`;

  return {
    subject: "Reset your Triply password",
    html: renderLayout({
      preheader: "Choose a new password and get back to your trips.",
      bodyHtml,
    }),
    text: [
      `Reset your password`,
      ``,
      `Use this link to choose a new password: ${actionUrl}`,
      ``,
      `If you did not ask for this, ignore this email and your password stays as it is.`,
    ].join("\n"),
  };
}
