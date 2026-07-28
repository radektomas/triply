import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Footer } from "@/components/landing/Footer";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { OAuthSignupTracker } from "@/components/analytics/OAuthSignupTracker";
import { Header } from "@/components/auth/Header";
import { GlobalChrome } from "@/components/shared/GlobalChrome";
import { getServerSupabase } from "@/lib/supabase/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Display font for hero + section headings. Variable axis so weights
// 400–800 are available through a single download.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-[#1A1A1A]">
        <AuthProvider initialUser={user}>
          <CurrencyProvider>
            <GlobalChrome>
              <Header />
            </GlobalChrome>
            <div className="flex-1">{children}</div>
            <GlobalChrome>
              <Footer />
            </GlobalChrome>
            <FeedbackButton />
            <AuthModal />
            <OAuthSignupTracker />
          </CurrencyProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
