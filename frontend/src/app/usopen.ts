export type GolfLeader = {
  position: string;
  name: string;
  toPar: string;
  thru: string;
};

export type USOpenLeaderboard = {
  eventName: string;
  status: string;
  leaders: GolfLeader[];
};

type GolfCompetitorStatus = {
  thru?: number;
  displayThru?: string;
  type?: { state?: string };
  position?: { id?: string; displayName?: string };
};

type GolfCompetitor = {
  athlete?: { displayName?: string; shortName?: string };
  score?: { displayValue?: string };
  statistics?: Array<{ name?: string; displayValue?: string }>;
  status?: GolfCompetitorStatus;
};

type EspnGolf = {
  events?: Array<{
    name?: string;
    shortName?: string;
    competitions?: Array<{
      status?: { type?: { shortDetail?: string; description?: string } };
      competitors?: GolfCompetitor[];
    }>;
  }>;
};

function thruText(s: GolfCompetitorStatus | undefined): string {
  if (!s) return "—";
  const state = s.type?.state;
  if (state === "post") return "F";
  if (state === "pre") return "—";
  if (typeof s.thru === "number" && s.thru > 0) return String(s.thru);
  if (s.displayThru) return s.displayThru;
  return "—";
}

export async function fetchUSOpen(): Promise<USOpenLeaderboard | null> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard",
      { next: { revalidate: 180 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as EspnGolf;
    const events = data.events ?? [];
    const event =
      events.find((e) => /u\.?s\.?\s*open/i.test(e.name ?? e.shortName ?? "")) ??
      events[0];
    if (!event) return null;
    const comp = event.competitions?.[0];
    if (!comp) return null;
    const competitors = comp.competitors ?? [];
    const sorted = competitors
      .map((c) => ({
        c,
        rank: parseInt(c.status?.position?.id ?? "9999", 10),
      }))
      .filter((x) => Number.isFinite(x.rank))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 10);
    const leaders: GolfLeader[] = sorted.map(({ c }) => {
      const tournamentToPar = c.statistics?.find(
        (s) => s.name === "scoreToPar",
      )?.displayValue;
      return {
        position: c.status?.position?.displayName ?? "",
        name: c.athlete?.displayName ?? c.athlete?.shortName ?? "",
        toPar: tournamentToPar ?? c.score?.displayValue ?? "—",
        thru: thruText(c.status),
      };
    });
    return {
      eventName: event.name ?? event.shortName ?? "U.S. Open",
      status:
        comp.status?.type?.shortDetail ??
        comp.status?.type?.description ??
        "",
      leaders,
    };
  } catch {
    return null;
  }
}
