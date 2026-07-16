import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { RANKS, getRank } from "../data/ranks";
import { getCurrentRankId, getRankProgress } from "../lib/ranks";
import { computeStreak } from "../lib/streak";

export function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [completedAt, setCompletedAt] = useState<string[]>([]);
  const [passedExamRankIds, setPassedExamRankIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("lesson_completions").select("lesson_id, completed_at").eq("user_id", user.id),
      supabase.from("promotion_exam_attempts").select("rank_id, passed").eq("user_id", user.id).eq("passed", true),
    ]).then(([completions, exams]) => {
      setCompletedLessonIds(new Set((completions.data ?? []).map((row) => row.lesson_id as string)));
      setCompletedAt((completions.data ?? []).map((row) => row.completed_at as string));
      setPassedExamRankIds(new Set((exams.data ?? []).map((row) => row.rank_id as number)));
      setLoading(false);
    });
  }, [user]);

  const streak = computeStreak(completedAt);
  const currentRankId = getCurrentRankId(completedLessonIds, passedExamRankIds);
  const currentRank = getRank(currentRankId);

  return (
    <div className="min-h-screen bg-ink-100">
      <header className="bg-brand-600 px-6 pb-8 pt-8 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-extrabold">
            {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold">{profile?.display_name ?? "…"}</h1>
            <p className="truncate text-sm text-brand-100">{profile?.school ?? ""}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <div className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-lg font-extrabold leading-none">{currentRank.title}</p>
            <p className="mt-0.5 text-xs text-brand-100">current rank</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-lg font-extrabold leading-none">🔥 {streak.current}</p>
            <p className="mt-0.5 text-xs text-brand-100">day streak</p>
          </div>
        </div>
      </header>

      <main className="px-5 pt-6">
        <section className="mb-8 rounded-2xl border border-accent-400 bg-accent-500/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-600">Free plan</p>
          <p className="mt-1 font-bold text-ink-900">Upgrade to Premium</p>
          <p className="mt-0.5 text-sm text-ink-500">Unlock certifications, advanced lessons, and more — coming soon.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-ink-900">Certifications</h2>
          <p className="mt-0.5 text-sm text-ink-500">Earned automatically when you complete a rank. Viewing your certificate is a Premium feature.</p>

          <div className="mt-4 flex flex-col gap-3">
            {RANKS.map((rank) => {
              const progress = loading ? null : getRankProgress(rank.id, completedLessonIds);
              const earned = !loading && (progress?.contentComplete ?? false) && passedExamRankIds.has(rank.id);

              return (
                <div
                  key={rank.id}
                  className={`flex items-center gap-4 rounded-2xl border p-4 ${
                    earned ? "border-ink-300 bg-white shadow-sm" : "border-dashed border-ink-300 bg-white/50 opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${
                      earned ? "bg-brand-100" : "bg-ink-200"
                    }`}
                  >
                    {earned ? "🏅" : "🔒"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-900">{rank.title} Certification</p>
                    <p className="text-sm text-ink-500">
                      {earned ? "Earned — Premium to view/download" : "Not yet earned"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-ink-900">Settings</h2>
          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={() => signOut()}
              className="w-full rounded-2xl border border-ink-300 bg-white p-4 text-left font-semibold text-ink-700 shadow-sm transition active:scale-[0.98]"
            >
              Log out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
