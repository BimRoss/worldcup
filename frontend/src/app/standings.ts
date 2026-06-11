export type GroupEntry = {
  rank: number;
  team: string;
  abbrev: string;
  logo: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type Group = {
  id: string;
  name: string;
  entries: GroupEntry[];
};

type EspnStat = { name: string; value: number | null };

type EspnGroup = {
  id: string;
  name: string;
  standings: {
    entries: Array<{
      team: {
        displayName: string;
        abbreviation: string;
        logos?: Array<{ href: string }>;
      };
      stats: EspnStat[];
    }>;
  };
};

function stat(stats: EspnStat[], name: string): number {
  const s = stats.find((x) => x.name === name);
  if (!s || s.value == null) return 0;
  return s.value;
}

export async function fetchStandings(): Promise<Group[]> {
  const url =
    "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = (await res.json()) as { children?: EspnGroup[] };
  const groups = data.children ?? [];
  return groups.map((g) => {
    const entries: GroupEntry[] = g.standings.entries.map((e) => ({
      rank: stat(e.stats, "rank"),
      team: e.team.displayName,
      abbrev: e.team.abbreviation,
      logo: e.team.logos?.[0]?.href ?? "",
      played: stat(e.stats, "gamesPlayed"),
      wins: stat(e.stats, "wins"),
      draws: stat(e.stats, "ties"),
      losses: stat(e.stats, "losses"),
      goalsFor: stat(e.stats, "pointsFor"),
      goalsAgainst: stat(e.stats, "pointsAgainst"),
      goalDiff: stat(e.stats, "pointDifferential"),
      points: stat(e.stats, "points"),
    }));
    entries.sort((a, b) => a.rank - b.rank);
    return { id: g.id, name: g.name, entries };
  });
}
