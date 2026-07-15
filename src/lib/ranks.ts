import { RANKS } from "../data/ranks";
import { units } from "../data/units";

export function getUnitsForRank(rankId: number) {
  return units.filter((u) => u.rankId === rankId).sort((a, b) => a.id - b.id);
}

export function getLessonIdsForRank(rankId: number): string[] {
  return getUnitsForRank(rankId).flatMap((u) => u.lessonIds);
}

export interface RankProgress {
  completedLessons: number;
  totalLessons: number;
  percent: number;
  contentComplete: boolean;
}

export function getRankProgress(rankId: number, completedLessonIds: Set<string>): RankProgress {
  const lessonIds = getLessonIdsForRank(rankId);
  const completedLessons = lessonIds.filter((id) => completedLessonIds.has(id)).length;
  const totalLessons = lessonIds.length;
  const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
  return { completedLessons, totalLessons, percent, contentComplete: totalLessons > 0 && completedLessons === totalLessons };
}

// The user's current rank is the first rank whose content isn't fully complete
// AND whose promotion exam hasn't been passed yet. Nothing is stored redundantly —
// this is derived fresh from lesson_completions + promotion_exam_attempts, same
// pattern as lesson-unlock logic on the home screen. A passed placement test can
// only ever raise this floor to Vice President (rank 3) — never higher.
export function getCurrentRankId(
  completedLessonIds: Set<string>,
  passedExamRankIds: Set<number>,
  placedMinimumRankId?: number,
): number {
  let derived = RANKS[RANKS.length - 1].id;
  for (const rank of RANKS) {
    const progress = getRankProgress(rank.id, completedLessonIds);
    const rankDone = progress.contentComplete && passedExamRankIds.has(rank.id);
    if (!rankDone) {
      derived = rank.id;
      break;
    }
  }
  return placedMinimumRankId ? Math.max(derived, placedMinimumRankId) : derived;
}

export function isPromotionExamAvailable(rankId: number, completedLessonIds: Set<string>): boolean {
  return getRankProgress(rankId, completedLessonIds).contentComplete;
}
