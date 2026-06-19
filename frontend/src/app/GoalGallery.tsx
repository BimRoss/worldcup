"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Goal } from "./goals";
import type { Scorer } from "./leaders";
import type { Player } from "./rosters";
import { track } from "./track";
import { TrackedLink } from "./TrackedLink";

const STORAGE_KEY = "worldcup-goal-likes-v1";
const EMPTY_RAW = "[]";

const storeListeners = new Set<() => void>();

function subscribeStore(cb: () => void): () => void {
  storeListeners.add(cb);
  return () => {
    storeListeners.delete(cb);
  };
}

function notifyStore() {
  for (const l of [...storeListeners]) l();
}

function getClientSnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_RAW;
  } catch {
    return EMPTY_RAW;
  }
}

function getServerSnapshot(): string {
  return EMPTY_RAW;
}

function parseLikes(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function writeLikes(s: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s)));
    notifyStore();
  } catch {
    // ignore quota / privacy-mode errors
  }
}

function goalLabel(g: Goal): string {
  if (g.isOwnGoal) return "OG";
  if (g.isPenalty) return "PEN";
  if (g.isHeader) return "HEADER";
  return "";
}

function labelClass(g: Goal): string {
  if (g.isOwnGoal) return "bg-red-500/15 text-red-400";
  if (g.isPenalty) return "bg-amber-500/15 text-amber-400";
  return "bg-zinc-800 text-zinc-300";
}

type ScorerEntry = {
  scorer: string;
  team: string;
  teamAbbrev: string;
  teamLogo: string;
  count: number;
  goals: number;
  assists: number;
  points: number;
  gp: number;
  instagramUrl: string;
};

function instagramSearchUrl(name: string): string {
  return `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(name)}`;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildScorerLeaderboard(
  goals: Goal[],
  players: Player[],
  scorers: Scorer[],
  teamGames: Record<string, number>,
): ScorerEntry[] {
  const statsByName = new Map<string, Scorer>();
  for (const s of scorers) {
    statsByName.set(normalize(s.athleteName), s);
  }
  function statsFor(name: string): Pick<Scorer, "goals" | "assists" | "points" | "instagramUrl"> | null {
    return statsByName.get(normalize(name)) ?? null;
  }
  function gpFor(teamAbbrev: string): number {
    return teamGames[teamAbbrev.toUpperCase()] ?? 0;
  }

  const map = new Map<string, ScorerEntry>();
  for (const g of goals) {
    if (g.isOwnGoal) continue;
    const key = `${normalize(g.scorer)}|${(g.teamAbbrev || g.team).toUpperCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      const stats = statsFor(g.scorer);
      const count = 1;
      const teamAbbrev = g.teamAbbrev || g.team;
      map.set(key, {
        scorer: g.scorer,
        team: g.team,
        teamAbbrev: g.teamAbbrev,
        teamLogo: g.teamLogo,
        count,
        goals: stats?.goals ?? count,
        assists: stats?.assists ?? 0,
        points: stats?.points ?? count * 2,
        gp: gpFor(teamAbbrev),
        instagramUrl: stats?.instagramUrl ?? instagramSearchUrl(g.scorer),
      });
    }
  }
  for (const e of map.values()) {
    if (e.goals < e.count) e.goals = e.count;
    if (e.points < e.goals * 2 + e.assists) e.points = e.goals * 2 + e.assists;
  }
  for (const p of players) {
    const key = `${normalize(p.name)}|${p.teamAbbrev.toUpperCase()}`;
    if (map.has(key)) continue;
    const stats = statsFor(p.name);
    map.set(key, {
      scorer: p.name,
      team: p.team,
      teamAbbrev: p.teamAbbrev,
      teamLogo: p.teamLogo,
      count: 0,
      goals: stats?.goals ?? 0,
      assists: stats?.assists ?? 0,
      points: stats?.points ?? 0,
      gp: gpFor(p.teamAbbrev),
      instagramUrl: stats?.instagramUrl ?? instagramSearchUrl(p.name),
    });
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      b.points - a.points ||
      b.goals - a.goals ||
      b.assists - a.assists ||
      a.scorer.localeCompare(b.scorer),
  );
}

export function GoalGallery({
  goals,
  players,
  scorers,
  teamGames,
}: {
  goals: Goal[];
  players: Player[];
  scorers: Scorer[];
  teamGames: Record<string, number>;
}) {
  const raw = useSyncExternalStore(
    subscribeStore,
    getClientSnapshot,
    getServerSnapshot,
  );
  const liked = useMemo(() => parseLikes(raw), [raw]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const leaderboard = useMemo(
    () => buildScorerLeaderboard(goals, players, scorers, teamGames),
    [goals, players, scorers, teamGames],
  );
  const tournamentLeader =
    leaderboard.find((e) => e.points > 0 || e.count > 0)?.scorer ?? null;
  const [selectedScorer, setSelectedScorer] = useState<string | null>(
    tournamentLeader,
  );
  const filteredLeaderboard = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leaderboard;
    return leaderboard.filter(
      (e) =>
        e.scorer.toLowerCase().includes(q) ||
        e.team.toLowerCase().includes(q) ||
        e.teamAbbrev.toLowerCase().includes(q),
    );
  }, [leaderboard, query]);

  const filteredGoals = useMemo(() => {
    if (selectedScorer) {
      return goals.filter((g) => g.scorer === selectedScorer);
    }
    const q = query.trim().toLowerCase();
    if (!q) return goals;
    return goals.filter(
      (g) =>
        g.scorer.toLowerCase().includes(q) ||
        g.team.toLowerCase().includes(q) ||
        g.teamAbbrev.toLowerCase().includes(q),
    );
  }, [goals, query, selectedScorer]);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openId]);

  function toggle(id: string) {
    const next = new Set(liked);
    const action = next.has(id) ? "unvote" : "vote";
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeLikes(next);
    const g = goals.find((x) => x.id === id);
    track("goal_vote", {
      goal_id: id,
      action,
      scorer: g?.scorer,
      team: g?.teamAbbrev || g?.team,
    });
  }

  const open = openId ? (goals.find((g) => g.id === openId) ?? null) : null;

  return (
    <section className="max-w-3xl mx-auto mb-12">
      <div className="mb-4 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-emerald-500/10 border border-emerald-500/40">
        <span className="text-sm font-bold text-emerald-100">
          KICK ALS&apos; ASS!
        </span>
        <TrackedLink
          href="https://www.als.org/donate"
          target="_blank"
          rel="noopener"
          className="inline-block rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-3 py-1.5 text-xs transition-colors shrink-0"
          event="cta_click"
          params={{ cta_id: "donate_als_goal_gallery", link_target: "als" }}
        >
          Donate →
        </TrackedLink>
      </div>

      <div className="mb-3 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Goal of the Tournament
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Every goal scored. Tap to open, then vote for your favorite.
        </p>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
          No goals yet. Tiles appear here the moment one goes in.
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedScorer(null);
              }}
              placeholder="Search player or team…"
              aria-label="Search scorers"
              className="flex-1 min-w-[10rem] bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500"
            />
            {(query || selectedScorer) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedScorer(null);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline decoration-dotted"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <div className="px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/80 text-[10px] uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Top scorers</span>
              <span className="tabular-nums text-zinc-600">
                {filteredLeaderboard.length}
              </span>
            </div>
            {filteredLeaderboard.length === 0 ? (
              <p className="px-3 py-3 text-xs text-zinc-500">No players match.</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto divide-y divide-zinc-800/60">
                <li
                  aria-hidden="true"
                  className="flex items-center gap-2 px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-900/40"
                >
                  <span className="w-5 text-right">#</span>
                  <span className="w-4" />
                  <span className="flex-1">Player</span>
                  <span className="w-7 text-right tabular-nums">GP</span>
                  <span className="w-7 text-right tabular-nums">G</span>
                  <span className="w-7 text-right tabular-nums">A</span>
                  <span className="w-8 text-right tabular-nums">Pts</span>
                  <span className="w-7 text-center">IG</span>
                </li>
                {filteredLeaderboard.map((e, i) => {
                  const isActive = selectedScorer === e.scorer;
                  return (
                    <li
                      key={`${e.scorer}-${e.teamAbbrev}`}
                      className={`flex items-stretch ${
                        isActive ? "bg-emerald-500/10" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedScorer(isActive ? null : e.scorer)
                        }
                        aria-pressed={isActive}
                        className={`flex-1 flex items-center gap-2 pl-3 py-1.5 text-xs text-left transition-colors ${
                          isActive
                            ? "text-emerald-100"
                            : "hover:bg-zinc-800/60 text-zinc-200"
                        }`}
                      >
                        <span className="w-5 text-right text-[10px] tabular-nums text-zinc-500">
                          {i + 1}
                        </span>
                        {e.teamLogo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={e.teamLogo}
                            alt={e.teamAbbrev}
                            className="h-4 w-4 shrink-0"
                          />
                        ) : (
                          <span className="w-4" />
                        )}
                        <span className="flex-1 truncate font-medium">
                          {e.scorer}
                          <span className="ml-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
                            {e.teamAbbrev}
                          </span>
                        </span>
                        <span className="w-7 text-right tabular-nums text-zinc-400">
                          {e.gp}
                        </span>
                        <span className="w-7 text-right tabular-nums text-zinc-300">
                          {e.goals}
                        </span>
                        <span className="w-7 text-right tabular-nums text-zinc-300">
                          {e.assists}
                        </span>
                        <span
                          className={`w-8 text-right tabular-nums font-bold ${
                            isActive ? "text-emerald-300" : "text-emerald-400"
                          }`}
                        >
                          {e.points}
                        </span>
                      </button>
                      <TrackedLink
                        href={e.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        ariaLabel={`Search Instagram for ${e.scorer}`}
                        className="flex items-center justify-center w-7 px-2.5 text-zinc-400 hover:text-pink-400 transition-colors"
                        event="outbound_click"
                        params={{
                          link_target: "instagram_player",
                          athlete: e.scorer,
                          team: e.teamAbbrev || e.team,
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                      </TrackedLink>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="px-3 py-1.5 border-t border-zinc-800 bg-zinc-900/40 text-[10px] text-zinc-600">
              GP = team games played. Pts = goals × 2 + assists. IG links to an
              Instagram search by name.
            </p>
          </div>

          {filteredGoals.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
              No goals match.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {filteredGoals.map((g) => {
            const isLiked = liked.has(g.id);
            return (
              <button
                key={g.id}
                onClick={() => {
                  setOpenId(g.id);
                  track("goal_open", {
                    goal_id: g.id,
                    scorer: g.scorer,
                    team: g.teamAbbrev || g.team,
                  });
                }}
                className={`group relative rounded-md border bg-zinc-900/70 p-2 text-left transition-colors ${
                  isLiked
                    ? "border-emerald-500/60"
                    : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {g.teamLogo && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={g.teamLogo}
                      alt={g.teamAbbrev}
                      className="h-5 w-5 shrink-0"
                    />
                  )}
                  <span className="text-[10px] font-bold tabular-nums text-emerald-400 ml-auto">
                    {g.minute}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-semibold leading-tight text-zinc-100 line-clamp-2">
                  {g.scorer}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                    vs {g.opponentAbbrev || g.opponent}
                  </span>
                  {isLiked && (
                    <span aria-hidden className="text-emerald-400 text-xs">
                      ♥
                    </span>
                  )}
                </div>
              </button>
            );
          })}
            </div>
          )}
        </>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Goal detail"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setOpenId(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              {open.teamLogo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={open.teamLogo}
                  alt={open.teamAbbrev}
                  className="h-8 w-8 shrink-0"
                />
              )}
              <span className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                {open.teamAbbrev || open.team}
              </span>
              <span className="text-xs text-zinc-600">vs</span>
              {open.opponentLogo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={open.opponentLogo}
                  alt={open.opponentAbbrev}
                  className="h-5 w-5 shrink-0 opacity-70"
                />
              )}
              <span className="text-xs text-zinc-400">
                {open.opponentAbbrev || open.opponent}
              </span>
              <span className="ml-auto text-base font-bold tabular-nums text-emerald-400">
                {open.minute}
              </span>
            </div>

            <div className="mt-4 text-xl font-bold text-zinc-100 leading-tight">
              {open.scorer}
            </div>
            <div className="mt-1">
              <TrackedLink
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  `${open.scorer} goal ${open.teamAbbrev || open.team} vs ${open.opponentAbbrev || open.opponent} World Cup 2026`,
                )}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                event="goal_watch_now"
                params={{
                  goal_id: open.id,
                  scorer: open.scorer,
                  team: open.teamAbbrev || open.team,
                }}
              >
                ▶ Watch Now
              </TrackedLink>
            </div>
            {open.assist && (
              <div className="text-sm text-zinc-400 mt-1">
                assist {open.assist}
              </div>
            )}
            {goalLabel(open) && (
              <div className="mt-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${labelClass(open)}`}
                >
                  {goalLabel(open)}
                </span>
              </div>
            )}
            {open.text && open.text !== open.scorer && (
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                {open.text}
              </p>
            )}

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => toggle(open.id)}
                aria-pressed={liked.has(open.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  liked.has(open.id)
                    ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                    : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                }`}
              >
                <span aria-hidden>{liked.has(open.id) ? "♥" : "♡"}</span>
                {liked.has(open.id) ? "Voted" : "Vote"}
              </button>
              <button
                onClick={() => setOpenId(null)}
                className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 px-3 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-600 mt-3 px-1">
        Votes are saved on this device. Tournament-wide ranking coming next.
      </p>
    </section>
  );
}
