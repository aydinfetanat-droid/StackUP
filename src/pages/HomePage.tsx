import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lock, Flame, ArrowRight, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { units } from "../data/units";
import { lessonsById } from "../data/lessons";
import { getRank, getNextRank } from "../data/ranks";
import { getUnitsForRank, getRankProgress, getCurrentRankId, isPromotionExamAvailable } from "../lib/ranks";
import { computeStreak } from "../lib/streak";

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
    <div className="min-h-screen bg-ink-50">
      <header className="bg-ink-950 px-6 pb-7 pt-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-white/50">Welcome back</p>
            <h1 className="mt-1 font-display text-2xl text-white">{profile?.display_name ?? "…"}</h1>
          </div>
          {streak.current > 0 && (
            <div className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 tabular-nums">
              <Flame size={16} className="text-ochre-400" />
              <span className="text-sm font-semibold">{streak.current}</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-display text-base text-white">{currentRank.title}</span>
            <span className="text-white/50">
              Unit {Math.min(completedUnitsCount + 1, rankUnits.length)} of {rankUnits.length}
            </span>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-forest-400 transition-all duration-500" style={{ width: `${rankProgress.percent}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-white/50">{rankProgress.percent}% of {currentRank.title} complete</p>
        </div>

        {streak.atRisk && (
          <div className="mt-5 flex items-center gap-2 rounded-md border border-ochre-400/40 bg-ochre-400/10 px-4 py-3 text-sm text-ochre-100">
            <Flame size={15} className="shrink-0 text-ochre-400" />
            Keep your {streak.current}-day streak alive — finish a lesson today.
          </div>
        )}
      </header>

      <main className="px-5 pt-6">
        {postAssessmentDue && (
          <button onClick={() => navigate("/assessment/post")} className="btn btn-outline mb-6 w-full justify-between text-left">
            <span>
              <span className="block text-xs text-ink-500">Quick check-in</span>
              <span className="mt-0.5 block font-semibold text-ink-900">Take your progress quiz</span>
            </span>
            <ArrowRight size={16} className="text-ink-400" />
          </button>
        )}

        {examAvailable && (
          <button onClick={() => navigate("/promotion-exam")} className="btn btn-ochre mb-6 w-full justify-between text-left">
            <span>
              <span className="block text-xs">All lessons complete</span>
              <span className="mt-0.5 block font-semibold">Take your {currentRank.title} promotion exam</span>
            </span>
            <ArrowRight size={16} />
          </button>
        )}

        {rankUnits.length === 0 && (
          <div className="mb-6 rounded-lg border border-dashed border-ink-300 bg-white p-4 text-center">
            <p className="font-semibold text-ink-700">You're placed at {currentRank.title}.</p>
            <p className="mt-1 text-sm text-ink-500">Content for this rank isn't published yet — check back soon.</p>
          </div>
        )}

        {rankUnits.map((unit) => (
          <section key={unit.id} className="mb-8">
            <p className="label-caps">Unit {String(unit.id).padStart(2, "0")}</p>
            <h2 className="mt-1 font-display text-lg text-ink-900">{unit.title}</h2>
            <p className="mt-0.5 text-sm text-ink-500">{unit.description}</p>

            <div className="mt-4 flex flex-col gap-2.5">
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
                    className={`card flex items-center gap-4 p-4 text-left transition-colors duration-150 ${
                      unlocked ? "hover:border-ink-400" : "opacity-50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold tabular-nums ${
                        completed ? "bg-forest-600 text-white" : unlocked ? "bg-ink-100 text-ink-700" : "bg-ink-100 text-ink-400"
                      }`}
                    >
                      {completed ? <Check size={17} /> : unlocked ? lesson.order : <Lock size={15} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink-900">{lesson.title}</p>
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
            <button onClick={() => navigate("/placement-test")} className="card flex w-full items-center gap-4 p-4 text-left transition-colors duration-150 hover:border-ink-400">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-700">
                <Compass size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900">Already know the basics?</p>
                <p className="mt-0.5 text-sm text-ink-500">Test out and skip ahead to Vice President</p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-ink-400" />
            </button>
          </section>
        )}

        <section className="mb-8">
          <p className="label-caps">Coming soon</p>
          <div className="mt-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-4 rounded-lg border border-dashed border-ink-300 p-4 opacity-60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-400">
                <Lock size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-700">Advanced Lessons</p>
                <p className="text-sm text-ink-500">Premium — coming soon</p>
              </div>
            </div>
          </div>
        </section>

        {nextRank && rankProgress.contentComplete && passedExamRankIds.has(currentRankId) && (
          <p className="text-center text-sm text-ink-500">You've been promoted to {nextRank.title}.</p>
        )}
      </main>
    </div>
  );
}
