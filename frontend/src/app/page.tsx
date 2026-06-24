import { matches, type Match } from "./schedule";
import {
  fetchScoreboard,
  pairKey,
  todayET,
  type LiveMatch,
} from "./scores";
import { ScheduleList } from "./ScheduleList";
import { fetchStandings, type Group } from "./standings";
import { GroupRankings } from "./GroupRankings";
import { Bracket } from "./Bracket";
import { BracketModal } from "./BracketModal";
import { fetchScorers, type Scorer } from "./leaders";
import { fetchGoals, type Goal } from "./goals";
import { fetchAllPlayers, type Player } from "./rosters";
import { GoalGallery } from "./GoalGallery";
import { TrackedLink } from "./TrackedLink";

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

  const [scoreboard, standings, scorers, goals, players] =
    await Promise.all([
      fetchScoreboard(new Date()).catch((): LiveMatch[] => []),
      fetchStandings().catch((): Group[] => []),
      fetchScorers().catch((): Scorer[] => []),
      fetchGoals(new Date()).catch((): Goal[] => []),
      fetchAllPlayers().catch((): Player[] => []),
    ]);
  const scoreMap: Record<string, LiveMatch> = {};
  const DAY_MS = 24 * 60 * 60 * 1000;
  function withinOneDay(a: string, b: string): boolean {
    if (a === b) return true;
    const da = Date.parse(a + "T00:00:00Z");
    const db = Date.parse(b + "T00:00:00Z");
    return Math.abs(da - db) <= DAY_MS;
  }
  for (const s of scoreboard) {
    const key = pairKey(s.homeTeam, s.awayTeam);
    for (const m of matches) {
      if (pairKey(m.team1, m.team2) === key && withinOneDay(m.date, s.date)) {
        scoreMap[`${m.team1}|${m.team2}`] = s;
        break;
      }
    }
  }
  const teamGames: Record<string, number> = {};
  for (const g of standings) {
    for (const e of g.entries) {
      teamGames[e.abbrev.toUpperCase()] = e.played;
    }
  }

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
          <TrackedLink
            href="https://makeacompany.ai"
            target="_blank"
            rel="noopener"
            className="inline-block rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-3 text-sm sm:text-base transition-colors"
            event="cta_click"
            params={{ cta_id: "start_company_hero", link_target: "makeacompany" }}
          >
            Start your company today →
          </TrackedLink>
          <span className="text-xs text-zinc-300 max-w-md text-center sm:text-left">
            We reached our{" "}
            <span className="font-bold text-emerald-400">GOAL</span> of{" "}
            <span className="font-bold text-emerald-400">100</span> users, thank
            you all! <span className="font-bold text-emerald-400">FREE</span>{" "}
            week of trial left, sign up and explore now, game on!
          </span>
        </div>
      </section>

      <BracketModal standings={standings}>
        <Bracket scoreMap={scoreMap} />
      </BracketModal>

      <GoalGallery
        goals={goals}
        players={players}
        scorers={scorers}
        teamGames={teamGames}
      />

      <ScheduleList
        grouped={grouped}
        venues={venues}
        scoreMap={scoreMap}
        today={today}
      />

      <GroupRankings initial={standings} matches={matches} scoreMap={scoreMap} />

      <section className="max-w-3xl mx-auto mt-12">
        <div className="rounded-lg px-4 py-3 text-center bg-emerald-500/10 border border-emerald-500/40">
          <span className="text-sm text-emerald-100">
            Orchestrated by{" "}
            <a
              href="https://protexionist.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline hover:text-emerald-50"
            >
              The Digital Protexionist
            </a>
            : The HUMAN touch needed in a Digital World!
          </span>
        </div>
      </section>

      <footer className="max-w-3xl mx-auto text-center text-xs text-zinc-600 mt-8">
        Times shown in venue-local.
      </footer>
    </main>
  );
}
