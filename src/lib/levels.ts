const BASE_LESSON_XP = 20;
const PERFECT_SCORE_BONUS = 10;
const XP_PER_LEVEL = 100;

export function calcLessonXp(scorePercent: number): number {
  return scorePercent === 100 ? BASE_LESSON_XP + PERFECT_SCORE_BONUS : BASE_LESSON_XP;
}

export function xpLevel(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

export function xpProgressInLevel(totalXp: number): { current: number; target: number; percent: number } {
  const current = totalXp % XP_PER_LEVEL;
  return { current, target: XP_PER_LEVEL, percent: Math.round((current / XP_PER_LEVEL) * 100) };
}
