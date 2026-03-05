import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { CookieConsentBanner } from "@/components/consent/cookie-consent-banner";
import { ConsentedVercelAnalytics } from "@/components/consent/consented-vercel-analytics";
import { ConsentedAnalyticsEvents } from "@/components/consent/consented-analytics-events";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SimuVaction Commons",
  description: "Interactive diplomatic simulation platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${lora.variable}`}>
      <body className="flex min-h-screen flex-col font-sans text-ink antialiased selection:bg-blue-200 selection:text-blue-900">
        <div className="flex-1">{children}</div>
        <CookieConsentBanner />
        <ConsentedAnalyticsEvents />
        <footer className="border-t border-ink-border/80 px-4 py-3 text-center text-xs text-ink/60 md:px-6">
          Design and created by Olivier Cloutier
        </footer>
        <ConsentedVercelAnalytics />
      </body>
    </html>
  );
}
