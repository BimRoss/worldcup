import { deepestRoundLabel, type ScoredBracket } from "./leaderboard";

function tidyUrl(raw: string): string {
  return raw.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function TierBadge({ tier }: { tier: ScoredBracket["tier"] }) {
  if (tier === "founder") {
    return (
      <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
        Founder
      </span>
    );
  }
  return (
    <span className="rounded-full border border-blue-400/40 bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-300">
      New
    </span>
  );
}

function LeaderCard({ e }: { e: ScoredBracket }) {
  const round = deepestRoundLabel(e.deepestRound);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 p-[1.5px] shadow-[0_0_40px_-8px_rgba(245,197,66,0.55)]">
      <div className="rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 px-5 py-4 text-neutral-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-base font-bold text-amber-300">
              1
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-800/80">
              Bracket Leader
            </span>
          </div>
          <span className="text-2xl leading-none">★</span>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-extrabold leading-tight">
            {e.businessName}
          </div>
          <div className="mt-0.5 text-xs font-medium text-neutral-800/80">
            built by MAC → {tidyUrl(e.businessUrl)}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="text-sm font-medium text-neutral-800/90">
            <span className="text-lg font-bold text-neutral-900">
              {e.correct}
            </span>
            <span className="text-neutral-800/70">/{e.decided} correct</span>
            <div className="text-xs text-neutral-800/70">
              {Math.round(e.accuracy * 100)}% accuracy
              {round ? ` · ${round} reached` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold leading-none tracking-tight">
              {e.points.toLocaleString()}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-800/70">
              pts
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ e }: { e: ScoredBracket }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3">
      <span className="w-5 text-center text-sm font-bold text-neutral-500">
        {e.rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-100">
            {e.businessName}
          </span>
          <TierBadge tier={e.tier} />
        </div>
        <div className="truncate text-xs text-neutral-500">
          built by MAC · {tidyUrl(e.businessUrl)} · {e.correct}/{e.decided}{" "}
          correct
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold tabular-nums text-amber-300">
          {e.points.toLocaleString()}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
          pts
        </div>
      </div>
    </div>
  );
}

export function Leaderboard({
  entries,
  sample = false,
}: {
  entries: ScoredBracket[];
  sample?: boolean;
}) {
  const [leader, ...rest] = entries;
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="text-center">
        <h2 className="text-xl font-extrabold tracking-tight text-amber-300">
          THE GOLDEN BRACKET
        </h2>
        <p className="mt-1 text-xs font-medium text-neutral-400">
          MAC Community · Knockout Round Winner Picks
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        {leader ? <LeaderCard e={leader} /> : null}
        {rest.map((e) => (
          <Row key={e.id} e={e} />
        ))}
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            No brackets scored yet — the board fills in once the Round of 32 kicks
            off.
          </p>
        ) : null}
      </div>

      <div className="mt-5 space-y-1 border-t border-neutral-800 pt-4 text-[11px] leading-relaxed text-neutral-500">
        <p>
          <span className="font-semibold text-amber-300">FOUNDER</span> · first
          100 MAC collaborators &nbsp;·&nbsp;{" "}
          <span className="font-semibold text-blue-300">NEW</span> · joined this
          week
        </p>
        <p>Each correct knockout pick scores; deeper rounds are worth more.</p>
        {sample ? (
          <p className="pt-1 font-semibold uppercase tracking-wide text-neutral-600">
            Mockup · sample data
          </p>
        ) : null}
      </div>
    </div>
  );
}
