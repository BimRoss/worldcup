export type Leader = {
  rank: number;
  athleteName: string;
  teamName: string;
  teamAbbrev: string;
  teamLogo: string;
  displayValue: string;
  value: number;
};

export type LeaderCategory = {
  name: string;
  displayName: string;
  leaders: Leader[];
};

export type Scorer = {
  rank: number;
  athleteName: string;
  teamName: string;
  teamAbbrev: string;
  teamLogo: string;
  goals: number;
  assists: number;
  points: number;
  instagramUrl: string;
};

type EspnLeadersResponse = {
  categories?: Array<{
    name: string;
    displayName: string;
    leaders?: Array<{
      displayValue?: string;
      shortDisplayValue?: string;
      value?: number;
      athlete?: { $ref?: string };
      team?: { $ref?: string };
    }>;
  }>;
};

type EspnAthlete = {
  displayName?: string;
  fullName?: string;
  shortName?: string;
};

type EspnTeam = {
  displayName?: string;
  abbreviation?: string;
  logos?: Array<{ href?: string }>;
};

const SCORER_LIMIT = 25;
const WANT_CATEGORIES = new Set(["goalsLeaders", "assistsLeaders"]);

async function resolveRef<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 180 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchScorers(): Promise<Scorer[]> {
  const url =
    "https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/types/1/leaders?lang=en&region=us";
  const res = await fetch(url, { next: { revalidate: 180 } });
  if (!res.ok) return [];
  const data = (await res.json()) as EspnLeadersResponse;
  const cats = (data.categories ?? []).filter((c) =>
    WANT_CATEGORIES.has(c.name),
  );

  type Acc = {
    athleteRef: string;
    teamRef: string;
    goals: number;
    assists: number;
  };
  const acc = new Map<string, Acc>();

  for (const c of cats) {
    const isGoals = c.name === "goalsLeaders";
    for (const l of c.leaders ?? []) {
      const aRef = l.athlete?.$ref;
      if (!aRef) continue;
      const cur = acc.get(aRef) ?? {
        athleteRef: aRef,
        teamRef: l.team?.$ref ?? "",
        goals: 0,
        assists: 0,
      };
      if (!cur.teamRef && l.team?.$ref) cur.teamRef = l.team.$ref;
      const v = l.value ?? 0;
      if (isGoals) cur.goals = v;
      else cur.assists = v;
      acc.set(aRef, cur);
    }
  }

  const merged = Array.from(acc.values()).filter(
    (e) => e.goals > 0 || e.assists > 0,
  );
  merged.sort((a, b) => {
    const pa = a.goals * 2 + a.assists;
    const pb = b.goals * 2 + b.assists;
    if (pb !== pa) return pb - pa;
    if (b.goals !== a.goals) return b.goals - a.goals;
    return b.assists - a.assists;
  });
  const top = merged.slice(0, SCORER_LIMIT);

  const resolved = await Promise.all(
    top.map(async (e): Promise<Omit<Scorer, "rank">> => {
      const [athlete, team] = await Promise.all([
        resolveRef<EspnAthlete>(e.athleteRef),
        e.teamRef ? resolveRef<EspnTeam>(e.teamRef) : Promise.resolve(null),
      ]);
      const name = athlete?.displayName ?? athlete?.fullName ?? "Unknown";
      return {
        athleteName: name,
        teamName: team?.displayName ?? "",
        teamAbbrev: team?.abbreviation ?? "",
        teamLogo: team?.logos?.[0]?.href ?? "",
        goals: e.goals,
        assists: e.assists,
        points: e.goals * 2 + e.assists,
        instagramUrl: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(name)}`,
      };
    }),
  );

  return resolved.map((s, i) => ({ ...s, rank: i + 1 }));
}
