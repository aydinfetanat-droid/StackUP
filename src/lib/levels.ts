export interface Level {
  rank: string;
  minXp: number;
}

export const LEVELS: Level[] = [
  { rank: "Rookie", minXp: 0 },
  { rank: "Saver", minXp: 150 },
  { rank: "Budgeter", minXp: 400 },
  { rank: "Investor", minXp: 800 },
  { rank: "Master Investor", minXp: 1500 },
];

export function getLevelForXp(xp: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  return current;
}

export function getNextLevel(xp: number): Level | null {
  const current = getLevelForXp(xp);
  const idx = LEVELS.findIndex((l) => l.rank === current.rank);
  return LEVELS[idx + 1] ?? null;
}

const BASE_LESSON_XP = 20;
const PERFECT_SCORE_BONUS = 10;

export function calcLessonXp(scorePercent: number): number {
  return scorePercent === 100 ? BASE_LESSON_XP + PERFECT_SCORE_BONUS : BASE_LESSON_XP;
}
