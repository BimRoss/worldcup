// Community leaderboard for the knockout pick'em.
//
// The bracket builder (PredictBracket) is client-only: each player's picks live
// in their own browser (localStorage + the shareable `#b=` hash). To rank a
// community we need (a) a pool of submitted brackets and (b) actual knockout
// results to score them against. This module is the scoring engine for that —
// it takes a set of brackets plus the known results and produces a ranked board.
//
// Until knockouts begin, `fetchKnockoutResults()` returns an empty map and every
// score is 0/0. The demo page seeds a roster + synthetic results so the look is
// live; the math below is the real thing either way.

import { bracket, ROUND_LABEL, type Round } from "./bracket-tree";

export type Tier = "founder" | "new";

// matchNo -> the team the player picked to win that knockout match.
// The value is whatever token id the bracket uses for a participant (e.g.
// "W-A", "R-B", or a resolved team id). Scoring is a string compare, so the
// engine is agnostic to the exact id scheme.
export type BracketPicks = Record<number, string>;

export type Bracket = {
  id: string;
  businessName: string;
  businessUrl: string;
  tier: Tier;
  picks: BracketPicks;
};

// matchNo -> the team that actually won. Sparse: only decided matches appear.
export type KnockoutResults = Record<number, string>;

// Deeper rounds are worth more — calling a final correctly should outweigh a
// Round-of-32 coin flip.
const ROUND_POINTS: Record<Round, number> = {
  R32: 200,
  R16: 350,
  QF: 600,
  SF: 1000,
  Final: 1600,
};

const ROUND_OF: Record<number, Round> = (() => {
  const out: Record<number, Round> = {};
  for (const m of bracket) out[m.n] = m.round;
  return out;
})();

export type ScoredBracket = {
  rank: number;
  id: string;
  businessName: string;
  businessUrl: string;
  tier: Tier;
  correct: number;
  decided: number; // knockout matches with a known result so far
  points: number;
  accuracy: number; // 0..1, correct / decided
  deepestRound: Round | null; // deepest round they called correctly
};

function score(picks: BracketPicks, results: KnockoutResults) {
  let correct = 0;
  let points = 0;
  let deepestRound: Round | null = null;
  let deepestIdx = -1;
  const order: Round[] = ["R32", "R16", "QF", "SF", "Final"];

  for (const [nStr, winner] of Object.entries(results)) {
    const n = Number(nStr);
    if (picks[n] !== winner) continue;
    correct += 1;
    const round = ROUND_OF[n];
    points += ROUND_POINTS[round];
    const idx = order.indexOf(round);
    if (idx > deepestIdx) {
      deepestIdx = idx;
      deepestRound = round;
    }
  }
  return { correct, points, deepestRound };
}

export function buildLeaderboard(
  brackets: Bracket[],
  results: KnockoutResults,
): ScoredBracket[] {
  const decided = Object.keys(results).length;
  const scored = brackets.map((b) => {
    const { correct, points, deepestRound } = score(b.picks, results);
    return {
      id: b.id,
      businessName: b.businessName,
      businessUrl: b.businessUrl,
      tier: b.tier,
      correct,
      decided,
      points,
      accuracy: decided ? correct / decided : 0,
      deepestRound,
      rank: 0,
    };
  });

  scored.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.businessName.localeCompare(b.businessName);
  });
  scored.forEach((s, i) => (s.rank = i + 1));
  return scored;
}

// Short human label for the leader's deepest-round callout, e.g. "Round of 16".
export function deepestRoundLabel(r: Round | null): string | null {
  return r ? ROUND_LABEL[r] : null;
}

// Best-effort live results. Maps completed knockout-stage ESPN events to their
// winner. Returns {} while the tournament is still in group play (the case
// today), so the board renders empty rather than wrong. Wire the real event ->
// match-number map here once the Round of 32 fixtures are set.
export async function fetchKnockoutResults(): Promise<KnockoutResults> {
  return {};
}
