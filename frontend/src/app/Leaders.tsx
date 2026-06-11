import type { LeaderCategory } from "./leaders";

export function Leaders({ categories }: { categories: LeaderCategory[] }) {
  return (
    <section className="max-w-5xl mx-auto mt-16">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 px-1">
        Individual Scoring Stats
      </h2>
      {categories.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
          No stats yet. Leaders populate as the tournament progresses.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((c) => (
            <div
              key={c.name}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/80 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                {c.displayName}
              </div>
              <ul>
                {c.leaders.map((l) => (
                  <li
                    key={`${c.name}-${l.rank}-${l.athleteName}`}
                    className="flex items-center gap-2 px-3 py-1.5 border-t border-zinc-800/60 first:border-t-0 text-xs"
                  >
                    <span className="text-zinc-500 w-4 tabular-nums">
                      {l.rank}
                    </span>
                    {l.teamLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.teamLogo}
                        alt={l.teamAbbrev}
                        className="h-4 w-4 shrink-0"
                      />
                    )}
                    <span className="flex-1 truncate text-zinc-200">
                      {l.athleteName}
                    </span>
                    <span className="font-bold tabular-nums text-emerald-400">
                      {Number.isInteger(l.value) ? l.value : l.value.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-zinc-600 mt-3 px-1">
        Stats refresh every two minutes. Source: ESPN.
      </p>
    </section>
  );
}
