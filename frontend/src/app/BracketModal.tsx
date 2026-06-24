"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PredictBracket } from "./PredictBracket";
import type { Group } from "./standings";
import { track } from "./track";

// Short clip shown before bracket entry. Drop a YouTube watch/share URL or a
// direct .mp4 here and the gate turns on automatically; empty = no gate, the
// button opens straight into the bracket (prior behavior).
const INTRO_VIDEO = "";

const INTRO_SEEN_KEY = "wc26_bracket_intro_seen_v1";

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  return m ? m[1] : null;
}

function IntroVideo({ url }: { url: string }) {
  const yt = youtubeId(url);
  if (yt) {
    return (
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 h-full w-full rounded-lg"
          src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`}
          title="Watch before you build your bracket"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <video
      className="w-full rounded-lg"
      src={url}
      autoPlay
      controls
      playsInline
    />
  );
}

export function BracketModal({
  children,
  standings,
}: {
  children: ReactNode;
  standings: Group[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"predict" | "live">("predict");
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const launch = () => {
    setTab("predict");
    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
    } catch {
      /* ignore */
    }
    setEntered(!INTRO_VIDEO || seen);
    setOpen(true);
    track("bracket_open", { gated: !!INTRO_VIDEO && !seen });
  };

  const enterBracket = (skipped: boolean) => {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setEntered(true);
    track("bracket_intro_done", { skipped });
  };

  const gated = open && !entered && !!INTRO_VIDEO;

  return (
    <section className="max-w-3xl mx-auto mb-4">
      <div className="rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-amber-500/10 border border-amber-400/50">
        <span className="text-sm font-bold text-amber-200">
          KNOCK IT OUT
        </span>
        <button
          type="button"
          onClick={launch}
          className="shrink-0 inline-block rounded-md bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-3 py-1.5 text-xs transition-colors"
        >
          Play the Bracket →
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 sm:rounded-lg w-full max-w-7xl max-h-full sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
              {gated ? (
                <div className="text-sm font-semibold text-amber-200">
                  Watch this first
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-md border border-zinc-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => setTab("predict")}
                    className={
                      "rounded px-3 py-1 text-xs font-semibold transition-colors " +
                      (tab === "predict"
                        ? "bg-amber-400/20 text-amber-300"
                        : "text-zinc-400 hover:text-zinc-200")
                    }
                  >
                    My picks
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("live")}
                    className={
                      "rounded px-3 py-1 text-xs font-semibold transition-colors " +
                      (tab === "live"
                        ? "bg-amber-400/20 text-amber-300"
                        : "text-zinc-400 hover:text-zinc-200")
                    }
                  >
                    Live results
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close bracket"
                className="rounded-md border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 text-xs font-medium px-3 py-1.5 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="overflow-auto p-4">
              {gated ? (
                <div className="max-w-3xl mx-auto">
                  <IntroVideo url={INTRO_VIDEO} />
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => enterBracket(true)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => enterBracket(false)}
                      className="rounded-lg border border-amber-300/70 bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-zinc-950 text-sm font-black uppercase tracking-wider px-5 py-2.5 transition-colors"
                    >
                      Enter bracket →
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={tab === "predict" ? "" : "hidden"}>
                    <PredictBracket standings={standings} />
                  </div>
                  <div className={tab === "live" ? "" : "hidden"}>
                    {children}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
