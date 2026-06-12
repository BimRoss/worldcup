export type Goal = {
  id: string;
  matchId: string;
  scorer: string;
  assist: string | null;
  team: string;
  teamAbbrev: string;
  teamLogo: string;
  opponent: string;
  opponentAbbrev: string;
  opponentLogo: string;
  minute: string;
  text: string;
  isHeader: boolean;
  isPenalty: boolean;
  isOwnGoal: boolean;
  wallclock: string;
};

type EspnKeyEvent = {
  id: string;
  type?: { text?: string; type?: string };
  text?: string;
  shortText?: string;
  clock?: { displayValue?: string };
  scoringPlay?: boolean;
  team?: { id?: string; displayName?: string };
  participants?: Array<{ athlete?: { id?: string; displayName?: string } }>;
  wallclock?: string;
};

type EspnSummary = { keyEvents?: EspnKeyEvent[] };

type EspnScoreboardTeam = {
  id?: string;
  displayName?: string;
  abbreviation?: string;
  logo?: string;
};

type EspnScoreboardEvent = {
  id: string;
  competitions: Array<{
    status: { type: { state: "pre" | "in" | "post" } };
    competitors: Array<{
      homeAway: "home" | "away";
      team: EspnScoreboardTeam;
    }>;
  }>;
};

const TOURNAMENT_START = "20260611";

function ymdUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

type MatchTeams = {
  state: "pre" | "in" | "post";
  home: EspnScoreboardTeam;
  away: EspnScoreboardTeam;
};

async function fetchEvents(now: Date): Promise<Map<string, MatchTeams>> {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dates = `${TOURNAMENT_START}-${ymdUtc(tomorrow)}`;
  const url =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=" +
    dates;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return new Map();
  const data = (await res.json()) as { events?: EspnScoreboardEvent[] };
  const map = new Map<string, MatchTeams>();
  for (const e of data.events ?? []) {
    const comp = e.competitions[0];
    const home = comp.competitors.find((c) => c.homeAway === "home")?.team;
    const away = comp.competitors.find((c) => c.homeAway === "away")?.team;
    if (!home || !away) continue;
    map.set(e.id, { state: comp.status.type.state, home, away });
  }
  return map;
}

async function fetchKeyEvents(eventId: string): Promise<EspnKeyEvent[]> {
  const url =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=" +
    eventId;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = (await res.json()) as EspnSummary;
  return data.keyEvents ?? [];
}

export async function fetchGoals(now: Date): Promise<Goal[]> {
  const events = await fetchEvents(now);
  const playable = Array.from(events.entries()).filter(
    ([, m]) => m.state !== "pre",
  );
  const lists = await Promise.all(
    playable.map(async ([id]) => {
      const ke = await fetchKeyEvents(id).catch(() => []);
      return { id, ke };
    }),
  );

  const goals: Goal[] = [];
  for (const { id: matchId, ke } of lists) {
    const m = events.get(matchId);
    if (!m) continue;
    for (const ev of ke) {
      if (!ev.scoringPlay) continue;
      const scoringTeam = ev.team?.displayName ?? "";
      const isHome = scoringTeam === m.home.displayName;
      const scoring = isHome ? m.home : m.away;
      const opp = isHome ? m.away : m.home;
      const typeText = ev.type?.text ?? "";
      const scorer =
        ev.participants?.[0]?.athlete?.displayName ?? ev.shortText ?? "Goal";
      const assist = ev.participants?.[1]?.athlete?.displayName ?? null;
      goals.push({
        id: ev.id,
        matchId,
        scorer,
        assist,
        team: scoring.displayName ?? "",
        teamAbbrev: scoring.abbreviation ?? "",
        teamLogo: scoring.logo ?? "",
        opponent: opp.displayName ?? "",
        opponentAbbrev: opp.abbreviation ?? "",
        opponentLogo: opp.logo ?? "",
        minute: ev.clock?.displayValue ?? "",
        text: ev.text ?? "",
        isHeader: /header/i.test(typeText),
        isPenalty: /penalty/i.test(typeText),
        isOwnGoal: /own goal/i.test(typeText),
        wallclock: ev.wallclock ?? "",
      });
    }
  }

  goals.sort((a, b) => b.wallclock.localeCompare(a.wallclock));
  return goals;
}
