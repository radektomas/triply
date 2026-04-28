import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { FeedbackButton } from "@/components/FeedbackButton";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://flytriply.eu"),
  title: {
    default: "Triply — €300? I'll find you a trip.",
    template: "%s | Triply",
  },
  description:
    "AI trip planner for European budget travel. Enter your budget, month, and nights — get 3 destinations with full itinerary and price breakdown.",
  keywords: [
    "AI trip planner",
    "budget travel Europe",
    "cheap trips Europe",
    "European destinations",
    "travel planning",
  ],
  authors: [{ name: "Triply" }],
  creator: "Triply",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://flytriply.eu",
    siteName: "Triply",
    title: "Triply — €300? I'll find you a trip.",
    description:
      "AI trip planner for European budget travel. Tell me your budget, I'll find you 3 destinations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Triply — €300? I'll find you a trip.",
    description: "AI trip planner for European budget travel.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://flytriply.eu",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-[#1A1A1A]">
        {children}
        <FeedbackButton />
        <Analytics />
      </body>
    </html>
  );
}
