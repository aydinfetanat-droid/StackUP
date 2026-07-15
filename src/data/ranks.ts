export interface RankMeta {
  id: number;
  key: string;
  title: string;
  theme: string;
}

export const RANKS: RankMeta[] = [
  { id: 1, key: "intern", title: "Intern", theme: "Money Foundations" },
  { id: 2, key: "associate", title: "Associate", theme: "Protecting & Managing Your Money" },
  { id: 3, key: "vice_president", title: "Vice President", theme: "Growing Your Money" },
  { id: 4, key: "managing_director", title: "Managing Director", theme: "Mastering the System" },
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
