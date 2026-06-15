"use client";

import { useEffect, useMemo } from "react";
import type { Match } from "./schedule";
import type { LiveMatch } from "./scores";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\bunited states\b/g, "usa")
    .replace(/\bkorea republic\b/g, "south korea")
    .replace(/\bczech republic\b/g, "czechia")
    .replace(/\bbosnia(?: and| &|-)? ?herzegovina\b/g, "bosnia herzegovina")
    .replace(/\bcape verde\b/g, "cabo verde")
    .replace(/\bcote d'?ivoire\b/g, "ivory coast")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function fmt(n: number | null): string {
  return n == null ? "–" : String(n);
}

function resolveScore(
  live: LiveMatch | undefined,
  m: Match,
): { t1: number | null; t2: number | null; state: string } | null {
  if (!live) return null;
  const homeIsTeam1 =
    normalize(live.homeTeam).includes(normalize(m.team1).slice(0, 5)) ||
    normalize(m.team1).includes(normalize(live.homeTeam).slice(0, 5));
  const t1 = homeIsTeam1 ? live.homeScore : live.awayScore;
  const t2 = homeIsTeam1 ? live.awayScore : live.homeScore;
  return { t1, t2, state: live.state };
}

export function TeamScheduleModal({
  team,
  matches,
  scoreMap,
  onClose,
}: {
  team: string;
  matches: Match[];
  scoreMap: Record<string, LiveMatch>;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const teamMatches = useMemo(() => {
    const norm = normalize(team);
    return matches
      .filter(
        (m) => normalize(m.team1) === norm || normalize(m.team2) === norm,
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.n - b.n);
  }, [team, matches]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 sm:rounded-lg w-full max-w-2xl max-h-full sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
            {team} · Schedule
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close team schedule"
            className="rounded-md border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 text-xs font-medium px-3 py-1.5 transition-colors"
          >
            Close
          </button>
        </div>
        <div className="overflow-auto">
          {teamMatches.length === 0 ? (
            <p className="text-sm text-zinc-500 px-4 py-6">
              No matches found for {team}.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-zinc-500 text-[10px] uppercase tracking-wider">
                <tr className="border-b border-zinc-800">
                  <th className="text-left font-medium px-3 py-2">Date</th>
                  <th className="text-left font-medium px-2 py-2">Local</th>
                  <th className="text-left font-medium px-2 py-2">Match</th>
                  <th className="text-left font-medium px-2 py-2">Venue</th>
                  <th className="text-right font-medium px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {teamMatches.map((m) => {
                  const live = scoreMap[`${m.team1}|${m.team2}`];
                  const score = resolveScore(live, m);
                  const isLive = score?.state === "in";
                  const isFinal = score?.state === "post";
                  return (
                    <tr
                      key={m.n}
                      className="border-b border-zinc-800/60 align-top"
                    >
                      <td className="px-3 py-2 text-zinc-300 whitespace-nowrap">
                        {formatDate(m.date)}
                      </td>
                      <td className="px-2 py-2 text-zinc-400 font-mono tabular-nums whitespace-nowrap">
                        {m.kickoff} {m.tz}
                      </td>
                      <td className="px-2 py-2 text-zinc-200">
                        {m.team1}
                        <span className="text-zinc-500 mx-1.5">vs</span>
                        {m.team2}
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                          {m.stage}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-zinc-400">{m.venue}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {score ? (
                          <span
                            className={
                              "inline-block px-1.5 py-0.5 rounded font-mono font-semibold " +
                              (isLive
                                ? "bg-red-500/15 text-red-300 border border-red-500/40"
                                : isFinal
                                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                                  : "text-zinc-500")
                            }
                          >
                            {isLive && (
                              <span className="inline-block h-1 w-1 rounded-full bg-red-500 animate-pulse mr-1 align-middle" />
                            )}
                            {fmt(score.t1)}–{fmt(score.t2)}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
