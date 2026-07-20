import { useNavigate } from "react-router-dom";
import { Check, Lock, Flame, Compass, Award } from "lucide-react";
import { useProgress } from "../hooks/useProgress";
import { lessonsById } from "../data/lessons";
import { Skeleton } from "../components/ui/Skeleton";

const ZIGZAG = [0, -44, -64, -44, 0, 44, 64, 44];

export function LearnPage() {
  const navigate = useNavigate();
  const {
    loading,
    currentRank,
    currentRankId,
    rankProgress,
    examAvailable,
    rankUnits,
    passedExamRankIds,
    completedLessonIds,
    isLessonUnlocked,
    streak,
  } = useProgress();

  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-ink-950 px-6 pb-6 pt-8 text-white">
        <p className="label-caps text-white/50">Learning path</p>
        <h1 className="mt-1 font-display text-2xl text-white">{currentRank.title}</h1>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-forest-400 transition-all duration-500" style={{ width: `${rankProgress.percent}%` }} />
          </div>
          <span className="flex items-center gap-1 text-xs tabular-nums text-white/60">
            <Flame size={13} className="text-ochre-400" />
            {streak.current}
          </span>
        </div>
      </header>

      <main className="px-5 py-8">
        {loading && (
          <div className="flex flex-col items-center gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-14 rounded-full" />
            ))}
          </div>
        )}

        {!loading && rankUnits.length === 0 && (
          <div className="rounded-lg border border-dashed border-ink-300 bg-white p-4 text-center">
            <p className="font-semibold text-ink-700">You're placed at {currentRank.title}.</p>
            <p className="mt-1 text-sm text-ink-500">Content for this rank isn't published yet — check back soon.</p>
          </div>
        )}

        {!loading &&
          rankUnits.map((unit) => (
            <div key={unit.id} className="mb-10">
              <div className="mb-6 rounded-lg border border-ink-200 bg-white px-4 py-3 text-center elevate-sm">
                <p className="label-caps">Unit {String(unit.id).padStart(2, "0")}</p>
                <h2 className="mt-1 font-display text-lg text-ink-900">{unit.title}</h2>
                <p className="mt-0.5 text-sm text-ink-500">{unit.description}</p>
              </div>

              <div className="relative flex flex-col items-center gap-7">
                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink-200" />
                {unit.lessonIds.map((lessonId) => {
                  const lesson = lessonsById[lessonId];
                  if (!lesson) return null;
                  const completed = completedLessonIds.has(lessonId);
                  const unlocked = isLessonUnlocked(lessonId);
                  const offset = ZIGZAG[globalIndex % ZIGZAG.length];
                  globalIndex += 1;

                  return (
                    <div key={lessonId} className="relative z-10 flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
                      <button
                        disabled={!unlocked}
                        onClick={() => navigate(`/lesson/${lessonId}`)}
                        className={`tap flex h-14 w-14 items-center justify-center rounded-full border-4 text-base font-semibold tabular-nums transition-colors duration-150 ${
                          completed
                            ? "border-forest-100 bg-forest-600 text-white"
                            : unlocked
                              ? "border-ink-100 bg-ink-900 text-white elevate-md"
                              : "border-ink-100 bg-ink-200 text-ink-400"
                        }`}
                      >
                        {completed ? <Check size={20} /> : unlocked ? lesson.order : <Lock size={16} />}
                      </button>
                      <div className="mt-2 max-w-[9rem] text-center">
                        <p className={`text-xs font-semibold ${unlocked ? "text-ink-900" : "text-ink-400"}`}>{lesson.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {examAvailable && rankUnits[rankUnits.length - 1].id === unit.id && (
                <button
                  onClick={() => navigate("/promotion-exam")}
                  className="btn btn-ochre mt-8 w-full justify-between text-left"
                >
                  <span>
                    <span className="block text-xs">All lessons complete</span>
                    <span className="mt-0.5 block font-semibold">Take your {currentRank.title} promotion exam</span>
                  </span>
                  <Award size={18} />
                </button>
              )}
            </div>
          ))}

        {!loading && (currentRankId === 1 || currentRankId === 2) && (
          <button onClick={() => navigate("/placement-test")} className="card flex w-full items-center gap-4 p-4 text-left transition-colors duration-150 hover:border-ink-400">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-700">
              <Compass size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink-900">Already know the basics?</p>
              <p className="mt-0.5 text-sm text-ink-500">Test out and skip ahead to Vice President</p>
            </div>
          </button>
        )}

        {!loading && passedExamRankIds.size === 0 && currentRankId === 1 && (
          <div className="mt-8 flex items-center gap-4 rounded-lg border border-dashed border-ink-300 p-4 opacity-60">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-400">
              <Lock size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink-700">Advanced Lessons</p>
              <p className="text-sm text-ink-500">Premium — coming soon</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
