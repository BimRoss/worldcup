"use client";

import { useState } from "react";
import { LA_VENUE, type Match } from "./schedule";
import type { LiveMatch } from "./scores";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function fmt(n: number | null): string {
  return n == null ? "–" : String(n);
}

function ScoreBubbles({ live, m }: { live: LiveMatch; m: Match }) {
  // ESPN's home/away may not match schedule's team1/team2 ordering. Align by name.
  const homeIsTeam1 =
    live.homeTeam.toLowerCase().includes(m.team1.toLowerCase().slice(0, 4)) ||
    m.team1.toLowerCase().includes(live.homeTeam.toLowerCase().slice(0, 4));
  const t1Score = homeIsTeam1 ? live.homeScore : live.awayScore;
  const t2Score = homeIsTeam1 ? live.awayScore : live.homeScore;
  const isLive = live.state === "in";
  const totalClass = isLive
    ? "bg-red-500/15 text-red-300 border border-red-500/40"
    : "bg-zinc-800 text-zinc-200 border border-zinc-700";

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
      <span className={`px-1.5 py-0.5 rounded font-semibold ${totalClass}`}>
        {isLive && (
          <span className="inline-block h-1 w-1 rounded-full bg-red-500 animate-pulse mr-1 align-middle" />
        )}
        {fmt(t1Score)}–{fmt(t2Score)}
      </span>
    </div>
  );
}

export function ScheduleList({
  grouped,
  venues,
  scoreMap,
}: {
  grouped: [string, Match[]][];
  venues: string[];
  scoreMap: Record<string, LiveMatch>;
}) {
  const [highlight, setHighlight] = useState<string>(LA_VENUE);
  const highlightCount = grouped.reduce(
    (acc, [, ms]) => acc + ms.filter((m) => m.venue === highlight).length,
    0,
  );

  return (
    <section className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Full Schedule
        </h2>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="uppercase tracking-wider">Highlight city</span>
          <select
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
          >
            {venues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <span className="text-emerald-400 tabular-nums">
            {highlightCount}
          </span>
        </label>
      </div>
      {grouped.map(([date, dayMatches]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-2 mb-3">
            {formatDate(date)}
          </h3>
          <ul className="space-y-2">
            {dayMatches.map((m) => {
              const isHighlighted = m.venue === highlight;
              const live = scoreMap[`${m.team1}|${m.team2}`];
              return (
                <li
                  key={m.n}
                  className={
                    "rounded-lg px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 " +
                    (isHighlighted
                      ? "bg-emerald-500/10 border border-emerald-500/40"
                      : "bg-zinc-900/60 border border-zinc-800")
                  }
                >
                  <span className="text-xs font-mono text-zinc-500 w-10 shrink-0">
                    #{m.n}
                  </span>
                  <span className="text-sm font-mono text-zinc-300 w-24 shrink-0 tabular-nums">
                    {m.kickoff} {m.tz}
                  </span>
                  <span className="flex-1 min-w-[12rem] font-medium">
                    {m.team1}
                    <span className="text-zinc-500 mx-2">vs</span>
                    {m.team2}
                  </span>
                  {live && <ScoreBubbles live={live} m={m} />}
                  <span
                    className={
                      "text-xs " +
                      (isHighlighted ? "text-emerald-300" : "text-zinc-500")
                    }
                  >
                    {m.venue} · {m.stage}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
