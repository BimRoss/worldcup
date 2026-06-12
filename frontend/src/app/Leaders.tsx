import type { Scorer } from "./leaders";

export function Leaders({ scorers }: { scorers: Scorer[] }) {
  return (
    <section className="max-w-3xl mx-auto mt-16">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-1 px-1">
        Individual Scoring Leaderboard
      </h2>
      <p className="text-xs text-zinc-500 mb-3 px-1">
        Points = goals × 2 + assists.
      </p>
      {scorers.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
          No stats yet. Leaders populate as the tournament progresses.
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-500 text-[10px] uppercase tracking-wider bg-zinc-900/80">
                <th className="text-left font-medium px-3 py-2 w-8">#</th>
                <th className="text-left font-medium px-1 py-2">Name</th>
                <th className="text-left font-medium px-2 py-2">Team</th>
                <th className="text-right font-medium px-2 py-2 w-10">G</th>
                <th className="text-right font-medium px-2 py-2 w-10">A</th>
                <th className="text-right font-medium px-3 py-2 w-12">Pts</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((s) => (
                <tr
                  key={`${s.rank}-${s.athleteName}`}
                  className="border-t border-zinc-800/60"
                >
                  <td className="px-3 py-1.5 text-zinc-500 tabular-nums">
                    {s.rank}
                  </td>
                  <td className="px-1 py-1.5 truncate text-zinc-100 max-w-[12rem]">
                    {s.athleteName}
                  </td>
                  <td className="px-2 py-1.5 text-zinc-400">
                    <span className="inline-flex items-center gap-1.5">
                      {s.teamLogo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.teamLogo}
                          alt={s.teamAbbrev}
                          className="h-4 w-4 shrink-0"
                        />
                      )}
                      <span className="truncate">
                        {s.teamAbbrev || s.teamName}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right text-zinc-300 tabular-nums">
                    {s.goals}
                  </td>
                  <td className="px-2 py-1.5 text-right text-zinc-300 tabular-nums">
                    {s.assists}
                  </td>
                  <td className="px-3 py-1.5 text-right font-bold text-emerald-400 tabular-nums">
                    {s.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-zinc-600 mt-3 px-1">
        Stats refresh every 3 minutes. Source: ESPN.
      </p>
    </section>
  );
}
