export interface RankColorSet {
  badgeBg: string;
  badgeText: string;
}

// Ranks are differentiated by title and ordinal, not by color — a single
// consistent neutral treatment reads as more credible than a badge per
// rank, and keeps the palette restrained.
const NEUTRAL: RankColorSet = {
  badgeBg: "bg-ink-100",
  badgeText: "text-ink-700",
};

export function getRankColors(_rankId: number): RankColorSet {
  return NEUTRAL;
}
