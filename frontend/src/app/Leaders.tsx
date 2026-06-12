import type { Scorer } from "./leaders";
import { TrackedLink } from "./TrackedLink";

export function Leaders({ scorers }: { scorers: Scorer[] }) {
  return (
    <section className="max-w-5xl mx-auto mt-16 px-2 sm:px-4">
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
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm table-auto">
            <thead>
              <tr className="text-zinc-500 text-[10px] sm:text-[11px] uppercase tracking-wider bg-zinc-900/80">
                <th className="text-left font-medium px-2 sm:px-3 py-2 w-8">#</th>
                <th className="text-left font-medium px-2 py-2">Name</th>
                <th className="text-left font-medium px-2 py-2">Team</th>
                <th className="text-right font-medium px-2 py-2 w-10 sm:w-12">G</th>
                <th className="text-right font-medium px-2 py-2 w-10 sm:w-12">A</th>
                <th className="text-right font-medium px-2 sm:px-3 py-2 w-12 sm:w-14">Pts</th>
                <th className="text-center font-medium px-2 sm:px-3 py-2 w-10 sm:w-12">IG</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((s) => (
                <tr
                  key={`${s.rank}-${s.athleteName}`}
                  className="border-t border-zinc-800/60"
                >
                  <td className="px-2 sm:px-3 py-1.5 text-zinc-500 tabular-nums">
                    {s.rank}
                  </td>
                  <td className="px-2 py-1.5 text-zinc-100 whitespace-nowrap">
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
                      <span className="hidden sm:inline truncate">
                        {s.teamName || s.teamAbbrev}
                      </span>
                      <span className="sm:hidden truncate">
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
                  <td className="px-2 sm:px-3 py-1.5 text-right font-bold text-emerald-400 tabular-nums">
                    {s.points}
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 text-center">
                    <TrackedLink
                      href={s.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      ariaLabel={`Search Instagram for ${s.athleteName}`}
                      className="inline-flex items-center justify-center text-zinc-400 hover:text-pink-400 transition-colors"
                      event="outbound_click"
                      params={{
                        link_target: "instagram_player",
                        athlete: s.athleteName,
                        team: s.teamAbbrev || s.teamName,
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </TrackedLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-zinc-600 mt-3 px-1">
        Stats refresh every 3 minutes. Source: ESPN. IG column links to an Instagram search by name.
      </p>
    </section>
  );
}
