"use server";

import { redirect } from "next/navigation";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribeToken";
import { recordUnsubscribe } from "@/lib/email/suppression";

// The mutating half of the unsubscribe page. Split out as a server action so
// the page's GET stays a pure read: mail scanners and link prefetchers issue
// GETs, and a GET that unsubscribed people would silently opt out anyone whose
// provider inspects links. Only this POST changes state.
//
// The RFC 8058 endpoint (app/api/unsubscribe) is the deliberate exception — it
// is specified to mutate on POST from the mail client, with no page involved.

export async function unsubscribeAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const userId = token ? verifyUnsubscribeToken(token) : null;

  if (!userId) {
    redirect("/unsubscribe?state=invalid");
  }

  const result = await recordUnsubscribe(userId);

  let state: string;
  if (result.ok) {
    state = result.alreadyUnsubscribed ? "already" : "done";
  } else {
    // A valid signature for a profile that no longer exists (deleted account)
    // is functionally "already unsubscribed" — there is nobody left to mail.
    state = result.reason === "not_found" ? "already" : "error";
  }

  // Redirect rather than returning state: it drops the token from the URL bar
  // once it has been used, and makes a browser reload of the result page a
  // plain GET instead of a form re-submission.
  redirect(`/unsubscribe?state=${state}`);
}
