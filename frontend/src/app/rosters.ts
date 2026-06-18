export type Player = {
  id: string;
  name: string;
  team: string;
  teamAbbrev: string;
  teamLogo: string;
  position: string;
};

type EspnTeamsResponse = {
  sports?: Array<{
    leagues?: Array<{
      teams?: Array<{
        team?: {
          id?: string;
          displayName?: string;
          abbreviation?: string;
          logos?: Array<{ href?: string }>;
        };
      }>;
    }>;
  }>;
};

type EspnRosterResponse = {
  athletes?: Array<{
    id?: string;
    displayName?: string;
    fullName?: string;
    position?: { abbreviation?: string };
  }>;
};

const TEAMS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams";

function rosterUrl(teamId: string): string {
  return `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams/${teamId}/roster`;
}

async function fetchTeams(): Promise<
  Array<{ id: string; name: string; abbrev: string; logo: string }>
> {
  const res = await fetch(TEAMS_URL, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const data = (await res.json()) as EspnTeamsResponse;
  const raw = data.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return raw
    .map((t) => t.team)
    .filter((t): t is NonNullable<typeof t> => !!t && !!t.id)
    .map((t) => ({
      id: t.id!,
      name: t.displayName ?? "",
      abbrev: t.abbreviation ?? "",
      logo: t.logos?.[0]?.href ?? "",
    }));
}

async function fetchRoster(team: {
  id: string;
  name: string;
  abbrev: string;
  logo: string;
}): Promise<Player[]> {
  try {
    const res = await fetch(rosterUrl(team.id), {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as EspnRosterResponse;
    const athletes = data.athletes ?? [];
    return athletes
      .filter((a) => !!a.id)
      .map((a) => ({
        id: a.id!,
        name: a.displayName ?? a.fullName ?? "",
        team: team.name,
        teamAbbrev: team.abbrev,
        teamLogo: team.logo,
        position: a.position?.abbreviation ?? "",
      }))
      .filter((p) => p.name);
  } catch {
    return [];
  }
}

export async function fetchAllPlayers(): Promise<Player[]> {
  const teams = await fetchTeams();
  if (teams.length === 0) return [];
  const rosters = await Promise.all(teams.map(fetchRoster));
  return rosters.flat();
}
