import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { units } from "../data/units";
import { lessonsById } from "../data/lessons";
import { getRank, getNextRank } from "../data/ranks";
import { getUnitsForRank, getRankProgress, getCurrentRankId, isPromotionExamAvailable } from "../lib/ranks";
import { computeStreak } from "../lib/streak";
import { getRankColors } from "../lib/rankColors";

export function HomePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [completedAt, setCompletedAt] = useState<string[]>([]);
  const [passedExamRankIds, setPassedExamRankIds] = useState<Set<number>>(new Set());
  const [assessmentPhasesTaken, setAssessmentPhasesTaken] = useState<Set<string>>(new Set());
  const [placedViaTest, setPlacedViaTest] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(true);

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
      setLoadingProgress(false);
    });
  }, [user]);

  useEffect(() => {
    if (loadingProgress) return;
    if (!assessmentPhasesTaken.has("pre")) {
      navigate("/assessment/pre", { replace: true });
    }
  }, [loadingProgress, assessmentPhasesTaken, navigate]);

  const streak = computeStreak(completedAt);

  const currentRankId = getCurrentRankId(completedLessonIds, passedExamRankIds, placedViaTest ? 3 : undefined);
  const currentRank = getRank(currentRankId);
  const nextRank = getNextRank(currentRankId);
  const rankProgress = getRankProgress(currentRankId, completedLessonIds);
  const examAvailable = isPromotionExamAvailable(currentRankId, completedLessonIds) && !passedExamRankIds.has(currentRankId);
  const rankUnits = getUnitsForRank(currentRankId);
  const colors = getRankColors(currentRankId);

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

  return (
    <div className="min-h-screen bg-ink-100">
      <header
        className={`relative overflow-hidden bg-gradient-to-br ${colors.gradientFrom} ${colors.gradientVia} ${colors.gradientTo} px-6 pb-8 pt-8 text-white`}
      >
        <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-14 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white/80">Welcome back</p>
            <h1 className="text-2xl font-extrabold">{profile?.display_name ?? "…"}</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-2xl">
            {colors.emoji}
          </div>
        </div>

        <div className="relative mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>{currentRank.title}</span>
            <span>
              Unit {Math.min(completedUnitsCount + 1, rankUnits.length)} of {rankUnits.length}
            </span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500 transition-all duration-500"
              style={{ width: `${rankProgress.percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-white/80">{rankProgress.percent}% of {currentRank.title} complete</p>
        </div>

        <div className="relative mt-3 flex gap-3">
          <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-400/30">
              <span className={`text-xl ${streak.current > 0 ? "flame-pulse" : ""}`}>🔥</span>
            </div>
            <div>
              <p className="text-lg font-extrabold leading-none">{streak.current}</p>
              <p className="text-xs font-semibold text-white/80">day streak</p>
            </div>
          </div>
        </div>

        {streak.atRisk && (
          <div className="relative mt-3 rounded-2xl bg-gold-400 px-4 py-3 text-sm font-bold text-ink-900 shadow-md">
            🔥 Keep your {streak.current}-day streak alive — finish a lesson today!
          </div>
        )}
      </header>

      <main className="px-5 pt-6">
        {postAssessmentDue && (
          <button
            onClick={() => navigate("/assessment/post")}
            className="btn-chunky btn-chunky--sky mb-6 w-full text-left"
          >
            <p className="text-xs font-semibold text-white/80">Quick check-in</p>
            <p className="mt-0.5 font-extrabold">Take your progress quiz →</p>
          </button>
        )}

        {examAvailable && (
          <button
            onClick={() => navigate("/promotion-exam")}
            className="btn-chunky btn-chunky--gold mb-6 w-full text-left"
          >
            <p className="text-xs font-bold text-ink-700">🎉 All lessons complete</p>
            <p className="mt-0.5 font-extrabold">Take your {currentRank.title} promotion exam →</p>
          </button>
        )}

        {rankUnits.length === 0 && (
          <div className="mb-6 rounded-2xl border-2 border-dashed border-ink-300 bg-white/60 p-4 text-center">
            <p className="font-semibold text-ink-700">You're placed at {currentRank.title}.</p>
            <p className="mt-1 text-sm text-ink-500">Content for this rank isn't published yet — check back soon.</p>
          </div>
        )}

        {rankUnits.map((unit) => (
          <section key={unit.id} className="mb-8">
            <div className="flex items-center gap-2">
              <span className={`rounded-full ${colors.badgeBg} ${colors.badgeText} px-2.5 py-1 text-xs font-extrabold`}>
                UNIT {unit.id}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-extrabold text-ink-900">{unit.title}</h2>
            <p className="mt-0.5 text-sm text-ink-500">{unit.description}</p>

            <div className="mt-4 flex flex-col gap-3">
              {unit.lessonIds.map((lessonId) => {
                const lesson = lessonsById[lessonId];
                if (!lesson) return null;
                const completed = completedLessonIds.has(lessonId);
                const unlocked = loadingProgress || isLessonUnlocked(lessonId);

                return (
                  <button
                    key={lessonId}
                    disabled={!unlocked}
                    onClick={() => navigate(`/lesson/${lessonId}`)}
                    className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition active:scale-[0.98] ${
                      unlocked
                        ? completed
                          ? "border-brand-200 bg-brand-50 shadow-sm"
                          : "border-ink-100 bg-white shadow-sm"
                        : "border-ink-100 bg-ink-100/60 opacity-60"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold ${
                        completed
                          ? "bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md"
                          : unlocked
                            ? `${colors.badgeBg} ${colors.badgeText}`
                            : "bg-ink-200 text-ink-400"
                      }`}
                    >
                      {completed ? "✓" : unlocked ? lesson.order : "🔒"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink-900">{lesson.title}</p>
                      <p className="truncate text-sm text-ink-500">{lesson.summary}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {(currentRankId === 1 || currentRankId === 2) && (
          <section className="mb-8">
            <button
              onClick={() => navigate("/placement-test")}
              className="w-full rounded-2xl border-2 border-grape-200 bg-grape-100/60 p-4 text-left shadow-sm transition active:scale-[0.98]"
            >
              <p className="font-bold text-ink-900">🚀 Already know the basics?</p>
              <p className="mt-0.5 text-sm text-ink-500">Test out and skip ahead to Vice President →</p>
            </button>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-extrabold text-ink-900">Coming soon</h2>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-ink-300 bg-white/60 p-4 opacity-70">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink-300 text-xl">
                🔒
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink-700">Advanced Lessons</p>
                <p className="text-sm text-ink-500">Premium — coming soon</p>
              </div>
            </div>
          </div>
        </section>

        {nextRank && rankProgress.contentComplete && passedExamRankIds.has(currentRankId) && (
          <p className="text-center text-sm text-ink-500">You've been promoted to {nextRank.title}!</p>
        )}
      </main>
    </div>
  );
}
