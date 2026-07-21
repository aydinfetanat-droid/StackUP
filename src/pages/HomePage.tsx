import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Flame, Check, TrendingUp, TrendingDown } from "lucide-react";
import { useProgress } from "../hooks/useProgress";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { lessonsById } from "../data/lessons";
import { units } from "../data/units";
import { generateDailyNews } from "../lib/news";
import { priceOnDate } from "../lib/market";
import { toLaDateString } from "../lib/streak";
import { ProgressRing } from "../components/ui/ProgressRing";
import { Skeleton } from "../components/ui/Skeleton";

interface Holding {
  ticker: string;
  shares: number;
  avg_cost_stacks: number;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    loading,
    profile,
    streak,
    currentRank,
    nextRank,
    rankProgress,
    examAvailable,
    postAssessmentDue,
    assessmentPhasesTaken,
    nextLessonId,
    completedLessonIds,
    isLessonUnlocked,
  } = useProgress();

  const [portfolio, setPortfolio] = useState<{ value: number; changeToday: number } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!assessmentPhasesTaken.has("pre")) {
      navigate("/assessment/pre", { replace: true });
    }
  }, [loading, assessmentPhasesTaken, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: account }, { data: holdingsData }] = await Promise.all([
        supabase.from("simulator_accounts").select("cash_balance_stacks").eq("user_id", user.id).maybeSingle(),
        supabase.from("holdings").select("ticker, shares, avg_cost_stacks").eq("user_id", user.id).gt("shares", 0),
      ]);
      if (!account) return;
      const holdings = (holdingsData ?? []) as Holding[];
      const today = toLaDateString(new Date());
      const yesterday = toLaDateString(new Date(Date.now() - 86400000));
      const cash = Number(account.cash_balance_stacks);
      const valueToday = cash + holdings.reduce((sum, h) => sum + h.shares * priceOnDate(h.ticker, today), 0);
      const valueYesterday = cash + holdings.reduce((sum, h) => sum + h.shares * priceOnDate(h.ticker, yesterday), 0);
      setPortfolio({ value: valueToday, changeToday: valueToday - valueYesterday });
    })();
  }, [user]);

  const news = useMemo(() => generateDailyNews().slice(0, 3), []);

  const allLessonIdsInOrder = units.flatMap((u) => u.lessonIds);
  const nextLessonIndex = nextLessonId ? allLessonIdsInOrder.indexOf(nextLessonId) : -1;
  const upNext = nextLessonIndex >= 0 ? allLessonIdsInOrder.slice(nextLessonIndex + 1, nextLessonIndex + 3) : [];

  const nextLesson = nextLessonId ? lessonsById[nextLessonId] : undefined;
  const dailyGoalPercent = streak.completedToday ? 100 : 0;

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-onyx-deep px-6 pb-6 pt-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-caps text-white/50">Welcome back</p>
            <h1 className="mt-1 font-display text-2xl text-white">{profile?.display_name ?? "…"}</h1>
          </div>
          <ProgressRing percent={dailyGoalPercent} size={52} strokeWidth={4} trackClassName="text-white/15" fillClassName="text-forest-400">
            {streak.completedToday ? <Check size={18} className="text-forest-300" /> : <span className="text-[10px] font-semibold text-white/70">Goal</span>}
          </ProgressRing>
        </div>

        <div className="mt-6 rounded-md border border-white/15 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-display text-base text-white">{currentRank.title}</span>
            <span className="tabular-nums text-white/50">{rankProgress.percent}%</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-forest-400 transition-all duration-500" style={{ width: `${rankProgress.percent}%` }} />
          </div>
          {nextRank && <p className="mt-1.5 text-xs text-white/50">Next: {nextRank.title}</p>}
        </div>

        <div className="mt-3 flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-3 tabular-nums">
          <Flame size={16} className={streak.current > 0 ? "text-ochre-400" : "text-white/30"} />
          <span className="text-sm font-semibold">{streak.current} day streak</span>
        </div>

        {streak.atRisk && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-ochre-400/40 bg-ochre-400/10 px-4 py-3 text-sm text-ochre-100">
            <Flame size={15} className="shrink-0 text-ochre-400" />
            Keep your {streak.current}-day streak alive — finish a lesson today.
          </div>
        )}
      </header>

      <main className="px-5 pt-6">
        {loading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!loading && postAssessmentDue && (
          <button onClick={() => navigate("/assessment/post")} className="btn btn-outline mb-4 w-full justify-between text-left">
            <span>
              <span className="block text-xs text-ink-500">Quick check-in</span>
              <span className="mt-0.5 block font-semibold text-ink-900">Take your progress quiz</span>
            </span>
            <ArrowRight size={16} className="text-ink-400" />
          </button>
        )}

        {!loading && examAvailable && (
          <button onClick={() => navigate("/promotion-exam")} className="btn btn-ochre mb-4 w-full justify-between text-left">
            <span>
              <span className="block text-xs">All lessons complete</span>
              <span className="mt-0.5 block font-semibold">Take your {currentRank.title} promotion exam</span>
            </span>
            <ArrowRight size={16} />
          </button>
        )}

        {portfolio && (
          <section className="mb-8">
            <p className="label-caps mb-2">StackMarket</p>
            <button onClick={() => navigate("/market")} className="card tap flex w-full items-center gap-4 p-4 text-left">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${portfolio.changeToday >= 0 ? "bg-forest-50 text-forest-600" : "bg-rust-50 text-rust-600"}`}>
                {portfolio.changeToday >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold tabular-nums text-ink-900">{fmt(portfolio.value)} stacks</p>
                <p className={`text-sm tabular-nums ${portfolio.changeToday >= 0 ? "text-forest-600" : "text-rust-600"}`}>
                  {portfolio.changeToday >= 0 ? "+" : ""}
                  {fmt(portfolio.changeToday)} today
                </p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-ink-400" />
            </button>
          </section>
        )}

        {!loading && nextLesson && (
          <section className="mb-8">
            <p className="label-caps mb-2">Continue learning</p>
            <button onClick={() => navigate(`/lesson/${nextLesson.id}`)} className="card tap w-full p-4 text-left elevate-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-onyx text-base font-semibold tabular-nums text-white">
                  {nextLesson.order}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-snug text-ink-900">{nextLesson.title}</p>
                  <p className="mt-0.5 truncate text-sm text-ink-500">{nextLesson.summary}</p>
                </div>
                <ArrowRight size={18} className="shrink-0 text-ink-400" />
              </div>
            </button>

            {upNext.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                {upNext.map((id) => {
                  const lesson = lessonsById[id];
                  if (!lesson) return null;
                  const unlocked = isLessonUnlocked(id);
                  return (
                    <div key={id} className="flex items-center gap-3 px-1 py-1 text-sm text-ink-500">
                      <span className="w-4 shrink-0 text-center tabular-nums text-ink-300">{lesson.order}</span>
                      <span className={unlocked ? "text-ink-600" : "text-ink-400"}>{lesson.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {!loading && !nextLesson && (
          <div className="mb-8 rounded-lg border border-dashed border-ink-300 bg-surface p-4 text-center">
            <p className="font-semibold text-ink-700">You're placed at {currentRank.title}.</p>
            <p className="mt-1 text-sm text-ink-500">Content for this rank isn't published yet — check back soon.</p>
          </div>
        )}

        <section className="mb-8">
          <div className="flex items-center justify-between">
            <p className="label-caps">Today's news</p>
            <button onClick={() => navigate("/news")} className="text-xs font-semibold text-ink-500 hover:text-ink-900">
              See all
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {news.map((item) => (
              <button key={item.id} onClick={() => navigate("/news", { state: { openStoryId: item.id } })} className="card tap flex w-full items-center gap-3 p-3.5 text-left">
                <span className="label-caps w-14 shrink-0">{item.symbol ?? item.category}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">{item.headline}</span>
              </button>
            ))}
          </div>
        </section>

        {!loading && completedLessonIds.size > 0 && (
          <p className="pb-2 text-center text-xs text-ink-400">{completedLessonIds.size} lesson{completedLessonIds.size === 1 ? "" : "s"} completed so far.</p>
        )}
      </main>
    </div>
  );
}
