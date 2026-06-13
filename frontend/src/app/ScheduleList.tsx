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
  const [highlight, setHighlight] = useState<string>(LA_VENUE);
  const [dateFilter, setDateFilter] = useState<string>("all");

  const chronological = [...grouped].sort(([a], [b]) => a.localeCompare(b));
  const allDates = chronological.map(([d]) => d);

  const cityFiltered: [string, Match[]][] =
    highlight === "all"
      ? chronological
      : chronological
          .map(
            ([d, ms]) =>
              [d, ms.filter((m) => m.venue === highlight)] as [string, Match[]],
          )
          .filter(([, ms]) => ms.length > 0);

  const visible: [string, Match[]][] =
    dateFilter === "all"
      ? cityFiltered
      : cityFiltered.filter(([d]) => d === dateFilter);

  const visibleCount = visible.reduce((acc, [, ms]) => acc + ms.length, 0);

  function renderDay(date: string, dayMatches: Match[]) {
    const dim = date < today;
    return (
      <div key={date}>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-2 mb-3">
          {formatDate(date)}
        </h3>
        <ul className="space-y-2">
          {dayMatches.map((m) => {
            const isHighlighted = highlight !== "all" && m.venue === highlight;
            const live = scoreMap[`${m.team1}|${m.team2}`];
            return (
              <li
                key={m.n}
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
                <span className="font-mono w-24 shrink-0 tabular-nums leading-tight">
                  <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                    {formatDateShort(date)}
                  </span>
                  <span className="block text-sm text-zinc-300">
                    {m.kickoff} {m.tz}
                  </span>
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

      <div className="rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-emerald-500/10 border border-emerald-500/40">
        <span className="text-sm text-emerald-100">
          <span className="font-bold">
            We reached our goal of 100 new users! Thank you!
          </span>{" "}
          <span className="font-bold">FREE</span> week of open testing still
          available, come work with Ross &amp; Joanne, your AI wingers.
        </span>
        <a
          href="https://makeacompany.ai"
          target="_blank"
          rel="noopener"
          className="inline-block rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-3 py-1.5 text-xs transition-colors shrink-0"
        >
          Start now →
        </a>
      </div>

      <div className="space-y-6">
        {visible.map(([date, ms]) => renderDay(date, ms))}
      </div>
    </section>
  );
}
