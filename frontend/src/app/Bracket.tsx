import { matches, type Match } from "./schedule";
import type { LiveMatch } from "./scores";
import { pairKey } from "./scores";

const STAGES: { key: string; label: string }[] = [
  { key: "Round of 32", label: "R32" },
  { key: "Round of 16", label: "R16" },
  { key: "Quarter-final", label: "QF" },
  { key: "Semi-final", label: "SF" },
  { key: "Final", label: "Final" },
];

function isPlaceholder(team: string): boolean {
  return /^(tbd|round of|winner|loser|w\d|l\d|group\s+)/i.test(team);
}

function BracketMatch({ m, live }: { m: Match; live: LiveMatch | undefined }) {
  const t1Placeholder = isPlaceholder(m.team1);
  const t2Placeholder = isPlaceholder(m.team2);
  const homeIsTeam1 = live
    ? live.homeTeam.toLowerCase().slice(0, 4) ===
      m.team1.toLowerCase().slice(0, 4)
    : true;
  const t1Score = live
    ? homeIsTeam1
      ? live.homeScore
      : live.awayScore
    : null;
  const t2Score = live
    ? homeIsTeam1
      ? live.awayScore
      : live.homeScore
    : null;
  const isLive = live?.state === "in";
  const isFinal = live?.state === "post";

  return (
    <div
      className={
        "rounded-md border text-[11px] " +
        (isLive
          ? "border-red-500/50 bg-red-500/5"
          : isFinal
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-zinc-800 bg-zinc-900/60")
      }
    >
      <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-800/60">
        <span
          className={
            "truncate " +
            (t1Placeholder ? "text-zinc-600 italic" : "text-zinc-100")
          }
        >
          {m.team1}
        </span>
        <span className="font-bold tabular-nums text-zinc-200 ml-2">
          {t1Score ?? "–"}
        </span>
      </div>
      <div className="flex items-center justify-between px-2 py-1">
        <span
          className={
            "truncate " +
            (t2Placeholder ? "text-zinc-600 italic" : "text-zinc-100")
          }
        >
          {m.team2}
        </span>
        <span className="font-bold tabular-nums text-zinc-200 ml-2">
          {t2Score ?? "–"}
        </span>
      </div>
      <div className="px-2 py-0.5 text-[9px] text-zinc-500 border-t border-zinc-800/60 flex items-center justify-between">
        <span className="truncate">{m.venue}</span>
        <span className="font-mono">
          {isLive ? (
            <span className="text-red-400">
              <span className="inline-block h-1 w-1 rounded-full bg-red-500 animate-pulse mr-1 align-middle" />
              LIVE
            </span>
          ) : (
            m.date.slice(5)
          )}
        </span>
      </div>
    </div>
  );
}

export function Bracket({ scoreMap }: { scoreMap: Record<string, LiveMatch> }) {
  const byStage = STAGES.map(({ key, label }) => ({
    key,
    label,
    items: matches.filter((m) => m.stage === key).sort((a, b) => a.n - b.n),
  })).filter((s) => s.items.length > 0);

  if (byStage.length === 0) return null;

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-3">
          {byStage.map((col) => (
            <div key={col.key} className="flex-1 min-w-[180px]">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 px-1">
                {col.label} · {col.items.length}
              </div>
              <div
                className="flex flex-col gap-2"
                style={{
                  justifyContent: "space-around",
                  height: "100%",
                }}
              >
                {col.items.map((m) => {
                  const live = scoreMap[`${m.team1}|${m.team2}`] ?? (() => {
                    if (isPlaceholder(m.team1) || isPlaceholder(m.team2))
                      return undefined;
                    const k = pairKey(m.team1, m.team2);
                    for (const key of Object.keys(scoreMap)) {
                      const v = scoreMap[key];
                      if (
                        v.date === m.date &&
                        pairKey(v.homeTeam, v.awayTeam) === k
                      )
                        return v;
                    }
                    return undefined;
                  })();
                  return <BracketMatch key={m.n} m={m} live={live} />;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-zinc-600 mt-3 px-1">
        Source: schedule + ESPN.
      </p>
    </div>
  );
}
