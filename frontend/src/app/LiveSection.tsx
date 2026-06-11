"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveMatch, VideoLink } from "./scores";

type FlashKey = string;

function LiveCard({
  m,
  flash,
  goal,
}: {
  m: LiveMatch;
  flash: { home: boolean; away: boolean };
  goal: { side: "home" | "away" } | null;
}) {
  const isLive = m.state === "in";
  const isFinal = m.state === "post";
  const badge = isLive ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      LIVE · {m.shortDetail}
    </span>
  ) : isFinal ? (
    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
      FT
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium">
      {m.shortDetail}
    </span>
  );
  const scoreClass = isLive
    ? "text-white"
    : isFinal
      ? "text-zinc-300"
      : "text-zinc-600";

  return (
    <div className="relative rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-3 overflow-hidden">
      {goal && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          aria-hidden="true"
        >
          <div className="absolute -inset-1 bg-emerald-400/10 animate-goal-flash" />
          <div className="absolute top-1/2 -translate-y-1/2 text-3xl animate-ball-fly select-none">
            ⚽
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 font-extrabold text-sm tracking-widest animate-goal-shout">
            GOAL!
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        {badge}
        <span className="text-xs text-zinc-500 truncate">{m.venue}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{m.homeTeam}</span>
          <span
            className={`text-2xl font-bold tabular-nums ${scoreClass} ${
              flash.home ? "animate-score-flash" : ""
            }`}
          >
            {m.homeScore ?? "–"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{m.awayTeam}</span>
          <span
            className={`text-2xl font-bold tabular-nums ${scoreClass} ${
              flash.away ? "animate-score-flash" : ""
            }`}
          >
            {m.awayScore ?? "–"}
          </span>
        </div>
      </div>
      {m.videos.length > 0 && (
        <div className="border-t border-zinc-800 pt-3 -mx-1 px-1">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            Highlights
          </div>
          <div className="flex flex-col gap-1.5">
            {m.videos.slice(0, 3).map((v: VideoLink) => (
              <a
                key={v.href}
                href={v.href}
                target="_blank"
                rel="noopener"
                className="text-xs text-emerald-400 hover:text-emerald-300 truncate flex items-center gap-1.5"
              >
                <span aria-hidden>▶</span>
                <span className="truncate">{v.headline}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LiveSection({
  initial,
  hasLive: initialHasLive,
}: {
  initial: LiveMatch[];
  hasLive: boolean;
}) {
  const [recent, setRecent] = useState<LiveMatch[]>(initial);
  const [flashes, setFlashes] = useState<
    Record<FlashKey, { home: boolean; away: boolean }>
  >({});
  const [goals, setGoals] = useState<
    Record<FlashKey, { side: "home" | "away" } | null>
  >({});
  const prevScoresRef = useRef<
    Record<FlashKey, { home: number | null; away: number | null }>
  >(
    Object.fromEntries(
      initial.map((m) => [m.id, { home: m.homeScore, away: m.awayScore }]),
    ),
  );

  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const res = await fetch("/api/scoreboard", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { scoreboard: LiveMatch[] };
        const sorted = data.scoreboard.slice().sort((a, b) => {
          const order = { in: 0, pre: 1, post: 2 } as const;
          if (order[a.state] !== order[b.state])
            return order[a.state] - order[b.state];
          return a.kickoffUtc.localeCompare(b.kickoffUtc);
        });
        const next = sorted.slice(0, 8);

        const newFlashes: Record<FlashKey, { home: boolean; away: boolean }> =
          {};
        const newGoals: Record<FlashKey, { side: "home" | "away" } | null> = {};
        for (const m of next) {
          const prev = prevScoresRef.current[m.id];
          const homeUp =
            prev != null &&
            m.homeScore != null &&
            prev.home != null &&
            m.homeScore > prev.home;
          const awayUp =
            prev != null &&
            m.awayScore != null &&
            prev.away != null &&
            m.awayScore > prev.away;
          if (homeUp || awayUp) {
            newFlashes[m.id] = { home: homeUp, away: awayUp };
            newGoals[m.id] = { side: homeUp ? "home" : "away" };
          }
          prevScoresRef.current[m.id] = {
            home: m.homeScore,
            away: m.awayScore,
          };
        }

        if (stop) return;
        setRecent(next);
        if (Object.keys(newFlashes).length > 0) {
          setFlashes(newFlashes);
          setGoals(newGoals);
          setTimeout(() => {
            if (stop) return;
            setFlashes({});
          }, 1600);
          setTimeout(() => {
            if (stop) return;
            setGoals({});
          }, 2400);
        }
      } catch {}
    }
    const id = setInterval(tick, 15000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  if (recent.length === 0) return null;
  const hasLive = recent.some((m) => m.state === "in") || initialHasLive;

  return (
    <section className="max-w-3xl mx-auto mb-12">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
        {hasLive ? (
          <>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Live &amp; Recent
          </>
        ) : (
          "Today"
        )}
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {recent.map((m) => (
          <LiveCard
            key={m.id}
            m={m}
            flash={flashes[m.id] ?? { home: false, away: false }}
            goal={goals[m.id] ?? null}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-600 mt-3">
        Scores refresh every 15 seconds. Source: ESPN.
      </p>
    </section>
  );
}
