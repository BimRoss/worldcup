import { matches, type Match } from "./schedule";
import {
  fetchScoreboard,
  pairKey,
  sortScoreboard,
  todayET,
  type LiveMatch,
} from "./scores";
import { ScheduleList } from "./ScheduleList";
import { fetchStandings, type Group } from "./standings";
import { GroupRankings } from "./GroupRankings";
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

export default async function Home() {
  const grouped = groupByDate(matches);
  const venues = Array.from(new Set(matches.map((m) => m.venue))).sort();
  const today = todayET(new Date());

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
  const recent = sortScoreboard(scoreboard, today).slice(0, 8);
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

      <LiveSection initial={recent} hasLive={hasLive} today={today} />

      <ScheduleList
        grouped={grouped}
        venues={venues}
        scoreMap={scoreMap}
        today={today}
      />

      <BracketModal>
        <Bracket scoreMap={scoreMap} />
      </BracketModal>

      <GroupRankings initial={standings} />

      <Leaders scorers={scorers} />

      <footer className="max-w-3xl mx-auto text-center text-xs text-zinc-600 mt-12">
        Times shown in venue-local.
      </footer>
    </main>
  );
}
