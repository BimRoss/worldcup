import { matches, type Match } from "./schedule";
import { fetchScoreboard, pairKey, type LiveMatch } from "./scores";
import { ScheduleList } from "./ScheduleList";
import { fetchStandings, type Group } from "./standings";
import { LiveSection } from "./LiveSection";
import { Bracket } from "./Bracket";
import { BracketModal } from "./BracketModal";
import { fetchScorers, type Scorer } from "./leaders";
import { Leaders } from "./Leaders";

export const revalidate = 180;

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
                <td className="px-3 py-1.5 tabular-nums">
                  {advancing ? (
                    <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded text-[9px] font-bold bg-emerald-500 text-zinc-950">
                      Q
                    </span>
                  ) : (
                    <span className="text-zinc-500">{i + 1}</span>
                  )}
                </td>
                <td
                  className={
                    "px-1 py-1.5 truncate max-w-[10rem] " +
                    (advancing ? "text-emerald-100 font-medium" : "text-zinc-200")
                  }
                >
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

  const [scoreboard, standings, scorers] = await Promise.all([
    fetchScoreboard(new Date()).catch((): LiveMatch[] => []),
    fetchStandings().catch((): Group[] => []),
    fetchScorers().catch((): Scorer[] => []),
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
    <main className="min-h-screen px-4 sm:px-6 py-6">
      <section className="max-w-4xl mx-auto text-center mt-2 mb-8 sm:mb-10">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-emerald-400 mb-3">
          A makeacompany.ai project · FIFA 2026
        </p>
        <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight">
          Make YOUR <span className="text-emerald-400">GOAL.</span>
          <br className="sm:hidden" />{" "}
          Make YOUR <span className="text-emerald-400">COMPANY.</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Make a Company helps founders launch real businesses with AI
          co-pilots. While you watch the cup, come launch yours.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://makeacompany.ai"
            target="_blank"
            rel="noopener"
            className="inline-block rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-3 text-sm sm:text-base transition-colors"
          >
            Start your company today →
          </a>
          <span className="text-xs text-zinc-500">
            A few <span className="font-bold text-emerald-400">FREE</span>{" "}
            spots left. Work with{" "}
            <span className="font-bold text-zinc-200">Ross &amp; Joanne</span>,
            your AI wingers.
          </span>
        </div>
      </section>

      <LiveSection initial={recent} hasLive={hasLive} />

      <ScheduleList grouped={grouped} venues={venues} scoreMap={scoreMap} />

      <BracketModal>
        <Bracket scoreMap={scoreMap} />
      </BracketModal>

      {standings.length > 0 && (
        <section className="max-w-5xl mx-auto mt-16">
          <div className="px-1 mb-4 flex items-baseline gap-3 flex-wrap">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Group Rankings
            </h2>
            <span className="text-[10px] text-zinc-500 inline-flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center h-3.5 min-w-[0.875rem] px-1 rounded text-[8px] font-bold bg-emerald-500 text-zinc-950">
                Q
              </span>
              top two qualify for the next round
            </span>
          </div>
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

      <Leaders scorers={scorers} />

      <footer className="max-w-3xl mx-auto text-center text-xs text-zinc-600 mt-12">
        Times shown in venue-local.
      </footer>
    </main>
  );
}
