import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { units } from "../data/units";
import { getRank, getNextRank } from "../data/ranks";
import { getUnitsForRank, getRankProgress, getCurrentRankId, isPromotionExamAvailable } from "../lib/ranks";
import { computeStreak } from "../lib/streak";

export function useProgress() {
  const { user, profile } = useAuth();
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [completedAt, setCompletedAt] = useState<string[]>([]);
  const [passedExamRankIds, setPassedExamRankIds] = useState<Set<number>>(new Set());
  const [assessmentPhasesTaken, setAssessmentPhasesTaken] = useState<Set<string>>(new Set());
  const [placedViaTest, setPlacedViaTest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("lesson_completions").select("lesson_id, completed_at").eq("user_id", user.id),
      supabase.from("promotion_exam_attempts").select("rank_id, passed").eq("user_id", user.id).eq("passed", true),
      supabase.from("assessment_attempts").select("phase").eq("user_id", user.id),
      supabase.from("placement_test_attempts").select("passed").eq("user_id", user.id).eq("passed", true).limit(1),
    ]).then(([completions, exams, assessments, placements]) => {
      setCompletedLessonIds(new Set((completions.data ?? []).map((row) => row.lesson_id as string)));
      setCompletedAt((completions.data ?? []).map((row) => row.completed_at as string));
      setPassedExamRankIds(new Set((exams.data ?? []).map((row) => row.rank_id as number)));
      setAssessmentPhasesTaken(new Set((assessments.data ?? []).map((row) => row.phase as string)));
      setPlacedViaTest((placements.data ?? []).length > 0);
      setLoading(false);
    });
  }, [user]);

  const streak = computeStreak(completedAt);
  const currentRankId = getCurrentRankId(completedLessonIds, passedExamRankIds, placedViaTest ? 3 : undefined);
  const currentRank = getRank(currentRankId);
  const nextRank = getNextRank(currentRankId);
  const rankProgress = getRankProgress(currentRankId, completedLessonIds);
  const examAvailable = isPromotionExamAvailable(currentRankId, completedLessonIds) && !passedExamRankIds.has(currentRankId);
  const rankUnits = getUnitsForRank(currentRankId);

  const internProgress = getRankProgress(1, completedLessonIds);
  const internDone = internProgress.contentComplete && passedExamRankIds.has(1);
  const daysSinceSignup = profile ? (Date.now() - new Date(profile.created_at).getTime()) / (24 * 60 * 60 * 1000) : 0;
  const postAssessmentDue = (internDone || daysSinceSignup >= 21) && !assessmentPhasesTaken.has("post");

  const allLessonIdsInOrder = units.flatMap((u) => u.lessonIds);

  function isLessonUnlocked(lessonId: string): boolean {
    const idx = allLessonIdsInOrder.indexOf(lessonId);
    if (idx <= 0) return true;
    const prevId = allLessonIdsInOrder[idx - 1];
    return completedLessonIds.has(prevId);
  }

  const completedUnitsCount = rankUnits.filter((u) => u.lessonIds.every((id) => completedLessonIds.has(id))).length;

  const nextLessonId = allLessonIdsInOrder.find((id) => !completedLessonIds.has(id) && isLessonUnlocked(id));

  const completedToday = streak.completedToday;

  return {
    user,
    profile,
    loading,
    completedLessonIds,
    completedAt,
    passedExamRankIds,
    assessmentPhasesTaken,
    placedViaTest,
    streak,
    currentRankId,
    currentRank,
    nextRank,
    rankProgress,
    examAvailable,
    rankUnits,
    internDone,
    postAssessmentDue,
    isLessonUnlocked,
    completedUnitsCount,
    nextLessonId,
    completedToday,
  };
}
