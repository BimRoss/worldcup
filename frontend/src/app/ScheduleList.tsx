"use client";

import { Fragment, useState } from "react";
import { type Match } from "./schedule";
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

function formatDateShort(iso: string): string {
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

function ScoreBubbles({ live, m }: { live: LiveMatch; m: Match }) {
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
  today,
}: {
  grouped: [string, Match[]][];
  venues: string[];
  scoreMap: Record<string, LiveMatch>;
  today: string;
}) {
  const [highlight, setHighlight] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const chronological = [...grouped].sort(([a], [b]) => a.localeCompare(b));
  const allDates = chronological.map(([d]) => d);

  const cityAll = highlight === "all";
  const dateAll = dateFilter === "all";

  const visible: [string, Match[]][] = chronological
    .filter(([d]) => dateAll || d === dateFilter)
    .map(([d, ms]): [string, Match[]] => [
      d,
      cityAll ? ms : ms.filter((m) => m.venue === highlight),
    ])
    .filter(([, ms]) => ms.length > 0);

  const visibleCount = visible.reduce((acc, [, ms]) => acc + ms.length, 0);

  const nudgeMatchNumbers = new Set<number>();
  {
    let idx = 0;
    for (const [, ms] of visible) {
      for (const m of ms) {
        if (idx > 0 && idx % 5 === 0) nudgeMatchNumbers.add(m.n);
        idx += 1;
      }
    }
  }

  function renderDay(date: string, dayMatches: Match[]) {
    const dim = date < today;
    return (
      <div key={date}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-2 mb-3">
          {formatDate(date)}
        </h3>
        <ul className="space-y-2">
          {dayMatches.map((m) => {
            const isHighlighted = !cityAll && m.venue === highlight;
            const live = scoreMap[`${m.team1}|${m.team2}`];
            const showNudge = nudgeMatchNumbers.has(m.n);
            return (
              <Fragment key={m.n}>
                {showNudge && (
                  <li className="rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-emerald-500/10 border border-emerald-500/40">
                    <span className="text-sm text-emerald-100">
                      While you watch,{" "}
                      <span className="font-bold">launch yours.</span> Make a
                      Company pairs founders with AI co-pilots.
                    </span>
                    <a
                      href="https://makeacompany.ai"
                      target="_blank"
                      rel="noopener"
                      className="inline-block rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-3 py-1.5 text-xs transition-colors shrink-0"
                    >
                      Start now →
                    </a>
                  </li>
                )}
                <li
                  className={
                    "rounded-lg px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 " +
                    (isHighlighted
                      ? "bg-emerald-500/10 border border-emerald-500/40"
                      : "bg-zinc-900/60 border border-zinc-800") +
                    (dim ? " opacity-70" : "")
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
              </Fragment>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Full Schedule
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="uppercase tracking-wider">Date</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All dates</option>
              {allDates.map((d) => (
                <option key={d} value={d}>
                  {formatDateShort(d)}
                  {d === today ? " (today)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="uppercase tracking-wider">City</span>
            <select
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All cities</option>
              {venues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <span className="text-emerald-400 tabular-nums">
              {visibleCount}
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-6">
        {visible.map(([date, ms]) => renderDay(date, ms))}
      </div>
    </section>
  );
}
