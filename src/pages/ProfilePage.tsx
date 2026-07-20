import { Award, Flame, Lock, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { RANKS } from "../data/ranks";
import { units } from "../data/units";
import { getRankProgress } from "../lib/ranks";
import { toLaDateString } from "../lib/streak";
import { useProgress } from "../hooks/useProgress";
import { ProgressRing } from "../components/ui/ProgressRing";
import { Skeleton } from "../components/ui/Skeleton";

const CALENDAR_DAYS = 28;

function StreakCalendar({ completedAt }: { completedAt: string[] }) {
  const completedDays = new Set(completedAt.map((ts) => toLaDateString(new Date(ts))));
  const today = new Date();
  const days = Array.from({ length: CALENDAR_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (CALENDAR_DAYS - 1 - i));
    return { date: d, laDate: toLaDateString(d) };
  });

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map(({ laDate }) => (
        <div
          key={laDate}
          title={laDate}
          className={`aspect-square rounded-sm ${completedDays.has(laDate) ? "bg-forest-600" : "bg-ink-100"}`}
        />
      ))}
    </div>
  );
}

export function ProfilePage() {
  const { signOut } = useAuth();
  const { loading, profile, streak, currentRank, completedLessonIds, completedAt, passedExamRankIds } = useProgress();

  const badges = [
    { id: "streak3", label: "3-day streak", earned: streak.current >= 3 },
    { id: "streak7", label: "7-day streak", earned: streak.current >= 7 },
    { id: "lessons5", label: "5 lessons done", earned: completedLessonIds.size >= 5 },
    { id: "lessons10", label: "10 lessons done", earned: completedLessonIds.size >= 10 },
    { id: "intern", label: "Intern certified", earned: passedExamRankIds.has(1) },
  ].filter((b) => b.earned);

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
              <p className="label-caps">Last 4 weeks</p>
              <div className="card mt-3 p-4">
                <StreakCalendar completedAt={completedAt} />
              </div>
            </section>

            {badges.length > 0 && (
              <section className="mb-8">
                <p className="label-caps">Badges</p>
                <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                  {badges.map((b) => (
                    <span key={b.id} className="chip shrink-0 border-ink-900 bg-ink-900 text-white">
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
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${earned ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-400"}`}>
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
