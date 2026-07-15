const BASE_LESSON_XP = 20;
const PERFECT_SCORE_BONUS = 10;

export function calcLessonXp(scorePercent: number): number {
  return scorePercent === 100 ? BASE_LESSON_XP + PERFECT_SCORE_BONUS : BASE_LESSON_XP;
}
