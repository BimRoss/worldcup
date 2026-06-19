"use client";

import { useEffect, useRef, useState } from "react";

export type MultiOption = {
  value: string;
  label: string;
  sublabel?: string;
};

export function MultiSelectPopover({
  label,
  options,
  selected,
  onChange,
  defaults,
  emptyAllLabel = "All",
  align = "right",
}: {
  label: string;
  options: MultiOption[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  defaults: Set<string>;
  emptyAllLabel?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const total = options.length;
  const count = selected.size;
  const summary =
    count === 0
      ? emptyAllLabel
      : count === total
        ? emptyAllLabel
        : count === 1
          ? options.find((o) => o.value === [...selected][0])?.label ??
            `${count} selected`
          : `${count} selected`;

  function toggle(v: string) {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-200 rounded-md px-2.5 py-1 text-sm focus:outline-none focus:border-emerald-500"
      >
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        <span className="text-zinc-200">{summary}</span>
        <span aria-hidden className="text-zinc-500 text-xs">
          ▾
        </span>
      </button>
      {open && (
        <div
          className={`absolute z-40 mt-1 ${
            align === "right" ? "right-0" : "left-0"
          } w-64 rounded-md border border-zinc-700 bg-zinc-950 shadow-xl overflow-hidden`}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
            <span>{count}/{total}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange(new Set(defaults))}
                className="text-emerald-400 hover:text-emerald-300"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => onChange(new Set())}
                className="text-zinc-400 hover:text-zinc-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => onChange(new Set(options.map((o) => o.value)))}
                className="text-zinc-400 hover:text-zinc-200"
              >
                All
              </button>
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {options.map((o) => {
              const isOn = selected.has(o.value);
              const isDefault = defaults.has(o.value);
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => toggle(o.value)}
                    aria-pressed={isOn}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-zinc-800/60 transition-colors ${
                      isOn ? "text-emerald-100" : "text-zinc-300"
                    }`}
                  >
                    <span
                      className={`flex-none inline-flex items-center justify-center w-4 h-4 rounded border ${
                        isOn
                          ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                          : "border-zinc-700 bg-zinc-900"
                      }`}
                      aria-hidden
                    >
                      {isOn ? "✓" : ""}
                    </span>
                    <span className="flex-1 truncate">{o.label}</span>
                    {o.sublabel && (
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                        {o.sublabel}
                      </span>
                    )}
                    {isDefault && (
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400/70">
                        ★
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
