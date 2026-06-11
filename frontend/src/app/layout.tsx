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
          className="block w-full bg-emerald-500 text-zinc-950 text-center text-sm font-medium py-2 px-4 hover:bg-emerald-400 transition-colors"
        >
          Built on Make A Company → makeacompany.ai
        </a>
        {children}
      </body>
    </html>
  );
}
