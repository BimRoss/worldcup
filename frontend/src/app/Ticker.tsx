import type { NewsItem } from "./news";

export function Ticker({ items }: { items: NewsItem[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items];
  return (
    <div className="bg-zinc-950 border-b border-emerald-500/30 overflow-hidden text-sm">
      <div className="flex items-stretch">
        <div className="shrink-0 bg-emerald-500 text-zinc-950 text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse" />
          News
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="flex animate-ticker whitespace-nowrap py-1.5 w-max">
            {loop.map((n, i) => (
              <a
                key={`${n.link}-${i}`}
                href={n.link}
                target="_blank"
                rel="noopener"
                className="px-5 text-xs text-zinc-300 hover:text-emerald-300 transition-colors border-r border-zinc-800/60 inline-flex items-center gap-2"
              >
                {n.source && (
                  <span className="text-emerald-400 font-semibold">
                    {n.source}
                  </span>
                )}
                <span>{n.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
