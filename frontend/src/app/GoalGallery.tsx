"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Goal } from "./goals";
import { track } from "./track";
import { TrackedLink } from "./TrackedLink";

const STORAGE_KEY = "worldcup-goal-likes-v1";
const EMPTY_RAW = "[]";

const storeListeners = new Set<() => void>();

function subscribeStore(cb: () => void): () => void {
  storeListeners.add(cb);
  return () => {
    storeListeners.delete(cb);
  };
}

function notifyStore() {
  for (const l of [...storeListeners]) l();
}

function getClientSnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_RAW;
  } catch {
    return EMPTY_RAW;
  }
}

function getServerSnapshot(): string {
  return EMPTY_RAW;
}

function parseLikes(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function writeLikes(s: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s)));
    notifyStore();
  } catch {
    // ignore quota / privacy-mode errors
  }
}

function goalLabel(g: Goal): string {
  if (g.isOwnGoal) return "OG";
  if (g.isPenalty) return "PEN";
  if (g.isHeader) return "HEADER";
  return "";
}

function labelClass(g: Goal): string {
  if (g.isOwnGoal) return "bg-red-500/15 text-red-400";
  if (g.isPenalty) return "bg-amber-500/15 text-amber-400";
  return "bg-zinc-800 text-zinc-300";
}

export function GoalGallery({ goals }: { goals: Goal[] }) {
  const raw = useSyncExternalStore(
    subscribeStore,
    getClientSnapshot,
    getServerSnapshot,
  );
  const liked = useMemo(() => parseLikes(raw), [raw]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openId]);

  function toggle(id: string) {
    const next = new Set(liked);
    const action = next.has(id) ? "unvote" : "vote";
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeLikes(next);
    const g = goals.find((x) => x.id === id);
    track("goal_vote", {
      goal_id: id,
      action,
      scorer: g?.scorer,
      team: g?.teamAbbrev || g?.team,
    });
  }

  const open = openId ? (goals.find((g) => g.id === openId) ?? null) : null;

  return (
    <section className="max-w-3xl mx-auto mb-12">
      <div className="mb-3 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Goal of the Tournament
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Every goal scored. Tap to open, then vote for your favorite.
        </p>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
          No goals yet. Tiles appear here the moment one goes in.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {goals.map((g) => {
            const isLiked = liked.has(g.id);
            return (
              <button
                key={g.id}
                onClick={() => {
                  setOpenId(g.id);
                  track("goal_open", {
                    goal_id: g.id,
                    scorer: g.scorer,
                    team: g.teamAbbrev || g.team,
                  });
                }}
                className={`group relative rounded-md border bg-zinc-900/70 p-2 text-left transition-colors ${
                  isLiked
                    ? "border-emerald-500/60"
                    : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {g.teamLogo && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={g.teamLogo}
                      alt={g.teamAbbrev}
                      className="h-5 w-5 shrink-0"
                    />
                  )}
                  <span className="text-[10px] font-bold tabular-nums text-emerald-400 ml-auto">
                    {g.minute}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-semibold leading-tight text-zinc-100 line-clamp-2">
                  {g.scorer}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                    vs {g.opponentAbbrev || g.opponent}
                  </span>
                  {isLiked && (
                    <span aria-hidden className="text-emerald-400 text-xs">
                      ♥
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-emerald-500/10 border border-emerald-500/40">
        <span className="text-sm font-bold text-emerald-100">
          KICK ALS&apos; ASS!
        </span>
        <TrackedLink
          href="https://secure.als.org/donate"
          target="_blank"
          rel="noopener"
          className="inline-block rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-3 py-1.5 text-xs transition-colors shrink-0"
          event="cta_click"
          params={{ cta_id: "donate_als_goal_gallery", link_target: "als" }}
        >
          Donate →
        </TrackedLink>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Goal detail"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setOpenId(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              {open.teamLogo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={open.teamLogo}
                  alt={open.teamAbbrev}
                  className="h-8 w-8 shrink-0"
                />
              )}
              <span className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                {open.teamAbbrev || open.team}
              </span>
              <span className="text-xs text-zinc-600">vs</span>
              {open.opponentLogo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={open.opponentLogo}
                  alt={open.opponentAbbrev}
                  className="h-5 w-5 shrink-0 opacity-70"
                />
              )}
              <span className="text-xs text-zinc-400">
                {open.opponentAbbrev || open.opponent}
              </span>
              <span className="ml-auto text-base font-bold tabular-nums text-emerald-400">
                {open.minute}
              </span>
            </div>

            <div className="mt-4 text-xl font-bold text-zinc-100 leading-tight">
              {open.scorer}
            </div>
            <div className="mt-1">
              <TrackedLink
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  `${open.scorer} goal ${open.teamAbbrev || open.team} vs ${open.opponentAbbrev || open.opponent} World Cup 2026`,
                )}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                event="goal_watch_now"
                params={{
                  goal_id: open.id,
                  scorer: open.scorer,
                  team: open.teamAbbrev || open.team,
                }}
              >
                ▶ Watch Now
              </TrackedLink>
            </div>
            {open.assist && (
              <div className="text-sm text-zinc-400 mt-1">
                assist {open.assist}
              </div>
            )}
            {goalLabel(open) && (
              <div className="mt-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${labelClass(open)}`}
                >
                  {goalLabel(open)}
                </span>
              </div>
            )}
            {open.text && open.text !== open.scorer && (
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                {open.text}
              </p>
            )}

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => toggle(open.id)}
                aria-pressed={liked.has(open.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  liked.has(open.id)
                    ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                    : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                }`}
              >
                <span aria-hidden>{liked.has(open.id) ? "♥" : "♡"}</span>
                {liked.has(open.id) ? "Voted" : "Vote"}
              </button>
              <button
                onClick={() => setOpenId(null)}
                className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 px-3 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-600 mt-3 px-1">
        Votes are saved on this device. Tournament-wide ranking coming next.
      </p>
    </section>
  );
}
