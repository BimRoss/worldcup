import { Leaderboard } from "../Leaderboard";
import {
  buildLeaderboard,
  fetchKnockoutResults,
  type Bracket,
  type BracketPicks,
  type KnockoutResults,
} from "../leaderboard";

export const metadata = {
  title: "The Golden Bracket — MAC Community Leaderboard",
  description: "Knockout-round pick'em standings for the MAC community.",
};

// --- Demo seed -------------------------------------------------------------
// Synthetic results + roster so the board renders populated. Real results come
// from fetchKnockoutResults() once the Round of 32 begins; real brackets come
// from whatever collection point we stand up. Everything below is sample data.

const SAMPLE_RESULTS: KnockoutResults = {
  // Round of 32
  73: "BRA", 74: "FRA", 75: "ARG", 76: "ESP",
  77: "ENG", 78: "POR", 79: "NED", 80: "GER",
  81: "CRO", 82: "BEL", 83: "URU", 84: "MEX",
  85: "USA", 86: "JPN", 87: "MAR", 88: "SEN",
  // Round of 16
  89: "BRA", 90: "ARG", 91: "ESP", 92: "GER",
  // Quarter-final
  97: "BRA",
};

// Build a bracket whose picks match SAMPLE_RESULTS on exactly `correct` matches.
function pickset(correct: number[]): BracketPicks {
  const hits = new Set(correct);
  const picks: BracketPicks = {};
  for (const nStr of Object.keys(SAMPLE_RESULTS)) {
    const n = Number(nStr);
    picks[n] = hits.has(n) ? SAMPLE_RESULTS[n] : "—";
  }
  return picks;
}

const R32 = [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88];

const SAMPLE_BRACKETS: Bracket[] = [
  {
    id: "protexionist",
    businessName: "Protexionist Labs",
    businessUrl: "protexionist.com",
    tier: "founder",
    picks: pickset([...R32.slice(0, 15), 89, 90, 91, 97]),
  },
  {
    id: "harborview",
    businessName: "Harborview Roasters",
    businessUrl: "harborview.coffee",
    tier: "founder",
    picks: pickset([...R32.slice(0, 14), 89, 90]),
  },
  {
    id: "volt",
    businessName: "Volt Fitness Co.",
    businessUrl: "voltfitness.app",
    tier: "new",
    picks: pickset([...R32.slice(0, 12), 89, 90]),
  },
  {
    id: "cedar",
    businessName: "Cedar & Pine Studio",
    businessUrl: "cedarpine.studio",
    tier: "founder",
    picks: pickset([...R32.slice(0, 13), 89]),
  },
  {
    id: "marigold",
    businessName: "Marigold Bakehouse",
    businessUrl: "marigold.bakery",
    tier: "new",
    picks: pickset(R32.slice(0, 11)),
  },
  {
    id: "northgate",
    businessName: "Northgate Legal",
    businessUrl: "northgate.legal",
    tier: "founder",
    picks: pickset(R32.slice(0, 9)),
  },
];

export const revalidate = 60;

export default async function LeaderboardPage() {
  // Real results when they exist; fall back to the sample so the demo renders.
  const live = await fetchKnockoutResults();
  const hasLive = Object.keys(live).length > 0;
  const results = hasLive ? live : SAMPLE_RESULTS;
  const entries = buildLeaderboard(SAMPLE_BRACKETS, results);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10">
      <Leaderboard entries={entries} sample={!hasLive} />
    </main>
  );
}
