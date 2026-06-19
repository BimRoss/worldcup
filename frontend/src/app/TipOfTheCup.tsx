"use client";

import { useEffect, useState } from "react";
import type { USOpenLeaderboard } from "./usopen";

const REFRESH_MS = 180_000;

export function TipOfTheCup({ initial }: { initial: USOpenLeaderboard | null }) {
  const [data, setData] = useState<USOpenLeaderboard | null>(initial);

  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const res = await fetch("/api/usopen", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as { usopen: USOpenLeaderboard | null };
        if (stop) return;
        if (next.usopen) setData(next.usopen);
      } catch {}
    }
    const id = setInterval(tick, REFRESH_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  if (!data || data.leaders.length === 0) return null;
  return (
    <section className="max-w-3xl mx-auto mt-8">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-amber-500/20 bg-amber-500/10 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden>
              🏆
            </span>
            <span className="text-sm font-bold text-amber-100">
              Tip of the Cup, Father&apos;s Day
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-amber-200/70 tabular-nums">
            {data.eventName} · {data.status}
          </span>
        </div>
        <ul className="divide-y divide-amber-500/10">
          <li
            aria-hidden="true"
            className="flex items-center gap-2 px-4 py-1 text-[10px] uppercase tracking-wider text-amber-200/60 bg-amber-500/5"
          >
            <span className="w-8 text-right">Pos</span>
            <span className="flex-1">Player</span>
            <span className="w-12 text-right">To Par</span>
            <span className="w-10 text-right">Thru</span>
          </li>
          {data.leaders.map((l, i) => (
            <li
              key={`${l.name}-${i}`}
              className="flex items-center gap-2 px-4 py-1.5 text-xs"
            >
              <span className="w-8 text-right tabular-nums text-amber-200/80 font-medium">
                {l.position || i + 1}
              </span>
              <span className="flex-1 truncate text-zinc-100">{l.name}</span>
              <span className="w-12 text-right tabular-nums font-bold text-amber-400">
                {l.toPar}
              </span>
              <span className="w-10 text-right tabular-nums text-zinc-500">
                {l.thru}
              </span>
            </li>
          ))}
        </ul>
        <p className="px-4 py-1.5 text-[10px] text-amber-200/50 bg-amber-500/5 border-t border-amber-500/10">
          Refreshes every 3 min. Happy Father&apos;s Day from the World Cup
          crew.
        </p>
      </div>
    </section>
  );
}
