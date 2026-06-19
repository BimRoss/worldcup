"use client";

import { useMemo, useState } from "react";
import { type Match } from "./schedule";
import type { LiveMatch } from "./scores";
import { MultiSelectPopover } from "./MultiSelectPopover";
import { ScheduleMatchCard } from "./ScheduleMatchCard";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function yesterdayOf(today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function ScheduleList({
  grouped,
  venues,
  scoreMap,
  today,
}: {
  grouped: [string, Match[]][];
  venues: string[];
  scoreMap: Record<string, LiveMatch>;
  today: string;
}) {
  const chronological = useMemo(
    () => [...grouped].sort(([a], [b]) => a.localeCompare(b)),
    [grouped],
  );
  const allDates = useMemo(
    () => chronological.map(([d]) => d),
    [chronological],
  );
  const yesterday = useMemo(() => yesterdayOf(today), [today]);
  const defaultDates = useMemo(
    () =>
      new Set(
        allDates.filter((d) => d === today || d === yesterday),
      ),
    [allDates, today, yesterday],
  );
  const defaultCities = useMemo(() => new Set<string>(venues), [venues]);

  const [dateSel, setDateSel] = useState<Set<string>>(defaultDates);
  const [citySel, setCitySel] = useState<Set<string>>(defaultCities);

  const dateOptions = useMemo(
    () =>
      allDates.map((d) => ({
        value: d,
        label: formatDateShort(d),
        sublabel:
          d === today ? "today" : d === yesterday ? "yest" : undefined,
      })),
    [allDates, today, yesterday],
  );
  const cityOptions = useMemo(
    () => venues.map((v) => ({ value: v, label: v })),
    [venues],
  );

  const visible: [string, Match[]][] = useMemo(() => {
    const dateActive = dateSel.size > 0 && dateSel.size < allDates.length;
    const cityActive = citySel.size > 0 && citySel.size < venues.length;
    return chronological
      .filter(([d]) => !dateActive || dateSel.has(d))
      .map(([d, ms]) => {
        const filtered = cityActive
          ? ms.filter((m) => citySel.has(m.venue))
          : ms;
        return [d, filtered] as [string, Match[]];
      })
      .filter(([, ms]) => ms.length > 0);
  }, [chronological, dateSel, citySel, allDates.length, venues.length]);

  const visibleCount = visible.reduce((acc, [, ms]) => acc + ms.length, 0);

  return (
    <section className="max-w-3xl mx-auto mt-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Full Schedule
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <MultiSelectPopover
            label="Date"
            options={dateOptions}
            selected={dateSel}
            onChange={setDateSel}
            defaults={defaultDates}
            emptyAllLabel="All dates"
          />
          <MultiSelectPopover
            label="City"
            options={cityOptions}
            selected={citySel}
            onChange={setCitySel}
            defaults={defaultCities}
            emptyAllLabel="All cities"
          />
          <span className="text-xs text-emerald-400 tabular-nums">
            {visibleCount}
          </span>
        </div>
      </div>

      <div className="rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-emerald-500/10 border border-emerald-500/40">
        <span className="text-sm text-emerald-100">
          While you watch,{" "}
          <span className="font-bold">launch yours.</span> Make a Company pairs
          founders with AI co-pilots.
        </span>
        <a
          href="https://makeacompany.ai"
          target="_blank"
          rel="noopener"
          className="inline-block rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-3 py-1.5 text-xs transition-colors shrink-0"
        >
          Start now →
        </a>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
          No matches match those filters.
        </div>
      ) : (
        <div className="space-y-8">
          {visible.map(([date, ms]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-2 mb-3">
                {formatDate(date)}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {ms.map((m) => {
                  const live = scoreMap[`${m.team1}|${m.team2}`];
                  const dim = date < today;
                  const highlight =
                    citySel.size > 0 &&
                    citySel.size < venues.length &&
                    citySel.has(m.venue);
                  return (
                    <ScheduleMatchCard
                      key={m.n}
                      m={m}
                      live={live}
                      dim={dim}
                      highlight={highlight}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
