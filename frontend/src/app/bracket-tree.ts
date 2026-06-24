// Canonical 2026 FIFA World Cup knockout bracket.
// Slot sources are fixed by FIFA in advance: where a team finishes its group
// decides exactly which Round-of-32 slot it falls into, and the tree from
// there is deterministic. Verified against the Wikipedia knockout-stage page.

export type Round = "R32" | "R16" | "QF" | "SF" | "Final";

export type Slot =
  | { t: "W"; g: string } // winner of group g
  | { t: "R"; g: string } // runner-up of group g
  | { t: "3"; gs: string[] } // best third place among these groups
  | { t: "M"; n: number }; // winner of match n

export type KMatch = { n: number; round: Round; s1: Slot; s2: Slot };

export const ROUND_LABEL: Record<Round, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  Final: "Final",
};

const W = (g: string): Slot => ({ t: "W", g });
const R = (g: string): Slot => ({ t: "R", g });
const T = (...gs: string[]): Slot => ({ t: "3", gs });
const M = (n: number): Slot => ({ t: "M", n });

export const bracket: KMatch[] = [
  // Round of 32 (matches 73–88)
  { n: 73, round: "R32", s1: R("A"), s2: R("B") },
  { n: 74, round: "R32", s1: W("E"), s2: T("A", "B", "C", "D", "F") },
  { n: 75, round: "R32", s1: W("F"), s2: R("C") },
  { n: 76, round: "R32", s1: W("C"), s2: R("F") },
  { n: 77, round: "R32", s1: W("I"), s2: T("C", "D", "F", "G", "H") },
  { n: 78, round: "R32", s1: R("E"), s2: R("I") },
  { n: 79, round: "R32", s1: W("A"), s2: T("C", "E", "F", "H", "I") },
  { n: 80, round: "R32", s1: W("L"), s2: T("E", "H", "I", "J", "K") },
  { n: 81, round: "R32", s1: W("D"), s2: T("B", "E", "F", "I", "J") },
  { n: 82, round: "R32", s1: W("G"), s2: T("A", "E", "H", "I", "J") },
  { n: 83, round: "R32", s1: R("K"), s2: R("L") },
  { n: 84, round: "R32", s1: W("H"), s2: R("J") },
  { n: 85, round: "R32", s1: W("B"), s2: T("E", "F", "G", "I", "J") },
  { n: 86, round: "R32", s1: W("J"), s2: R("H") },
  { n: 87, round: "R32", s1: W("K"), s2: T("D", "E", "I", "J", "L") },
  { n: 88, round: "R32", s1: R("D"), s2: R("G") },

  // Round of 16 (89–96)
  { n: 89, round: "R16", s1: M(74), s2: M(77) },
  { n: 90, round: "R16", s1: M(73), s2: M(75) },
  { n: 91, round: "R16", s1: M(76), s2: M(78) },
  { n: 92, round: "R16", s1: M(79), s2: M(80) },
  { n: 93, round: "R16", s1: M(83), s2: M(84) },
  { n: 94, round: "R16", s1: M(81), s2: M(82) },
  { n: 95, round: "R16", s1: M(86), s2: M(88) },
  { n: 96, round: "R16", s1: M(85), s2: M(87) },

  // Quarter-finals (97–100)
  { n: 97, round: "QF", s1: M(89), s2: M(90) },
  { n: 98, round: "QF", s1: M(93), s2: M(94) },
  { n: 99, round: "QF", s1: M(91), s2: M(92) },
  { n: 100, round: "QF", s1: M(95), s2: M(96) },

  // Semi-finals (101–102)
  { n: 101, round: "SF", s1: M(97), s2: M(98) },
  { n: 102, round: "SF", s1: M(99), s2: M(100) },

  // Final (104)
  { n: 104, round: "Final", s1: M(101), s2: M(102) },
];

export const ROUNDS: Round[] = ["R32", "R16", "QF", "SF", "Final"];

// Forward dependency map: for each match, every downstream match whose
// participants are derived (directly or transitively) from its winner.
// Used to cascade-clear stale picks when an upstream pick changes.
export const downstream: Record<number, number[]> = (() => {
  const directChildren: Record<number, number[]> = {};
  for (const m of bracket) {
    for (const s of [m.s1, m.s2]) {
      if (s.t === "M") (directChildren[s.n] ??= []).push(m.n);
    }
  }
  const out: Record<number, number[]> = {};
  for (const m of bracket) {
    const seen = new Set<number>();
    const stack = [...(directChildren[m.n] ?? [])];
    while (stack.length) {
      const c = stack.pop()!;
      if (seen.has(c)) continue;
      seen.add(c);
      stack.push(...(directChildren[c] ?? []));
    }
    out[m.n] = [...seen];
  }
  return out;
})();
