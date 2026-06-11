"use client";

import { useEffect, useState, type ReactNode } from "react";

export function BracketModal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

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
            Knockout Bracket
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            R32 through Final. Slots fill in as groups conclude.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-md border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider px-3 py-2 transition-colors"
        >
          View bracket
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
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
                Knockout Bracket
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close bracket"
                className="rounded-md border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-300 text-xs font-medium px-3 py-1.5 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="overflow-auto p-4">{children}</div>
          </div>
        </div>
      )}
    </section>
  );
}
