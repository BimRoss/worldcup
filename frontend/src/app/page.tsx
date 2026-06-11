import { matches, type Match } from "./schedule";
import { fetchScoreboard, pairKey, type LiveMatch } from "./scores";
import { ScheduleList } from "./ScheduleList";
import { fetchStandings, type Group } from "./standings";

export const revalidate = 30;

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

function GroupCard({ group }: { group: Group }) {
  const top2 = 2;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/80 text-xs font-semibold uppercase tracking-wider text-zinc-300">
        {group.name}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-zinc-500 text-[10px] uppercase tracking-wider">
            <th className="text-left font-medium px-3 py-1.5 w-6">#</th>
            <th className="text-left font-medium px-1 py-1.5">Team</th>
            <th className="text-right font-medium px-1 py-1.5 w-6">P</th>
            <th className="text-right font-medium px-1 py-1.5 w-6">W</th>
            <th className="text-right font-medium px-1 py-1.5 w-6">D</th>
            <th className="text-right font-medium px-1 py-1.5 w-6">L</th>
            <th className="text-right font-medium px-1 py-1.5 w-8">GD</th>
            <th className="text-right font-medium px-3 py-1.5 w-8">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.entries.map((e, i) => {
            const advancing = i < top2;
            return (
              <tr
                key={e.team}
                className={
                  "border-t border-zinc-800/60 " +
                  (advancing ? "bg-emerald-500/[0.04]" : "")
                }
              >
                <td className="px-3 py-1.5 text-zinc-500 tabular-nums">
                  {advancing && (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 align-middle" />
                  )}
                  {i + 1}
                </td>
                <td className="px-1 py-1.5 truncate text-zinc-200 max-w-[10rem]">
                  {e.team}
                </td>
                <td className="px-1 py-1.5 text-right text-zinc-400 tabular-nums">
                  {e.played}
                </td>
                <td className="px-1 py-1.5 text-right text-zinc-400 tabular-nums">
                  {e.wins}
                </td>
                <td className="px-1 py-1.5 text-right text-zinc-400 tabular-nums">
                  {e.draws}
                </td>
                <td className="px-1 py-1.5 text-right text-zinc-400 tabular-nums">
                  {e.losses}
                </td>
                <td className="px-1 py-1.5 text-right text-zinc-400 tabular-nums">
                  {e.goalDiff > 0 ? `+${e.goalDiff}` : e.goalDiff}
                </td>
                <td className="px-3 py-1.5 text-right font-semibold text-zinc-100 tabular-nums">
                  {e.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function Home() {
  const grouped = groupByDate(matches);
  const venues = Array.from(new Set(matches.map((m) => m.venue))).sort();

  const [scoreboard, standings] = await Promise.all([
    fetchScoreboard(new Date()).catch((): LiveMatch[] => []),
    fetchStandings().catch((): Group[] => []),
  ]);
  const scoreMap: Record<string, LiveMatch> = {};
  for (const s of scoreboard) {
    const key = pairKey(s.homeTeam, s.awayTeam);
    for (const m of matches) {
      if (pairKey(m.team1, m.team2) === key && m.date === s.date) {
        scoreMap[`${m.team1}|${m.team2}`] = s;
        break;
      }
    }
  }
  const recent = scoreboard.filter((m) => m.state !== "pre");
  recent.sort((a, b) => {
    const order = { in: 0, pre: 1, post: 2 } as const;
    if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state];
    return a.kickoffUtc.localeCompare(b.kickoffUtc);
  });
  const hasLive = recent.some((m) => m.state === "in");

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
          Live scores and the full 104-match schedule. Pick a host city to
          highlight its matches.
        </p>
      </section>

      {recent.length > 0 && (
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
            {recent.map((m) => (
              <LiveCard key={m.id} m={m} />
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            Scores refresh every 30 seconds. Source: ESPN.
          </p>
        </section>
      )}

      <ScheduleList grouped={grouped} venues={venues} scoreMap={scoreMap} />

      {standings.length > 0 && (
        <section className="max-w-5xl mx-auto mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 px-1">
            Group Rankings
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {standings.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-3 px-1">
            Standings refresh every minute. Source: ESPN.
          </p>
        </section>
      )}

      <footer className="max-w-3xl mx-auto text-center text-xs text-zinc-600 mt-12">
        Times shown in venue-local.
      </footer>
    </main>
  );
}
