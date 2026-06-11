export type Period = {
  home: number | null;
  away: number | null;
};

export type LiveMatch = {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  state: "pre" | "in" | "post";
  statusDetail: string;
  shortDetail: string;
  venue: string;
  kickoffUtc: string;
  firstHalf: Period | null;
  secondHalf: Period | null;
};

type EspnEvent = {
  id: string;
  date: string;
  competitions: Array<{
    status: {
      type: { state: "pre" | "in" | "post"; detail: string; shortDetail: string };
    };
    venue?: { fullName?: string };
    competitors: Array<{
      homeAway: "home" | "away";
      score?: string;
      team: { displayName: string };
    }>;
  }>;
};

type EspnSummary = {
  header?: {
    competitions?: Array<{
      competitors?: Array<{
        homeAway: "home" | "away";
        linescores?: Array<{ displayValue?: string; value?: number }>;
      }>;
    }>;
  };
};

function ymdUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

const TOURNAMENT_START = "20260611";

function parseLine(
  v: { displayValue?: string; value?: number } | undefined,
): number | null {
  if (!v) return null;
  if (typeof v.value === "number" && !Number.isNaN(v.value)) return v.value;
  if (v.displayValue != null) {
    const n = Number(v.displayValue);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function fetchSummary(eventId: string): Promise<{
  firstHalf: Period | null;
  secondHalf: Period | null;
} | null> {
  const url =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=" +
    eventId;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return null;
  const data = (await res.json()) as EspnSummary;
  const comp = data.header?.competitions?.[0];
  const home = comp?.competitors?.find((c) => c.homeAway === "home");
  const away = comp?.competitors?.find((c) => c.homeAway === "away");
  const homeLines = home?.linescores ?? [];
  const awayLines = away?.linescores ?? [];
  const firstHalf: Period | null =
    homeLines[0] || awayLines[0]
      ? { home: parseLine(homeLines[0]), away: parseLine(awayLines[0]) }
      : null;
  const secondHalf: Period | null =
    homeLines[1] || awayLines[1]
      ? { home: parseLine(homeLines[1]), away: parseLine(awayLines[1]) }
      : null;
  return { firstHalf, secondHalf };
}

export async function fetchScoreboard(now: Date): Promise<LiveMatch[]> {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dates = `${TOURNAMENT_START}-${ymdUtc(tomorrow)}`;
  const url =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=" +
    dates;

  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return [];
  const data = (await res.json()) as { events?: EspnEvent[] };
  const events = data.events ?? [];

  const base: LiveMatch[] = events.map((e) => {
    const comp = e.competitions[0];
    const home = comp.competitors.find((c) => c.homeAway === "home")!;
    const away = comp.competitors.find((c) => c.homeAway === "away")!;
    return {
      id: e.id,
      date: e.date.slice(0, 10),
      homeTeam: home.team.displayName,
      awayTeam: away.team.displayName,
      homeScore: home.score != null ? Number(home.score) : null,
      awayScore: away.score != null ? Number(away.score) : null,
      state: comp.status.type.state,
      statusDetail: comp.status.type.detail,
      shortDetail: comp.status.type.shortDetail,
      venue: comp.venue?.fullName ?? "",
      kickoffUtc: e.date,
      firstHalf: null,
      secondHalf: null,
    };
  });

  await Promise.all(
    base.map(async (m) => {
      if (m.state === "pre") return;
      const lines = await fetchSummary(m.id).catch(() => null);
      if (!lines) return;
      m.firstHalf = lines.firstHalf;
      m.secondHalf = lines.secondHalf;
    }),
  );

  return base;
}

function normalizeTeam(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\bunited states\b/g, "usa")
    .replace(/\bkorea republic\b/g, "south korea")
    .replace(/\bczech republic\b/g, "czechia")
    .replace(/\bbosnia(?: and| &|-)? ?herzegovina\b/g, "bosnia herzegovina")
    .replace(/\bcape verde\b/g, "cabo verde")
    .replace(/\bdr congo\b/g, "congo dr")
    .replace(/\bivory coast\b/g, "cote divoire")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function pairKey(a: string, b: string): string {
  return [normalizeTeam(a), normalizeTeam(b)].sort().join("|");
}
