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
          <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center sm:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://makeacompany.ai/logo-navbar-black.png"
              alt="makeacompany.ai"
              className="h-8 w-auto shrink-0"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-base sm:text-lg font-bold leading-tight">
                Make YOUR Goal. Make a Company in less than 45 minutes.
              </span>
              <span className="text-xs sm:text-sm text-zinc-600">
                Join your two{" "}
                <span className="text-emerald-600 font-semibold">WINGERS</span>{" "}
                right now (Ross &amp; Joanne).{" "}
                <span className="text-emerald-600 font-semibold">
                  Only 5 free spots left.
                </span>
              </span>
            </div>
          </div>
        </a>
        {children}
      </body>
    </html>
  );
}
