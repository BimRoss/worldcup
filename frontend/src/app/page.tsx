import { matches, LA_VENUE, type Match } from "./schedule";
import { fetchScoreboard, type LiveMatch } from "./scores";

export const revalidate = 30;

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

function LiveCard({ m }: { m: LiveMatch }) {
  const isLive = m.state === "in";
  const isFinal = m.state === "post";
  const badge = isLive ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      LIVE · {m.shortDetail}
    </span>
  ) : isFinal ? (
    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
      FT
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
      {m.shortDetail}
    </span>
  );
  const scoreClass = isLive ? "text-white" : isFinal ? "text-zinc-300" : "text-zinc-600";
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        {badge}
        <span className="text-xs text-zinc-500 truncate">{m.venue}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{m.homeTeam}</span>
          <span className={`text-2xl font-bold tabular-nums ${scoreClass}`}>
            {m.homeScore ?? "–"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{m.awayTeam}</span>
          <span className={`text-2xl font-bold tabular-nums ${scoreClass}`}>
            {m.awayScore ?? "–"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const grouped = groupByDate(matches);
  const laCount = matches.filter((m) => m.venue === LA_VENUE).length;

  let scoreboard: LiveMatch[] = [];
  try {
    scoreboard = await fetchScoreboard(new Date());
  } catch {
    scoreboard = [];
  }
  scoreboard.sort((a, b) => {
    const order = { in: 0, pre: 1, post: 2 } as const;
    if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state];
    return a.kickoffUtc.localeCompare(b.kickoffUtc);
  });
  const hasLive = scoreboard.some((m) => m.state === "in");

  return (
    <main className="min-h-screen px-4 sm:px-6 py-10">
      <section className="max-w-3xl mx-auto text-center space-y-4 mb-10">
        <p className="text-xs uppercase tracking-widest text-emerald-400">
          FIFA 2026 — June 11 to July 19
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          World Cup 2026
        </h1>
        <p className="text-base sm:text-lg text-zinc-400">
          Live scores, the full 104-match schedule, with{" "}
          <span className="text-emerald-400">{laCount} matches in Los Angeles</span>{" "}
          highlighted.
        </p>
      </section>

      {scoreboard.length > 0 && (
        <section className="max-w-3xl mx-auto mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            {hasLive ? (
              <>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Live & Recent
              </>
            ) : (
              "Today"
            )}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {scoreboard.map((m) => (
              <LiveCard key={m.id} m={m} />
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            Scores refresh every 30 seconds. Source: ESPN.
          </p>
        </section>
      )}

      <section className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Full Schedule
        </h2>
        {grouped.map(([date, dayMatches]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-2 mb-3">
              {formatDate(date)}
            </h3>
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
