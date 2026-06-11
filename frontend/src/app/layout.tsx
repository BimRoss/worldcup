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
          className="block w-full bg-white text-black border-b border-zinc-200 hover:bg-zinc-50 transition-colors"
        >
          <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center sm:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://makeacompany.ai/logo-navbar-black.png"
              alt="makeacompany.ai"
              className="h-8 w-auto shrink-0"
            />
            <span className="text-base sm:text-lg font-bold leading-tight">
              Make YOUR GOAL, Make YOUR COMPANY.
            </span>
          </div>
        </a>
        <a
          href="https://makeacompany.ai"
          target="_blank"
          rel="noopener"
          className="block w-full bg-emerald-600 text-white border-b border-emerald-700 hover:bg-emerald-500 transition-colors"
        >
          <div className="max-w-3xl mx-auto px-4 py-1.5 text-center text-xs sm:text-sm">
            Join today, only a few{" "}
            <span className="font-bold">FREE spots</span> left. Get to work with{" "}
            <span className="font-bold">Ross &amp; Joanne</span>, your two AI{" "}
            <span className="font-bold">WINGERS</span>.
          </div>
        </a>
        {children}
      </body>
    </html>
  );
}
