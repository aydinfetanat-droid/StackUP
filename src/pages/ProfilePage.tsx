import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Flame, Lock, Sparkles, Settings, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "../lib/supabase";
import { RANKS } from "../data/ranks";
import { units } from "../data/units";
import { getRankProgress } from "../lib/ranks";
import { priceOnDate } from "../lib/market";
import { toLaDateString } from "../lib/streak";
import { xpLevel, xpProgressInLevel } from "../lib/levels";
import { useProgress } from "../hooks/useProgress";
import { ProgressRing } from "../components/ui/ProgressRing";
import { Skeleton } from "../components/ui/Skeleton";

interface Holding {
  ticker: string;
  shares: number;
  avg_cost_stacks: number;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, streak, currentRank, completedLessonIds, passedExamRankIds, loading } = useProgress();
  const [holdings, setHoldings] = useState<Holding[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("holdings")
      .select("ticker, shares, avg_cost_stacks")
      .eq("user_id", user.id)
      .gt("shares", 0)
      .then(({ data }) => setHoldings((data ?? []) as Holding[]));
  }, [user]);

  const badges = [
    { id: "streak3", label: "3-day streak", earned: streak.current >= 3 },
    { id: "streak7", label: "7-day streak", earned: streak.current >= 7 },
    { id: "lessons5", label: "5 lessons done", earned: completedLessonIds.size >= 5 },
    { id: "lessons10", label: "10 lessons done", earned: completedLessonIds.size >= 10 },
    { id: "intern", label: "Intern certified", earned: passedExamRankIds.has(1) },
  ].filter((b) => b.earned);

  const xp = profile?.xp ?? 0;
  const level = xpLevel(xp);
  const levelProgress = xpProgressInLevel(xp);

  const today = toLaDateString(new Date());
  const lifetimeReturn = (() => {
    if (!holdings || holdings.length === 0) return null;
    const costBasis = holdings.reduce((sum, h) => sum + h.shares * h.avg_cost_stacks, 0);
    if (costBasis <= 0) return null;
    const currentValue = holdings.reduce((sum, h) => sum + h.shares * priceOnDate(h.ticker, today), 0);
    return ((currentValue - costBasis) / costBasis) * 100;
  })();

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-onyx-deep px-6 pb-7 pt-8 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 font-display text-xl text-white">
            {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl text-white">{profile?.display_name ?? "…"}</h1>
            <p className="truncate text-sm text-white/50">{profile?.school ?? ""}</p>
          </div>
          <button onClick={() => navigate("/settings")} aria-label="Settings" className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 hover:bg-white/10">
            <Settings size={16} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-md border border-white/15 px-3 py-3">
            <p className="font-display text-base text-white">{currentRank.title}</p>
            <p className="mt-0.5 text-xs text-white/50">rank</p>
          </div>
          <div className="rounded-md border border-white/15 px-3 py-3">
            <p className="flex items-center gap-1 font-display text-base tabular-nums text-white">
              <Flame size={14} className="text-ochre-400" /> {streak.current}
            </p>
            <p className="mt-0.5 text-xs text-white/50">streak</p>
          </div>
          <div className="rounded-md border border-white/15 px-3 py-3">
            <p className="flex items-center gap-1 font-display text-base tabular-nums text-white">
              <Zap size={14} className="fill-forest-400 text-forest-400" /> {level}
            </p>
            <p className="mt-0.5 text-xs text-white/50">level</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-forest-400 transition-all duration-500" style={{ width: `${levelProgress.percent}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-white/50">
            {levelProgress.current}/{levelProgress.target} XP to level {level + 1}
          </p>
        </div>
      </header>

      <main className="px-5 pt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <section className="card mb-8 flex items-center gap-4 border-ochre-200 bg-ochre-50 p-4">
              <Sparkles size={20} className="shrink-0 text-ochre-500" />
              <div>
                <p className="label-caps text-ochre-600">Free plan</p>
                <p className="mt-0.5 font-semibold text-ink-900">Upgrade to Premium</p>
                <p className="mt-0.5 text-sm text-ink-600">Unlock certifications, advanced lessons, and more — coming soon.</p>
              </div>
            </section>

            <section className="mb-8">
              <p className="label-caps">StackMarket</p>
              <div className="card mt-3 flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${lifetimeReturn !== null && lifetimeReturn >= 0 ? "bg-forest-50 text-forest-600" : lifetimeReturn !== null ? "bg-rust-50 text-rust-600" : "bg-ink-100 text-ink-400"}`}>
                  {lifetimeReturn !== null && lifetimeReturn < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">
                    {lifetimeReturn === null ? "No trades yet" : `${lifetimeReturn >= 0 ? "+" : ""}${lifetimeReturn.toFixed(1)}% lifetime return`}
                  </p>
                  <p className="text-sm text-ink-500">Simulated — virtual currency only</p>
                </div>
              </div>
            </section>

            {badges.length > 0 && (
              <section className="mb-8">
                <p className="label-caps">Badges</p>
                <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                  {badges.map((b) => (
                    <span key={b.id} className="chip shrink-0 border-ink-900 bg-onyx text-white">
                      <Award size={12} />
                      {b.label}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-8">
              <p className="label-caps">Progress by unit</p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {units.map((unit) => {
                  const done = unit.lessonIds.filter((id) => completedLessonIds.has(id)).length;
                  const percent = Math.round((done / unit.lessonIds.length) * 100);
                  return (
                    <div key={unit.id} className="card flex flex-col items-center gap-2 p-3 text-center">
                      <ProgressRing percent={percent} size={44} strokeWidth={4}>
                        <span className="text-[10px] font-semibold tabular-nums text-ink-900">{percent}%</span>
                      </ProgressRing>
                      <p className="line-clamp-2 text-[11px] font-medium leading-tight text-ink-600">{unit.title}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mb-8">
              <p className="label-caps">Certifications</p>
              <p className="mt-1 text-sm text-ink-500">Earned automatically when you complete a rank. Viewing your certificate is a Premium feature.</p>

              <div className="mt-4 flex flex-col gap-2.5">
                {RANKS.map((rank) => {
                  const progress = getRankProgress(rank.id, completedLessonIds);
                  const earned = progress.contentComplete && passedExamRankIds.has(rank.id);

                  return (
                    <div key={rank.id} className={`card flex items-center gap-4 p-4 ${!earned && "opacity-60"}`}>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${earned ? "bg-onyx text-white" : "bg-ink-100 text-ink-400"}`}>
                        {earned ? <Award size={17} /> : <Lock size={15} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900">{rank.title} Certification</p>
                        <p className="text-sm text-ink-500">{earned ? "Earned — Premium to view/download" : "Not yet earned"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        <button onClick={() => navigate("/settings")} className="btn btn-outline w-full">
          Settings
        </button>
      </main>
    </div>
  );
}
