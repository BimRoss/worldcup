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
      <body>
        <a
          href="https://makeacompany.ai"
          target="_blank"
          rel="noopener"
          className="flex items-center justify-center gap-3 w-full bg-white text-black py-3 px-4 border-b border-zinc-200 hover:bg-zinc-50 transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://makeacompany.ai/logo-navbar-black.png"
            alt="makeacompany.ai"
            className="h-5 w-auto"
          />
          <span className="text-sm text-zinc-600">
            Built with{" "}
            <span className="text-black font-medium">makeacompany.ai</span>
          </span>
        </a>
        {children}
      </body>
    </html>
  );
}
