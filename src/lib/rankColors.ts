export interface RankColorSet {
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  solid: string;
  badgeBg: string;
  badgeText: string;
  emoji: string;
}

const RANK_COLORS: Record<number, RankColorSet> = {
  1: {
    gradientFrom: "from-brand-400",
    gradientVia: "via-brand-600",
    gradientTo: "to-brand-800",
    solid: "bg-brand-500",
    badgeBg: "bg-brand-100",
    badgeText: "text-brand-700",
    emoji: "🌱",
  },
  2: {
    gradientFrom: "from-sky-400",
    gradientVia: "via-sky-600",
    gradientTo: "to-sky-800",
    solid: "bg-sky-500",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-700",
    emoji: "🛡️",
  },
  3: {
    gradientFrom: "from-grape-400",
    gradientVia: "via-grape-600",
    gradientTo: "to-grape-800",
    solid: "bg-grape-500",
    badgeBg: "bg-grape-100",
    badgeText: "text-grape-700",
    emoji: "📊",
  },
  4: {
    gradientFrom: "from-coral-400",
    gradientVia: "via-coral-600",
    gradientTo: "to-coral-700",
    solid: "bg-coral-500",
    badgeBg: "bg-coral-100",
    badgeText: "text-coral-600",
    emoji: "🏛️",
  },
  5: {
    gradientFrom: "from-gold-300",
    gradientVia: "via-gold-500",
    gradientTo: "to-gold-700",
    solid: "bg-gold-500",
    badgeBg: "bg-gold-100",
    badgeText: "text-gold-700",
    emoji: "👑",
  },
};

export function getRankColors(rankId: number): RankColorSet {
  return RANK_COLORS[rankId] ?? RANK_COLORS[1];
}
