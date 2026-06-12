import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "./Analytics";
import { LanguageSelector } from "./LanguageSelector";
import { Ticker } from "./Ticker";
import { TrackedLink } from "./TrackedLink";
import { fetchNews } from "./news";

export const metadata: Metadata = {
  title: "World Cup 2026 Make YOUR Goal",
  description: "Live FIFA 2026 scores, schedule, group standings, and the goal-of-the-tournament vote.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const news = await fetchNews().catch(() => []);
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content="180" />
      </head>
      <body>
        <Analytics />
        <div className="w-full bg-white text-black border-b border-zinc-200">
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <TrackedLink
              href="https://makeacompany.ai"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              event="outbound_click"
              params={{ link_target: "makeacompany_header" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://makeacompany.ai/logo-navbar-black.png"
                alt="makeacompany.ai"
                className="h-6 sm:h-7 w-auto shrink-0"
              />
              <span className="text-xs sm:text-sm font-semibold text-emerald-700 hidden sm:inline">
                makeacompany.ai →
              </span>
            </TrackedLink>
            <LanguageSelector />
          </div>
        </div>
        <Ticker items={news} />
        {children}
      </body>
    </html>
  );
}
