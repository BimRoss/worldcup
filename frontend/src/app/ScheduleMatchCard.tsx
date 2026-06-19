"use client";

import { useEffect, useState } from "react";
import type { Match } from "./schedule";
import type { LiveMatch } from "./scores";

function pairMap(m: Match, live: LiveMatch) {
  const homeIsTeam1 =
    live.homeTeam.toLowerCase().includes(m.team1.toLowerCase().slice(0, 4)) ||
    m.team1.toLowerCase().includes(live.homeTeam.toLowerCase().slice(0, 4));
  return {
    team1Score: homeIsTeam1 ? live.homeScore : live.awayScore,
    team2Score: homeIsTeam1 ? live.awayScore : live.homeScore,
  };
}

export function ScheduleMatchCard({
  m,
  live,
  dim,
  highlight,
}: {
  m: Match;
  live: LiveMatch | undefined;
  dim: boolean;
  highlight: boolean;
}) {
  const state = live?.state ?? "pre";
  const isLive = state === "in";
  const isFinal = state === "post";
  const isPre = state === "pre";

  const [localTime, setLocalTime] = useState<string | null>(null);
  useEffect(() => {
    if (!isPre || !live) {
      setLocalTime(null);
      return;
    }
    try {
      setLocalTime(
        new Date(live.kickoffUtc).toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }),
      );
    } catch {
      setLocalTime(null);
    }
  }, [isPre, live]);

  const badge = isLive ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      LIVE · {live?.shortDetail ?? "—"}
    </span>
  ) : isFinal ? (
    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
      FT
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
      {`${m.kickoff} ${m.tz}`}
    </span>
  );

  const scoreClass = isLive
    ? "text-white"
    : isFinal
      ? "text-zinc-300"
      : "text-zinc-600";

  const { team1Score, team2Score } = live
    ? pairMap(m, live)
    : { team1Score: null, team2Score: null };

  return (
    <div
      className={
        "relative rounded-lg p-4 flex flex-col gap-3 overflow-hidden " +
        (highlight
          ? "bg-emerald-500/10 border border-emerald-500/40"
          : "bg-zinc-900/60 border border-zinc-800") +
        (dim ? " opacity-70" : "")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="text-[10px] font-mono text-zinc-500">#{m.n}</span>
          {badge}
          {isPre && localTime && (
            <span
              suppressHydrationWarning
              className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-medium tabular-nums"
            >
              {localTime}
            </span>
          )}
        </div>
        <span
          className={
            "text-xs truncate " +
            (highlight ? "text-emerald-300" : "text-zinc-500")
          }
        >
          {m.venue}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{m.team1}</span>
          <span className={`text-2xl font-bold tabular-nums ${scoreClass}`}>
            {team1Score ?? "–"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{m.team2}</span>
          <span className={`text-2xl font-bold tabular-nums ${scoreClass}`}>
            {team2Score ?? "–"}
          </span>
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 border-t border-zinc-800/60 pt-2">
        {m.stage}
      </div>
    </div>
  );
}
