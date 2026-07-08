import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { units } from "../data/units";
import { lessonsById } from "../data/lessons";
import { getLevelForXp, getNextLevel } from "../lib/levels";

export function HomePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("lesson_completions")
      .select("lesson_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setCompletedLessonIds(new Set((data ?? []).map((row) => row.lesson_id as string)));
        setLoadingProgress(false);
      });
  }, [user]);

  const level = getLevelForXp(profile?.xp ?? 0);
  const nextLevel = getNextLevel(profile?.xp ?? 0);
  const xp = profile?.xp ?? 0;

  const progressToNext = useMemo(() => {
    if (!nextLevel) return 1;
    const span = nextLevel.minXp - level.minXp;
    const progressed = xp - level.minXp;
    return Math.min(1, Math.max(0, progressed / span));
  }, [xp, level, nextLevel]);

  // A lesson is unlocked if it's the very first lesson overall, or the lesson
  // immediately before it (within its unit, or the last lesson of the prior
  // unit) has been completed.
  const allLessonIdsInOrder = units.flatMap((u) => u.lessonIds);

  function isLessonUnlocked(lessonId: string): boolean {
    const idx = allLessonIdsInOrder.indexOf(lessonId);
    if (idx <= 0) return true;
    const prevId = allLessonIdsInOrder[idx - 1];
    return completedLessonIds.has(prevId);
  }

  return (
    <div className="min-h-screen bg-ink-100 pb-16">
      <header className="bg-brand-600 px-6 pb-8 pt-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-100">Welcome back</p>
            <h1 className="text-2xl font-extrabold">{profile?.display_name ?? "…"}</h1>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-full bg-brand-700/60 px-3 py-1.5 text-xs font-semibold"
          >
            Log out
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-white/10 p-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{level.rank}</span>
            <span>{xp} XP</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-accent-400 transition-all"
              style={{ width: `${progressToNext * 100}%` }}
            />
          </div>
          {nextLevel && (
            <p className="mt-1.5 text-xs text-brand-100">
              {nextLevel.minXp - xp} XP to {nextLevel.rank}
            </p>
          )}
        </div>
      </header>

      <main className="px-5 pt-6">
        {units.map((unit) => (
          <section key={unit.id} className="mb-8">
            <h2 className="text-lg font-bold text-ink-900">
              Unit {unit.id}: {unit.title}
            </h2>
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
                    className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition active:scale-[0.98] ${
                      unlocked
                        ? "border-ink-300 bg-white shadow-sm"
                        : "border-ink-300 bg-ink-100 opacity-60"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold ${
                        completed
                          ? "bg-brand-500 text-white"
                          : unlocked
                            ? "bg-brand-100 text-brand-700"
                            : "bg-ink-300 text-ink-500"
                      }`}
                    >
                      {completed ? "✓" : unlocked ? lesson.order : "🔒"}
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

        <section className="mb-8">
          <h2 className="text-lg font-bold text-ink-900">Coming soon</h2>
          <div className="mt-4 flex flex-col gap-3">
            {["Certification", "Advanced Lessons"].map((name) => (
              <div
                key={name}
                className="flex items-center gap-4 rounded-2xl border border-dashed border-ink-300 bg-white/60 p-4 opacity-70"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-300 text-xl">
                  🔒
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-700">{name}</p>
                  <p className="text-sm text-ink-500">Premium — coming soon</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
