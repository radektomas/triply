import type { Metadata } from "next";
import { InvestContent } from "@/components/invest/InvestContent";

// Link-only investor one-pager — never indexed. Czech is the default
// language in the served HTML; ?lang=en flips it client-side.
export const metadata: Metadata = {
  title: "Investiční nabídka",
  description:
    "Triply — investiční nabídka. Podklad k jednání, není závaznou nabídkou.",
  robots: { index: false, follow: false },
};

export default function InvestPage() {
  return <InvestContent />;
}
