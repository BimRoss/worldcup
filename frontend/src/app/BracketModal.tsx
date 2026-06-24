"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PredictBracket } from "./PredictBracket";
import type { Group } from "./standings";

export function BracketModal({
  children,
  standings,
}: {
  children: ReactNode;
  standings: Group[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"predict" | "live">("predict");

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

  return (
    <section className="max-w-5xl mx-auto mt-16 px-1">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-200">
            Build your bracket
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            Predict every knockout match, then share your picks.
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setTab("predict");
            setOpen(true);
          }}
          className="shrink-0 rounded-md border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider px-3 py-2 transition-colors"
        >
          Predict & share
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
              <div className="flex items-center gap-1 rounded-md border border-zinc-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setTab("predict")}
                  className={
                    "rounded px-3 py-1 text-xs font-semibold transition-colors " +
                    (tab === "predict"
                      ? "bg-emerald-500/20 text-emerald-300"
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
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "text-zinc-400 hover:text-zinc-200")
                  }
                >
                  Live results
                </button>
              </div>
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
              <div className={tab === "predict" ? "" : "hidden"}>
                <PredictBracket standings={standings} />
              </div>
              <div className={tab === "live" ? "" : "hidden"}>{children}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
