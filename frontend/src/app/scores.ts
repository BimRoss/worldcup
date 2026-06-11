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

function ymdUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function fetchScoreboard(now: Date): Promise<LiveMatch[]> {
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dates = `${ymdUtc(yesterday)}-${ymdUtc(now)}`;
  const url =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=" +
    dates;

  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return [];
  const data = (await res.json()) as { events?: EspnEvent[] };
  const events = data.events ?? [];
  return events.map((e) => {
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
    };
  });
}
