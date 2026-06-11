import { matches, type Match } from "./schedule";
import { fetchScoreboard, pairKey, type LiveMatch } from "./scores";
import { ScheduleList } from "./ScheduleList";
import { fetchStandings, type Group } from "./standings";
import { LiveSection } from "./LiveSection";
import { Bracket } from "./Bracket";
import { fetchLeaders, type LeaderCategory } from "./leaders";
import { Leaders } from "./Leaders";

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

  const [scoreboard, standings, leaders] = await Promise.all([
    fetchScoreboard(new Date()).catch((): LiveMatch[] => []),
    fetchStandings().catch((): Group[] => []),
    fetchLeaders().catch((): LeaderCategory[] => []),
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
  const sortedScores = scoreboard.slice().sort((a, b) => {
    const order = { in: 0, pre: 1, post: 2 } as const;
    if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state];
    return a.kickoffUtc.localeCompare(b.kickoffUtc);
  });
  const recent = sortedScores.slice(0, 8);
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

      <LiveSection initial={recent} hasLive={hasLive} />

      <ScheduleList grouped={grouped} venues={venues} scoreMap={scoreMap} />

      <Bracket scoreMap={scoreMap} />

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

      <Leaders categories={leaders} />

      <footer className="max-w-3xl mx-auto text-center text-xs text-zinc-600 mt-12">
        Times shown in venue-local.
      </footer>
    </main>
  );
}
