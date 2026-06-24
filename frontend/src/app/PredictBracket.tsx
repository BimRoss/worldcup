"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  bracket,
  downstream,
  ROUND_LABEL,
  ROUNDS,
  type KMatch,
  type Round,
  type Slot,
} from "./bracket-tree";
import { matches } from "./schedule";
import type { Group } from "./standings";
import { track } from "./track";

type Token = {
  id: string;
  label: string;
  short: string;
  resolved: boolean;
  logo?: string;
};

type Picks = Record<number, string>;

const STORE_KEY = "wc26_bracket_picks_v1";
const BIZ_KEY = "wc26_bracket_biz_v1";

// strip protocol/trailing slash for a clean display label on the share card
function tidyUrl(raw: string): string {
  return raw.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

// venue/date per knockout match, joined from the schedule by match number
const META: Record<number, { venue: string; date: string }> = (() => {
  const out: Record<number, { venue: string; date: string }> = {};
  for (const m of matches) out[m.n] = { venue: m.venue, date: m.date };
  return out;
})();

function groupLetterMap(standings: Group[]): Record<string, Group> {
  const map: Record<string, Group> = {};
  for (const g of standings) {
    const letter = (g.name || g.id || "").trim().slice(-1).toUpperCase();
    if (/[A-L]/.test(letter)) map[letter] = g;
  }
  return map;
}

function encode(picks: Picks): string {
  const s = Object.entries(picks)
    .map(([n, id]) => `${n}:${id}`)
    .join(";");
  if (!s) return "";
  try {
    return btoa(s);
  } catch {
    return "";
  }
}

function decode(raw: string): Picks {
  try {
    const s = atob(raw);
    const out: Picks = {};
    for (const part of s.split(";")) {
      const [n, id] = part.split(":");
      if (n && id) out[Number(n)] = id;
    }
    return out;
  } catch {
    return {};
  }
}

export function PredictBracket({ standings }: { standings: Group[] }) {
  const [picks, setPicks] = useState<Picks>({});
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizUrl, setBizUrl] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  // hydrate after mount (not in a lazy initializer) so server and first client
  // paint match; populating from storage/URL is the whole point of the effect
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const hash = window.location.hash;
    const m = hash.match(/[#&]b=([^&]+)/);
    if (m) {
      const fromUrl = decode(decodeURIComponent(m[1]));
      if (Object.keys(fromUrl).length) {
        setPicks(fromUrl);
        return;
      }
    }
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (stored) setPicks(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(picks));
    } catch {
      /* ignore */
    }
  }, [picks]);

  // hydrate + persist the player's own business promo
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BIZ_KEY);
      if (raw) {
        const b = JSON.parse(raw);
        if (b.name) setBizName(b.name);
        if (b.url) setBizUrl(b.url);
      }
    } catch {
      /* ignore */
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    try {
      localStorage.setItem(BIZ_KEY, JSON.stringify({ name: bizName, url: bizUrl }));
    } catch {
      /* ignore */
    }
  }, [bizName, bizUrl]);

  const byLetter = useMemo(() => groupLetterMap(standings), [standings]);

  const baseToken = useCallback(
    (s: Slot): Token => {
      if (s.t === "W" || s.t === "R") {
        const g = byLetter[s.g];
        const idx = s.t === "W" ? 0 : 1;
        const complete =
          !!g && g.entries.length >= 2 && g.entries.every((e) => e.played >= 3);
        const e = g?.entries[idx];
        const id = `${s.t}-${s.g}`;
        if (complete && e)
          return {
            id,
            label: e.team,
            short: e.abbrev || e.team.slice(0, 3).toUpperCase(),
            resolved: true,
            logo: e.logo || undefined,
          };
        return {
          id,
          label: `${s.t === "W" ? "Winner" : "Runner-up"} Grp ${s.g}`,
          short: `${s.g}${idx + 1}`,
          resolved: false,
        };
      }
      if (s.t === "3") {
        return {
          id: `3-${s.gs.join("")}`,
          label: `3rd: ${s.gs.join("/")}`,
          short: "3rd",
          resolved: false,
        };
      }
      // s.t === "M" handled by the resolver below
      return { id: `M-${s.n}`, label: `Winner ${s.n}`, short: `W${s.n}`, resolved: false };
    },
    [byLetter],
  );

  // resolve both participants of every match, in ascending (dependency) order
  const tokens = useMemo(() => {
    const mt: Record<number, { a: Token; b: Token }> = {};
    const winnerOf = (n: number): Token => {
      const pair = mt[n];
      if (!pair) return { id: `M-${n}`, label: `Winner ${n}`, short: `W${n}`, resolved: false };
      const chosen = picks[n];
      if (chosen === pair.a.id) return pair.a;
      if (chosen === pair.b.id) return pair.b;
      return { id: `M-${n}`, label: `Winner ${n}`, short: `W${n}`, resolved: false };
    };
    const slotToken = (s: Slot): Token => (s.t === "M" ? winnerOf(s.n) : baseToken(s));
    for (const m of bracket) {
      mt[m.n] = { a: slotToken(m.s1), b: slotToken(m.s2) };
    }
    return mt;
  }, [picks, baseToken]);

  const setPick = useCallback((n: number, tokenId: string) => {
    if (tokenId.startsWith("M-")) return; // can't pick an unresolved path slot
    setPicks((prev) => {
      const next: Picks = { ...prev };
      const toggleOff = next[n] === tokenId;
      if (toggleOff) delete next[n];
      else next[n] = tokenId;
      // a changed participant invalidates everything downstream
      for (const d of downstream[n] ?? []) delete next[d];
      track("bracket_pick", { match: n, toggled_off: toggleOff });
      return next;
    });
  }, []);

  const champion = useMemo(() => {
    const f = tokens[104];
    if (!f) return null;
    const chosen = picks[104];
    if (chosen === f.a.id) return f.a;
    if (chosen === f.b.id) return f.b;
    return null;
  }, [tokens, picks]);

  const finalPair = tokens[104];
  const pickedCount = Object.keys(picks).length;

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const enc = encode(picks);
    const base = window.location.origin + window.location.pathname;
    return enc ? `${base}#b=${encodeURIComponent(enc)}` : base;
  }, [picks]);

  // keep the address bar shareable without spamming history
  useEffect(() => {
    if (typeof window === "undefined") return;
    const enc = encode(picks);
    const hash = enc ? `#b=${encodeURIComponent(enc)}` : "";
    window.history.replaceState(null, "", window.location.pathname + hash);
  }, [picks]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      track("bracket_share_link", { picks: pickedCount });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [shareUrl, pickedCount]);

  const download = useCallback(async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#09090b",
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-world-cup-bracket.png";
      a.click();
      track("bracket_download", {
        picks: pickedCount,
        has_biz: !!bizName.trim(),
      });
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }, [pickedCount, bizName]);

  const reset = useCallback(() => {
    setPicks({});
    track("bracket_reset");
  }, []);

  const byRound: Record<Round, KMatch[]> = useMemo(() => {
    const out = { R32: [], R16: [], QF: [], SF: [], Final: [] } as Record<Round, KMatch[]>;
    for (const m of bracket) out[m.round].push(m);
    return out;
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="text-sm font-semibold text-zinc-100">
            Predict the knockouts
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            Tap a team to send them through. {pickedCount} of 31 picked. Seeds
            lock when groups finish June 27.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-md border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-200 text-xs font-medium px-3 py-2 transition-colors"
          >
            {copied ? "Link copied ✓" : "Copy share link"}
          </button>
          <button
            type="button"
            onClick={download}
            disabled={saving}
            className="rounded-md border border-amber-400/60 bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 text-xs font-semibold px-3 py-2 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Download bracket"}
          </button>
          {pickedCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 text-xs px-2 py-2 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90">
          Promote your business
        </div>
        <div className="text-[11px] text-zinc-500 mt-0.5 mb-2">
          Add your name and site — they ride along on the bracket you download
          and share.
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={bizName}
            onChange={(e) => setBizName(e.target.value)}
            placeholder="Your business name"
            maxLength={40}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none"
          />
          <input
            type="text"
            value={bizUrl}
            onChange={(e) => setBizUrl(e.target.value)}
            placeholder="your-website.com"
            maxLength={60}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none"
          />
        </div>
      </div>

      {champion && (
        <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-[0.25em] text-amber-300/80">
            Your champion
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-200 mt-0.5">
            🏆 {champion.label}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-2">
          {ROUNDS.map((round) => (
            <div key={round} className="flex-1 min-w-[190px]">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 px-1">
                {ROUND_LABEL[round]}
              </div>
              <div
                className="flex flex-col gap-2"
                style={{ justifyContent: "space-around", height: "100%" }}
              >
                {byRound[round].map((m) => {
                  const pair = tokens[m.n];
                  const meta = META[m.n];
                  return (
                    <MatchCard
                      key={m.n}
                      n={m.n}
                      a={pair.a}
                      b={pair.b}
                      picked={picks[m.n]}
                      onPick={setPick}
                      venue={meta?.venue}
                      date={meta?.date}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-600 mt-3 px-1">
        Your picks save on this device and ride along in the share link. Group
        winners and runners-up fill in real teams as each group concludes; the
        eight third-place slots resolve once the group stage is complete.
      </p>

      {/* offscreen share card — text only so it renders cleanly to PNG */}
      <ShareCard
        ref={cardRef}
        champion={champion}
        finalA={finalPair?.a.label}
        finalB={finalPair?.b.label}
        bizName={bizName.trim()}
        bizUrl={tidyUrl(bizUrl)}
      />
    </div>
  );
}

function TeamRow({
  token,
  selected,
  dimmed,
  onClick,
}: {
  token: Token;
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  const clickable = !token.id.startsWith("M-");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={
        "w-full flex items-center justify-between gap-2 px-2 py-1.5 text-left transition-colors " +
        (selected
          ? "bg-amber-400/15 "
          : dimmed
            ? "opacity-45 hover:opacity-80 "
            : "hover:bg-zinc-800/60 ") +
        (clickable ? "cursor-pointer" : "cursor-default")
      }
    >
      <span className="flex items-center gap-1.5 min-w-0">
        {token.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={token.logo} alt="" className="h-3.5 w-3.5 object-contain shrink-0" />
        ) : (
          <span className="h-3.5 w-3.5 shrink-0 rounded-sm bg-zinc-800 text-[8px] text-zinc-500 flex items-center justify-center">
            {token.short.slice(0, 2)}
          </span>
        )}
        <span
          className={
            "truncate text-[11px] " +
            (selected
              ? "text-amber-200 font-semibold"
              : token.resolved
                ? "text-zinc-100"
                : "text-zinc-500 italic")
          }
        >
          {token.label}
        </span>
      </span>
      {selected && <span className="text-amber-300 text-[11px] shrink-0">✓</span>}
    </button>
  );
}

function MatchCard({
  n,
  a,
  b,
  picked,
  onPick,
  venue,
  date,
}: {
  n: number;
  a: Token;
  b: Token;
  picked: string | undefined;
  onPick: (n: number, id: string) => void;
  venue?: string;
  date?: string;
}) {
  const hasPick = picked === a.id || picked === b.id;
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <TeamRow
        token={a}
        selected={picked === a.id}
        dimmed={hasPick && picked !== a.id}
        onClick={() => onPick(n, a.id)}
      />
      <div className="border-t border-zinc-800/60" />
      <TeamRow
        token={b}
        selected={picked === b.id}
        dimmed={hasPick && picked !== b.id}
        onClick={() => onPick(n, b.id)}
      />
      <div className="px-2 py-0.5 text-[9px] text-zinc-600 border-t border-zinc-800/60 flex items-center justify-between">
        <span className="truncate">{venue}</span>
        <span className="font-mono">{date ? date.slice(5) : `#${n}`}</span>
      </div>
    </div>
  );
}

const ShareCard = forwardRef<
  HTMLDivElement,
  {
    champion: Token | null;
    finalA?: string;
    finalB?: string;
    bizName?: string;
    bizUrl?: string;
  }
>(function ShareCard({ champion, finalA, finalB, bizName, bizUrl }, ref) {
  return (
    <div style={{ position: "fixed", left: -99999, top: 0 }} aria-hidden>
      <div
        ref={ref}
        style={{
          width: 600,
          padding: 40,
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: 4, color: "#34d399", textTransform: "uppercase" }}>
          A makeacompany.ai project · FIFA 2026
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
          My World Cup Bracket
        </div>
        <div
          style={{
            marginTop: 28,
            padding: 24,
            borderRadius: 12,
            border: "1px solid rgba(251,191,36,0.4)",
            background: "rgba(251,191,36,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: 4, color: "rgba(252,211,77,0.8)", textTransform: "uppercase" }}>
            My champion
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: "#fde68a", marginTop: 6 }}>
            🏆 {champion ? champion.label : "—"}
          </div>
        </div>
        <div style={{ marginTop: 24, fontSize: 16, color: "#d4d4d8" }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#71717a", textTransform: "uppercase", marginBottom: 6 }}>
            My final
          </div>
          {finalA || "—"} <span style={{ color: "#52525b" }}>vs</span> {finalB || "—"}
        </div>
        {(bizName || bizUrl) && (
          <div
            style={{
              marginTop: 28,
              padding: "16px 20px",
              borderRadius: 12,
              border: "1px solid rgba(251,191,36,0.45)",
              background:
                "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(217,119,6,0.06))",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 3,
                color: "rgba(252,211,77,0.85)",
                textTransform: "uppercase",
              }}
            >
              Bracket by
            </div>
            {bizName && (
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#fde68a",
                  marginTop: 4,
                }}
              >
                {bizName}
              </div>
            )}
            {bizUrl && (
              <div style={{ fontSize: 14, color: "#fcd34d", marginTop: 2 }}>
                {bizUrl}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 32, fontSize: 18, fontWeight: 800 }}>
          Make YOUR <span style={{ color: "#34d399" }}>GOAL.</span> Make YOUR{" "}
          <span style={{ color: "#34d399" }}>COMPANY.</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: "#a1a1aa" }}>
          Build your bracket at worldcup.makeacompany.ai
        </div>
      </div>
    </div>
  );
});
