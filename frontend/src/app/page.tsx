import { matches, LA_VENUE, type Match } from "./schedule";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function groupByDate(list: Match[]): [string, Match[]][] {
  const map = new Map<string, Match[]>();
  for (const m of list) {
    const arr = map.get(m.date) ?? [];
    arr.push(m);
    map.set(m.date, arr);
  }
  return Array.from(map.entries()).map(([date, ms]) => [
    date,
    ms.slice().sort((a, b) => a.n - b.n),
  ]);
}

export default function Home() {
  const grouped = groupByDate(matches);
  const laCount = matches.filter((m) => m.venue === LA_VENUE).length;

  return (
    <main className="min-h-screen px-4 sm:px-6 py-10">
      <section className="max-w-3xl mx-auto text-center space-y-4 mb-12">
        <p className="text-xs uppercase tracking-widest text-emerald-400">
          FIFA 2026 — June 11 to July 19
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          World Cup Schedule
        </h1>
        <p className="text-base sm:text-lg text-zinc-400">
          All 104 matches across the US, Canada, and Mexico.
          {" "}
          <span className="text-emerald-400">
            {laCount} are in Los Angeles
          </span>
          , highlighted below.
        </p>
      </section>

      <section className="max-w-3xl mx-auto space-y-8">
        {grouped.map(([date, dayMatches]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-2 mb-3">
              {formatDate(date)}
            </h2>
            <ul className="space-y-2">
              {dayMatches.map((m) => {
                const isLA = m.venue === LA_VENUE;
                return (
                  <li
                    key={m.n}
                    className={
                      "rounded-lg px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 " +
                      (isLA
                        ? "bg-emerald-500/10 border border-emerald-500/40"
                        : "bg-zinc-900/60 border border-zinc-800")
                    }
                  >
                    <span className="text-xs font-mono text-zinc-500 w-10 shrink-0">
                      #{m.n}
                    </span>
                    <span className="text-sm font-mono text-zinc-300 w-24 shrink-0 tabular-nums">
                      {m.kickoff} {m.tz}
                    </span>
                    <span className="flex-1 min-w-[12rem] font-medium">
                      {m.team1}
                      <span className="text-zinc-500 mx-2">vs</span>
                      {m.team2}
                    </span>
                    <span
                      className={
                        "text-xs " +
                        (isLA ? "text-emerald-300" : "text-zinc-500")
                      }
                    >
                      {m.venue} · {m.stage}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <footer className="max-w-3xl mx-auto text-center text-xs text-zinc-600 mt-12">
        Times shown in venue-local. LA matches at SoFi Stadium.
      </footer>
    </main>
  );
}
