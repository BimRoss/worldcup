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

const CATEGORY_LIMIT = 5;
const WANT_CATEGORIES = new Set([
  "goalsLeaders",
  "assistsLeaders",
  "totalShotsLeaders",
  "yellowCardsLeaders",
]);

async function resolveRef<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchLeaders(): Promise<LeaderCategory[]> {
  const url =
    "https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/types/1/leaders?lang=en&region=us";
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) return [];
  const data = (await res.json()) as EspnLeadersResponse;
  const cats = (data.categories ?? []).filter((c) => WANT_CATEGORIES.has(c.name));

  const out: LeaderCategory[] = await Promise.all(
    cats.map(async (c) => {
      const top = (c.leaders ?? []).slice(0, CATEGORY_LIMIT);
      const leaders: Leader[] = await Promise.all(
        top.map(async (l, i): Promise<Leader> => {
          const [athlete, team] = await Promise.all([
            l.athlete?.$ref
              ? resolveRef<EspnAthlete>(l.athlete.$ref)
              : Promise.resolve(null),
            l.team?.$ref
              ? resolveRef<EspnTeam>(l.team.$ref)
              : Promise.resolve(null),
          ]);
          return {
            rank: i + 1,
            athleteName:
              athlete?.displayName ?? athlete?.fullName ?? "Unknown",
            teamName: team?.displayName ?? "",
            teamAbbrev: team?.abbreviation ?? "",
            teamLogo: team?.logos?.[0]?.href ?? "",
            displayValue: l.shortDisplayValue ?? l.displayValue ?? "",
            value: l.value ?? 0,
          };
        }),
      );
      return {
        name: c.name,
        displayName: c.displayName,
        leaders,
      };
    }),
  );

  return out.filter((c) => c.leaders.length > 0);
}
