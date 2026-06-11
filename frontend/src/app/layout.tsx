import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup 2026 Pickem",
  description: "Pick the FIFA 2026 winners and chase the leaderboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content="180" />
      </head>
      <body>
        <a
          href="https://makeacompany.ai"
          target="_blank"
          rel="noopener"
          className="block w-full bg-white text-black border-b border-zinc-200 hover:bg-zinc-50 transition-colors"
        >
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://makeacompany.ai/logo-navbar-black.png"
              alt="makeacompany.ai"
              className="h-6 sm:h-7 w-auto shrink-0"
            />
            <span className="text-xs sm:text-sm font-semibold text-emerald-700">
              makeacompany.ai →
            </span>
          </div>
        </a>
        {children}
      </body>
    </html>
  );
}
