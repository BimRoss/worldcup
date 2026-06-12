"use client";

import { useEffect, useState } from "react";
import type { Group } from "./standings";

function GroupCard({ group }: { group: Group }) {
  const top2 = 2;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/80 text-xs font-semibold uppercase tracking-wider text-zinc-300">
        {group.name}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-zinc-500 text-[10px] uppercase tracking-wider">
            <th className="text-left font-medium px-3 py-1.5 w-6">#</th>
            <th className="text-left font-medium px-1 py-1.5">Team</th>
            <th className="text-right font-medium px-1 py-1.5 w-6">P</th>
            <th className="text-right font-medium px-1 py-1.5 w-6">W</th>
            <th className="text-right font-medium px-1 py-1.5 w-6">D</th>
            <th className="text-right font-medium px-1 py-1.5 w-6">L</th>
            <th className="text-right font-medium px-1 py-1.5 w-8">GD</th>
            <th className="text-right font-medium px-3 py-1.5 w-8">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.entries.map((e, i) => {
            const advancing = i < top2;
            return (
              <tr
                key={e.team}
                className={
                  "border-t border-zinc-800/60 " +
                  (advancing ? "bg-emerald-500/[0.04]" : "")
                }
              >
                <td className="px-3 py-1.5 tabular-nums">
                  {advancing ? (
                    <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded text-[9px] font-bold bg-emerald-500 text-zinc-950">
                      Q
                    </span>
                  ) : (
                    <span className="text-zinc-500">{i + 1}</span>
                  )}
                </td>
                <td
                  className={
                    "px-1 py-1.5 truncate max-w-[10rem] " +
                    (advancing ? "text-emerald-100 font-medium" : "text-zinc-200")
                  }
                >
                  {e.team}
                </td>
                <td className="px-1 py-1.5 text-right text-zinc-400 tabular-nums">
                  {e.played}
                </td>
                <td className="px-1 py-1.5 text-right text-zinc-400 tabular-nums">
                  {e.wins}
                </td>
                <td className="px-1 py-1.5 text-right text-zinc-400 tabular-nums">
                  {e.draws}
                </td>
                <td className="px-1 py-1.5 text-right text-zinc-400 tabular-nums">
                  {e.losses}
                </td>
                <td className="px-1 py-1.5 text-right text-zinc-400 tabular-nums">
                  {e.goalDiff > 0 ? `+${e.goalDiff}` : e.goalDiff}
                </td>
                <td className="px-3 py-1.5 text-right font-semibold text-zinc-100 tabular-nums">
                  {e.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function GroupRankings({ initial }: { initial: Group[] }) {
  const [standings, setStandings] = useState<Group[]>(initial);

  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const res = await fetch("/api/standings", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { standings: Group[] };
        if (stop || data.standings.length === 0) return;
        setStandings(data.standings);
      } catch {}
    }
    const id = setInterval(tick, 60000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  if (standings.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto mt-16">
      <div className="px-1 mb-4 flex items-baseline gap-3 flex-wrap">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Group Rankings
        </h2>
        <span className="text-[10px] text-zinc-500 inline-flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center h-3.5 min-w-[0.875rem] px-1 rounded text-[8px] font-bold bg-emerald-500 text-zinc-950">
            Q
          </span>
          top two qualify for the next round
        </span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {standings.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </div>
      <p className="text-xs text-zinc-600 mt-3 px-1">
        Standings refresh every minute. Source: ESPN.
      </p>
    </section>
  );
}
