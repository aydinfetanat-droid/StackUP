import { useEffect, useState } from "react";
import { Award, Flame, Lock, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-ink-50">
      <header className="bg-ink-950 px-6 pb-7 pt-8 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 font-display text-xl text-white">
            {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl text-white">{profile?.display_name ?? "…"}</h1>
            <p className="truncate text-sm text-white/50">{profile?.school ?? ""}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <div className="flex-1 rounded-md border border-white/15 px-4 py-3">
            <p className="font-display text-lg text-white">{currentRank.title}</p>
            <p className="mt-0.5 text-xs text-white/50">current rank</p>
          </div>
          <div className="flex-1 rounded-md border border-white/15 px-4 py-3">
            <p className="flex items-center gap-1.5 font-display text-lg tabular-nums text-white">
              <Flame size={16} className="text-ochre-400" /> {streak.current}
            </p>
            <p className="mt-0.5 text-xs text-white/50">day streak</p>
          </div>
        </div>
      </header>

      <main className="px-5 pt-6">
        <section className="card mb-8 flex items-center gap-4 border-ochre-200 bg-ochre-50 p-4">
          <Sparkles size={20} className="shrink-0 text-ochre-500" />
          <div>
            <p className="label-caps text-ochre-600">Free plan</p>
            <p className="mt-0.5 font-semibold text-ink-900">Upgrade to Premium</p>
            <p className="mt-0.5 text-sm text-ink-600">Unlock certifications, advanced lessons, and more — coming soon.</p>
          </div>
        </section>

        <section className="mb-8">
          <p className="label-caps">Certifications</p>
          <p className="mt-1 text-sm text-ink-500">Earned automatically when you complete a rank. Viewing your certificate is a Premium feature.</p>

          <div className="mt-4 flex flex-col gap-2.5">
            {RANKS.map((rank) => {
              const progress = loading ? null : getRankProgress(rank.id, completedLessonIds);
              const earned = !loading && (progress?.contentComplete ?? false) && passedExamRankIds.has(rank.id);

              return (
                <div key={rank.id} className={`card flex items-center gap-4 p-4 ${!earned && "opacity-60"}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${earned ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-400"}`}>
                    {earned ? <Award size={17} /> : <Lock size={15} />}
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
          <p className="label-caps">Settings</p>
          <div className="mt-4 flex flex-col gap-2.5">
            <button onClick={() => signOut()} className="card p-4 text-left font-semibold text-ink-700 transition-colors duration-150 hover:border-ink-400">
              Log out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
