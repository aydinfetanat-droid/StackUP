import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { getRank, getNextRank } from "../data/ranks";
import { getCurrentRankId } from "../lib/ranks";
import { drawExamQuestions } from "../data/exams";
import type { ExamQuestion } from "../types/exam";

const QUESTION_COUNT = 20;
const EXAM_SECONDS = 20 * 60;
const PASS_THRESHOLD = 0.75;
const COOLDOWN_HOURS = 24;

type Stage = "loading" | "cooldown" | "intro" | "in-progress" | "finished";

export function PromotionExamPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("loading");
  const [rankId, setRankId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SECONDS);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [completions, exams] = await Promise.all([
        supabase.from("lesson_completions").select("lesson_id").eq("user_id", user.id),
        supabase.from("promotion_exam_attempts").select("rank_id, passed").eq("user_id", user.id).eq("passed", true),
      ]);
      const completedLessonIds = new Set((completions.data ?? []).map((r) => r.lesson_id as string));
      const passedRankIds = new Set((exams.data ?? []).map((r) => r.rank_id as number));
      const currentRankId = getCurrentRankId(completedLessonIds, passedRankIds);
      setRankId(currentRankId);

      const { data: latestAttempt } = await supabase
        .from("promotion_exam_attempts")
        .select("completed_at, passed")
        .eq("user_id", user.id)
        .eq("rank_id", currentRankId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestAttempt && !latestAttempt.passed) {
        const completedAt = new Date(latestAttempt.completed_at);
        const cooldownEnd = new Date(completedAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
        if (cooldownEnd > new Date()) {
          setCooldownUntil(cooldownEnd);
          setStage("cooldown");
          return;
        }
      }
      setStage("intro");
    })();
  }, [user]);

  useEffect(() => {
    if (stage !== "in-progress") return;
    if (secondsLeft <= 0) {
      finishExam();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, secondsLeft]);

  function startExam() {
    if (!rankId) return;
    finishedRef.current = false;
    const drawn = drawExamQuestions(rankId, QUESTION_COUNT);
    setQuestions(drawn);
    setAnswers(new Array(drawn.length).fill(null));
    setIndex(0);
    setSecondsLeft(EXAM_SECONDS);
    setStage("in-progress");
  }

  function selectAnswer(choiceIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = choiceIndex;
      return next;
    });
  }

  function goNext() {
    if (index + 1 >= questions.length) {
      finishExam();
    } else {
      setIndex(index + 1);
    }
  }

  async function finishExam() {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const correct = questions.filter((q, i) => answers[i] === q.correctIndex).length;
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = questions.length > 0 && correct / questions.length >= PASS_THRESHOLD;

    if (user && rankId) {
      await supabase.from("promotion_exam_attempts").insert({
        user_id: user.id,
        rank_id: rankId,
        score,
        passed,
      });
    }

    setResult({ score, passed });
    setStage("finished");
  }

  const rank = rankId ? getRank(rankId) : null;
  const nextRank = rankId ? getNextRank(rankId) : null;

  const timeLabel = useMemo(() => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [secondsLeft]);

  if (stage === "loading" || !rank) {
    return <div className="min-h-screen bg-ink-100" />;
  }

  if (stage === "cooldown" && cooldownUntil) {
    const hoursLeft = Math.max(1, Math.ceil((cooldownUntil.getTime() - Date.now()) / (60 * 60 * 1000)));
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-100 px-6 text-center">
        <p className="text-4xl">⏳</p>
        <p className="text-lg font-bold text-ink-900">Not quite yet</p>
        <p className="text-sm text-ink-500">
          You can retake the {rank.title} promotion exam in about {hoursLeft}h.
        </p>
        <button onClick={() => navigate("/")} className="mt-2 font-semibold text-brand-600">
          Back home
        </button>
      </div>
    );
  }

  if (stage === "intro") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-100 px-6 text-center">
        <p className="text-4xl">📋</p>
        <p className="text-lg font-bold text-ink-900">{rank.title} Promotion Exam</p>
        <p className="max-w-xs text-sm text-ink-500">
          {QUESTION_COUNT} questions, {EXAM_SECONDS / 60} minutes, {Math.round(PASS_THRESHOLD * 100)}% to pass. If you
          don't pass, you can try again in 24 hours.
        </p>
        <button
          onClick={startExam}
          className="mt-4 w-full max-w-xs rounded-xl bg-brand-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.98]"
        >
          Start exam
        </button>
      </div>
    );
  }

  if (stage === "finished" && result) {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center px-6 text-center text-white ${
          result.passed ? "bg-brand-600" : "bg-ink-700"
        }`}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-white/15 text-5xl"
        >
          {result.passed ? "🏆" : "📚"}
        </motion.div>
        <h1 className="mt-6 text-2xl font-extrabold">
          {result.passed ? `Promoted to ${nextRank?.title ?? "the next rank"}!` : "Not this time"}
        </h1>
        <p className="mt-1 text-white/80">Score: {result.score}%</p>
        {!result.passed && <p className="mt-4 max-w-xs text-sm text-white/70">You can retry in 24 hours. Review the units you missed and come back stronger.</p>}
        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-10 w-full max-w-xs rounded-xl bg-white py-4 text-base font-bold text-ink-900 shadow-sm transition active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    );
  }

  const q = questions[index];
  if (!q) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 pb-10 pt-6">
      <div className="flex items-center justify-between text-sm font-semibold text-ink-500">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span className={secondsLeft < 60 ? "text-accent-600" : ""}>{timeLabel}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      <p className="mt-8 text-xl font-extrabold leading-snug text-ink-900">{q.prompt}</p>

      <div className="mt-6 flex flex-col gap-3">
        {q.options.map((option, i) => (
          <button
            key={i}
            onClick={() => selectAnswer(i)}
            className={`rounded-xl border-2 px-4 py-4 text-left text-base font-semibold text-ink-900 transition active:scale-[0.98] ${
              answers[index] === i ? "border-brand-500 bg-brand-50" : "border-ink-300 bg-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        onClick={goNext}
        disabled={answers[index] === null}
        className="mt-auto w-full rounded-xl bg-ink-900 py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-40"
      >
        {index + 1 >= questions.length ? "Finish exam" : "Next"}
      </button>
    </div>
  );
}
