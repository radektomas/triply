// Template registry for POST /api/email. Each renderer takes the caller's
// `data` payload and returns { subject, html, text }.

import { renderWelcome, type WelcomeData } from "./welcome";
import {
  renderSavedDestination,
  type SavedDestinationData,
} from "./savedDestination";
import { renderFollowup1, type Followup1Data } from "./followup1";
import { renderFollowup2, type Followup2Data } from "./followup2";

export type EmailTemplate =
  | "welcome"
  | "saved_destination"
  | "followup_1"
  | "followup_2";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Render a template with its data. Throws with a descriptive message when a
 * required field is missing so the API route can 400 instead of sending a
 * broken email.
 */
export function renderEmail(
  template: EmailTemplate,
  data: Record<string, unknown>,
): RenderedEmail {
  const name = typeof data.name === "string" ? data.name : undefined;
  const destinationName =
    typeof data.destinationName === "string" ? data.destinationName.trim() : "";

  const requireDestination = (): string => {
    if (!destinationName) {
      throw new Error(
        `template "${template}" requires data.destinationName (non-empty string)`,
      );
    }
    return destinationName;
  };

  switch (template) {
    case "welcome":
      return renderWelcome({ name } satisfies WelcomeData);
    case "saved_destination":
      return renderSavedDestination({
        name,
        destinationName: requireDestination(),
      } satisfies SavedDestinationData);
    case "followup_1":
      return renderFollowup1({
        name,
        destinationName: requireDestination(),
      } satisfies Followup1Data);
    case "followup_2":
      return renderFollowup2({
        name,
        destinationName: requireDestination(),
      } satisfies Followup2Data);
  }
}

export const EMAIL_TEMPLATES: readonly EmailTemplate[] = [
  "welcome",
  "saved_destination",
  "followup_1",
  "followup_2",
] as const;
