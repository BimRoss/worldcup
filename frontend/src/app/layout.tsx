import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "./Analytics";
import { LanguageSelector } from "./LanguageSelector";
import { Ticker } from "./Ticker";
import { TrackedLink } from "./TrackedLink";
import { fetchNews } from "./news";

const SITE_URL = "https://worldcup.makeacompany.ai";
const SITE_TITLE = "World Cup 2026 Make YOUR Goal";
const SITE_DESCRIPTION =
  "Live FIFA 2026 scores, schedule, group standings, and the goal-of-the-tournament vote.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const news = await fetchNews().catch(() => []);
  return (
    <html lang="en">
      <body>
        <Analytics />
        <div className="w-full bg-white text-black border-b border-zinc-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <TrackedLink
              href="https://makeacompany.ai"
              target="_blank"
              rel="noopener"
              className="flex items-center hover:opacity-80 transition-opacity shrink-0"
              event="outbound_click"
              params={{ link_target: "makeacompany_header_logo" }}
              ariaLabel="makeacompany.ai"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://makeacompany.ai/logo-navbar-black.png"
                alt="makeacompany.ai"
                className="h-6 sm:h-7 w-auto shrink-0"
              />
            </TrackedLink>
            <div className="flex items-center gap-2 sm:gap-3">
              <TrackedLink
                href="https://makeacompany.ai"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center rounded-md bg-emerald-600 hover:bg-emerald-700 transition-colors text-white text-xs sm:text-sm font-semibold px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-sm whitespace-nowrap"
                event="outbound_click"
                params={{ link_target: "makeacompany_header_cta" }}
              >
                Make YOUR company →
              </TrackedLink>
              <LanguageSelector />
            </div>
          </div>
        </div>
        <Ticker items={news} />
        {children}
      </body>
    </html>
  );
}
