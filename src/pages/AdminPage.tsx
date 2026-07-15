import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { lessonsById } from "../data/lessons";
import { units } from "../data/units";
import { getCurrentRankId } from "../lib/ranks";
import { getRank, RANKS } from "../data/ranks";
import { computeStreak, toLaDateString } from "../lib/streak";

interface ProfileRow {
  id: string;
  display_name: string;
  school: string;
  xp: number;
  created_at: string;
  engaged_seconds: number;
}
interface CompletionRow {
  user_id: string;
  lesson_id: string;
  score: number;
  completed_at: string;
}
interface EventRow {
  user_id: string | null;
  event_type: string;
  created_at: string;
}
interface PromotionAttemptRow {
  user_id: string;
  rank_id: number;
  score: number;
  passed: boolean;
  completed_at: string;
}
interface PlacementAttemptRow {
  user_id: string;
  score: number;
  passed: boolean;
}
interface AssessmentRow {
  user_id: string;
  phase: "pre" | "post";
  score: number;
}

interface Stats {
  profiles: ProfileRow[];
  completions: CompletionRow[];
  events: EventRow[];
  promotionAttempts: PromotionAttemptRow[];
  placementAttempts: PlacementAttemptRow[];
  assessments: AssessmentRow[];
}

function unitTitleForLesson(lessonId: string): string {
  const lesson = lessonsById[lessonId];
  if (!lesson) return "Unknown";
  const unit = units.find((u) => u.id === lesson.unit);
  return unit ? `Unit ${unit.id}: ${unit.title}` : `Unit ${lesson.unit}`;
}

export function AdminPage() {
  const [passcodeInput, setPasscodeInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy stats as text");

  const requiredPasscode = import.meta.env.VITE_ADMIN_PASSCODE;

  function tryUnlock() {
    if (!requiredPasscode) {
      setError("VITE_ADMIN_PASSCODE isn't set in .env.local — add one to enable this page.");
      return;
    }
    if (passcodeInput === requiredPasscode) {
      setUnlocked(true);
      setError(null);
    } else {
      setError("Wrong passcode.");
    }
  }

  useEffect(() => {
    if (!unlocked) return;
    (async () => {
      const [profiles, completions, events, promotionAttempts, placementAttempts, assessments] = await Promise.all([
        supabase.from("profiles").select("id, display_name, school, xp, created_at, engaged_seconds"),
        supabase.from("lesson_completions").select("user_id, lesson_id, score, completed_at"),
        supabase.from("analytics_events").select("user_id, event_type, created_at"),
        supabase.from("promotion_exam_attempts").select("user_id, rank_id, score, passed, completed_at"),
        supabase.from("placement_test_attempts").select("user_id, score, passed"),
        supabase.from("assessment_attempts").select("user_id, phase, score"),
      ]);

      setStats({
        profiles: (profiles.data ?? []) as ProfileRow[],
        completions: (completions.data ?? []) as CompletionRow[],
        events: (events.data ?? []) as EventRow[],
        promotionAttempts: (promotionAttempts.data ?? []) as PromotionAttemptRow[],
        placementAttempts: (placementAttempts.data ?? []) as PlacementAttemptRow[],
        assessments: (assessments.data ?? []) as AssessmentRow[],
      });
    })();
  }, [unlocked]);

  const computed = useMemo(() => {
    if (!stats) return null;
    const { profiles, completions, events, promotionAttempts, placementAttempts, assessments } = stats;

    const totalUsers = profiles.length;

    // DAU for the last 14 days, based on any analytics event that day.
    const dauByDay = new Map<string, Set<string>>();
    for (const e of events) {
      if (!e.user_id) continue;
      const day = toLaDateString(new Date(e.created_at));
      if (!dauByDay.has(day)) dauByDay.set(day, new Set());
      dauByDay.get(day)!.add(e.user_id);
    }
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return toLaDateString(d);
    });
    const dauSeries = last14Days.map((day) => ({ day, count: dauByDay.get(day)?.size ?? 0 }));

    // Lessons completed per day (last 14 days).
    const completionsByDay = new Map<string, number>();
    for (const c of completions) {
      const day = toLaDateString(new Date(c.completed_at));
      completionsByDay.set(day, (completionsByDay.get(day) ?? 0) + 1);
    }
    const lessonsPerDaySeries = last14Days.map((day) => ({ day, count: completionsByDay.get(day) ?? 0 }));

    // Streak distribution: group completions by user, compute streak per user.
    const completionsByUser = new Map<string, string[]>();
    for (const c of completions) {
      if (!completionsByUser.has(c.user_id)) completionsByUser.set(c.user_id, []);
      completionsByUser.get(c.user_id)!.push(c.completed_at);
    }
    let streak3 = 0,
      streak7 = 0,
      streak14 = 0;
    for (const profile of profiles) {
      const streak = computeStreak(completionsByUser.get(profile.id) ?? []);
      if (streak.current >= 3) streak3 += 1;
      if (streak.current >= 7) streak7 += 1;
      if (streak.current >= 14) streak14 += 1;
    }

    // Avg quiz score by unit.
    const scoresByUnit = new Map<string, number[]>();
    for (const c of completions) {
      const title = unitTitleForLesson(c.lesson_id);
      if (!scoresByUnit.has(title)) scoresByUnit.set(title, []);
      scoresByUnit.get(title)!.push(c.score);
    }
    const avgScoreByUnit = Array.from(scoresByUnit.entries())
      .map(([unit, scores]) => ({ unit, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
      .sort((a, b) => a.unit.localeCompare(b.unit));

    // Retention: % of users who signed up 14+ days ago and were active (any
    // completion) between day 15-21 after their signup.
    const eligibleForRetention = profiles.filter(
      (p) => (Date.now() - new Date(p.created_at).getTime()) / 86400000 >= 21,
    );
    const retainedCount = eligibleForRetention.filter((p) => {
      const signupMs = new Date(p.created_at).getTime();
      const userCompletions = completionsByUser.get(p.id) ?? [];
      return userCompletions.some((ts) => {
        const daysSince = (new Date(ts).getTime() - signupMs) / 86400000;
        return daysSince >= 14 && daysSince <= 21;
      });
    }).length;
    const retentionPercent =
      eligibleForRetention.length > 0 ? Math.round((retainedCount / eligibleForRetention.length) * 100) : null;

    // Rank distribution.
    const passedExamRankIdsByUser = new Map<string, Set<number>>();
    for (const a of promotionAttempts) {
      if (!a.passed) continue;
      if (!passedExamRankIdsByUser.has(a.user_id)) passedExamRankIdsByUser.set(a.user_id, new Set());
      passedExamRankIdsByUser.get(a.user_id)!.add(a.rank_id);
    }
    const placedViaTestUsers = new Set(placementAttempts.filter((a) => a.passed).map((a) => a.user_id));
    const rankCounts = new Map<number, number>();
    for (const profile of profiles) {
      const userLessonIds = new Set(
        completions.filter((c) => c.user_id === profile.id).map((c) => c.lesson_id),
      );
      const rankId = getCurrentRankId(
        userLessonIds,
        passedExamRankIdsByUser.get(profile.id) ?? new Set(),
        placedViaTestUsers.has(profile.id) ? 3 : undefined,
      );
      rankCounts.set(rankId, (rankCounts.get(rankId) ?? 0) + 1);
    }
    const rankDistribution = RANKS.map((r) => ({ rank: r.title, count: rankCounts.get(r.id) ?? 0 }));

    // Promotion exam pass rates by rank.
    const promotionByRank = new Map<number, { attempts: number; passed: number }>();
    for (const a of promotionAttempts) {
      if (!promotionByRank.has(a.rank_id)) promotionByRank.set(a.rank_id, { attempts: 0, passed: 0 });
      const stat = promotionByRank.get(a.rank_id)!;
      stat.attempts += 1;
      if (a.passed) stat.passed += 1;
    }
    const promotionPassRates = Array.from(promotionByRank.entries()).map(([rankId, stat]) => ({
      rank: getRank(rankId).title,
      attempts: stat.attempts,
      passRate: Math.round((stat.passed / stat.attempts) * 100),
    }));

    // Placement test stats.
    const placementAttemptCount = placementAttempts.length;
    const placementPassCount = placementAttempts.filter((a) => a.passed).length;
    const placementPassRate = placementAttemptCount > 0 ? Math.round((placementPassCount / placementAttemptCount) * 100) : null;

    // Pre/post assessment improvement.
    const preByUser = new Map<string, number>();
    const postByUser = new Map<string, number>();
    for (const a of assessments) {
      if (a.phase === "pre") preByUser.set(a.user_id, a.score);
      else postByUser.set(a.user_id, a.score);
    }
    const improvements: number[] = [];
    for (const [userId, preScore] of preByUser.entries()) {
      const postScore = postByUser.get(userId);
      if (postScore !== undefined) improvements.push(postScore - preScore);
    }
    const avgImprovement =
      improvements.length > 0 ? Math.round(improvements.reduce((a, b) => a + b, 0) / improvements.length) : null;

    // Engaged time (internal only, admin display permitted).
    const avgEngagedHours =
      totalUsers > 0 ? (profiles.reduce((sum, p) => sum + (p.engaged_seconds ?? 0), 0) / totalUsers / 3600).toFixed(1) : "0";

    return {
      totalUsers,
      dauSeries,
      lessonsPerDaySeries,
      streak3,
      streak7,
      streak14,
      avgScoreByUnit,
      retentionPercent,
      retentionEligible: eligibleForRetention.length,
      rankDistribution,
      promotionPassRates,
      placementAttemptCount,
      placementPassRate,
      avgImprovement,
      improvementSampleSize: improvements.length,
      avgEngagedHours,
    };
  }, [stats]);

  function copyAsText() {
    if (!computed) return;
    const lines = [
      `StackUp pilot stats — ${new Date().toLocaleDateString()}`,
      ``,
      `Total users: ${computed.totalUsers}`,
      `Avg engaged time/user: ${computed.avgEngagedHours}h`,
      ``,
      `Streaks: ${computed.streak3} users at 3+ days, ${computed.streak7} at 7+ days, ${computed.streak14} at 14+ days`,
      ``,
      `Retention (week-1 signups active in week 3): ${computed.retentionPercent ?? "n/a"}% (n=${computed.retentionEligible})`,
      ``,
      `Rank distribution:`,
      ...computed.rankDistribution.map((r) => `  ${r.rank}: ${r.count}`),
      ``,
      `Promotion exam pass rates:`,
      ...computed.promotionPassRates.map((r) => `  ${r.rank}: ${r.passRate}% (${r.attempts} attempts)`),
      ``,
      `Placement test: ${computed.placementAttemptCount} attempts, ${computed.placementPassRate ?? "n/a"}% pass rate`,
      ``,
      `Avg quiz score by unit:`,
      ...computed.avgScoreByUnit.map((u) => `  ${u.unit}: ${u.avg}%`),
      ``,
      `Pre/post assessment avg improvement: ${computed.avgImprovement ?? "n/a"}% (n=${computed.improvementSampleSize})`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy stats as text"), 1500);
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-900 px-6 text-center">
        <p className="text-white/60">🔒 Admin</p>
        <input
          type="password"
          value={passcodeInput}
          onChange={(e) => setPasscodeInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          placeholder="Passcode"
          className="w-full max-w-xs rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-white outline-none"
        />
        {error && <p className="text-sm text-accent-400">{error}</p>}
        <button onClick={tryUnlock} className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white">
          Unlock
        </button>
      </div>
    );
  }

  if (!computed) {
    return <div className="min-h-screen bg-ink-100" />;
  }

  return (
    <div className="min-h-screen bg-ink-100 px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ink-900">StackUp Admin</h1>
          <button onClick={copyAsText} className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-bold text-white">
            {copyLabel}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total users" value={computed.totalUsers} />
          <StatCard label="Avg engaged time" value={`${computed.avgEngagedHours}h`} />
          <StatCard label="3-day streaks" value={computed.streak3} />
          <StatCard label="7-day streaks" value={computed.streak7} />
          <StatCard label="14-day streaks" value={computed.streak14} />
          <StatCard label="Retention (wk1→wk3)" value={computed.retentionPercent !== null ? `${computed.retentionPercent}%` : "n/a"} />
          <StatCard label="Placement pass rate" value={computed.placementPassRate !== null ? `${computed.placementPassRate}%` : "n/a"} />
          <StatCard label="Pre/post avg improvement" value={computed.avgImprovement !== null ? `${computed.avgImprovement}%` : "n/a"} />
        </div>

        <Section title="Daily active users (last 14 days)">
          <MiniBarChart data={computed.dauSeries} />
        </Section>

        <Section title="Lessons completed per day (last 14 days)">
          <MiniBarChart data={computed.lessonsPerDaySeries} />
        </Section>

        <Section title="Rank distribution">
          <div className="flex flex-col gap-1.5">
            {computed.rankDistribution.map((r) => (
              <div key={r.rank} className="flex justify-between text-sm">
                <span className="text-ink-700">{r.rank}</span>
                <span className="font-semibold text-ink-900">{r.count}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Promotion exam pass rates">
          <div className="flex flex-col gap-1.5">
            {computed.promotionPassRates.length === 0 && <p className="text-sm text-ink-500">No attempts yet.</p>}
            {computed.promotionPassRates.map((r) => (
              <div key={r.rank} className="flex justify-between text-sm">
                <span className="text-ink-700">{r.rank}</span>
                <span className="font-semibold text-ink-900">
                  {r.passRate}% ({r.attempts} attempts)
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Average quiz score by unit">
          <div className="flex flex-col gap-1.5">
            {computed.avgScoreByUnit.map((u) => (
              <div key={u.unit} className="flex justify-between text-sm">
                <span className="text-ink-700">{u.unit}</span>
                <span className="font-semibold text-ink-900">{u.avg}%</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-ink-300 bg-white p-4">
      <p className="text-2xl font-extrabold text-ink-900">{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-ink-300 bg-white p-4">
      <h2 className="text-sm font-bold text-ink-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MiniBarChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-24 items-end gap-1">
      {data.map((d) => (
        <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-brand-500"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? "4px" : "1px" }}
            title={`${d.day}: ${d.count}`}
          />
        </div>
      ))}
    </div>
  );
}
