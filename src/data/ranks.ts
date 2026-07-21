export interface RankMeta {
  id: number;
  key: string;
  title: string;
  theme: string;
}

// The full climb, Intern through Master Investor, is designed to take
// roughly this many hours end to end — shown in progress copy so the
// journey feels like a real, substantial career ladder.
export const TOTAL_JOURNEY_HOURS = 65;

export const RANKS: RankMeta[] = [
  { id: 1, key: "intern", title: "Intern", theme: "Money Foundations" },
  { id: 2, key: "analyst", title: "Analyst", theme: "Protecting & Managing Your Money" },
  { id: 3, key: "associate", title: "Associate", theme: "Growing Your Money" },
  { id: 4, key: "investor", title: "Investor", theme: "Mastering the System" },
  { id: 5, key: "master_investor", title: "Master Investor", theme: "Capstone & Certification" },
];

export function getRank(rankId: number): RankMeta {
  const rank = RANKS.find((r) => r.id === rankId);
  if (!rank) throw new Error(`Unknown rank id: ${rankId}`);
  return rank;
}

export function getNextRank(rankId: number): RankMeta | null {
  return RANKS.find((r) => r.id === rankId + 1) ?? null;
}
