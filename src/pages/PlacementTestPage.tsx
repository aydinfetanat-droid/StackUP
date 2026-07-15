import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { drawPlacementQuestions } from "../data/exams";
import type { PlacementQuestion } from "../types/placement";

const QUESTION_COUNT = 30;
const PASS_THRESHOLD = 0.9;
const MAX_ATTEMPTS = 3;
const COOLDOWN_DAYS = 14;
const MCQ_SECONDS = 60;
const FILLNUMBER_SECONDS = 75;

type Stage = "loading" | "blocked" | "cooldown" | "already-passed" | "intro" | "in-progress" | "finished";

type Answer = { choiceIndex: number | null; numericValue: string };

export function PlacementTestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("loading");
  const [attemptCount, setAttemptCount] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(MCQ_SECONDS);
  const [result, setResult] = useState<{ score: number; passed: boolean; byTopic: Record<string, { correct: number; total: number }> } | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("placement_test_attempts")
      .select("passed, started_at")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .then(({ data }) => {
        const attempts = data ?? [];
        setAttemptCount(attempts.length);

        if (attempts.some((a) => a.passed)) {
          setStage("already-passed");
          return;
        }
        if (attempts.length >= MAX_ATTEMPTS) {
          setStage("blocked");
          return;
        }
        if (attempts.length > 0) {
          const last = new Date(attempts[0].started_at);
          const cooldownEnd = new Date(last.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
          if (cooldownEnd > new Date()) {
            setCooldownUntil(cooldownEnd);
            setStage("cooldown");
            return;
          }
        }
        setStage("intro");
      });
  }, [user]);

  useEffect(() => {
    if (stage !== "in-progress") return;
    if (secondsLeft <= 0) {
      goNext();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, secondsLeft]);

  function startExam() {
    finishedRef.current = false;
    const drawn = drawPlacementQuestions(QUESTION_COUNT);
    setQuestions(drawn);
    setAnswers(drawn.map(() => ({ choiceIndex: null, numericValue: "" })));
    setIndex(0);
    setSecondsLeft(drawn[0]?.kind === "fillnumber" ? FILLNUMBER_SECONDS : MCQ_SECONDS);
    setStage("in-progress");
  }

  function updateAnswer(patch: Partial<Answer>) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function goNext() {
    const nextIndex = index + 1;
    if (nextIndex >= questions.length) {
      finishExam();
    } else {
      setIndex(nextIndex);
      setSecondsLeft(questions[nextIndex].kind === "fillnumber" ? FILLNUMBER_SECONDS : MCQ_SECONDS);
    }
  }

  async function finishExam() {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const byTopic: Record<string, { correct: number; total: number }> = {};
    let correctCount = 0;

    questions.forEach((q, i) => {
      const a = answers[i];
      let isCorrect = false;
      if (q.kind === "mcq") {
        isCorrect = a.choiceIndex === q.correctIndex;
      } else {
        const numeric = Number(a.numericValue);
        const tolerance = q.tolerance ?? 0;
        isCorrect = a.numericValue !== "" && !Number.isNaN(numeric) && Math.abs(numeric - q.correctAnswer) <= tolerance;
      }
      if (isCorrect) correctCount += 1;

      byTopic[q.topic] ??= { correct: 0, total: 0 };
      byTopic[q.topic].total += 1;
      if (isCorrect) byTopic[q.topic].correct += 1;
    });

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const passed = questions.length > 0 && correctCount / questions.length >= PASS_THRESHOLD;

    if (user) {
      await supabase.from("placement_test_attempts").insert({
        user_id: user.id,
        score,
        passed,
        attempt_number: attemptCount + 1,
      });
    }

    setResult({ score, passed, byTopic });
    setStage("finished");
  }

  const timeLabel = useMemo(() => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [secondsLeft]);

  if (stage === "loading") return <div className="min-h-screen bg-ink-100" />;

  if (stage === "already-passed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-100 px-6 text-center">
        <p className="text-4xl">🏅</p>
        <p className="text-lg font-bold text-ink-900">You've already placed into Vice President</p>
        <button onClick={() => navigate("/")} className="mt-2 font-semibold text-brand-600">
          Back home
        </button>
      </div>
    );
  }

  if (stage === "blocked") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-100 px-6 text-center">
        <p className="text-4xl">🔒</p>
        <p className="text-lg font-bold text-ink-900">No more attempts available</p>
        <p className="max-w-xs text-sm text-ink-500">
          You've used all {MAX_ATTEMPTS} lifetime attempts at the placement test. Keep going through the normal lesson path instead.
        </p>
        <button onClick={() => navigate("/")} className="mt-2 font-semibold text-brand-600">
          Back home
        </button>
      </div>
    );
  }

  if (stage === "cooldown" && cooldownUntil) {
    const daysLeft = Math.max(1, Math.ceil((cooldownUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-100 px-6 text-center">
        <p className="text-4xl">⏳</p>
        <p className="text-lg font-bold text-ink-900">Not yet</p>
        <p className="max-w-xs text-sm text-ink-500">
          You can retake the placement test in about {daysLeft} day{daysLeft === 1 ? "" : "s"}.
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
        <p className="text-4xl">🧭</p>
        <p className="text-lg font-bold text-ink-900">Skip to Vice President</p>
        <p className="max-w-sm text-sm text-ink-500">
          {QUESTION_COUNT} hard questions, most with their own timer (60-75 seconds each), no going back once you
          answer. You need {Math.round(PASS_THRESHOLD * 100)}% ({Math.round(PASS_THRESHOLD * QUESTION_COUNT)}/{QUESTION_COUNT})
          to pass.
        </p>
        <p className="max-w-sm text-sm font-semibold text-ink-700">
          This test places you where you'll succeed. Testing into content above your level only hurts your
          certification odds later.
        </p>
        <p className="text-xs text-ink-500">Attempt {attemptCount + 1} of {MAX_ATTEMPTS}</p>
        <button
          onClick={startExam}
          className="mt-4 w-full max-w-xs rounded-xl bg-brand-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.98]"
        >
          Start test
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
          {result.passed ? "🏅" : "📚"}
        </motion.div>
        <h1 className="mt-6 text-2xl font-extrabold">{result.passed ? "You placed into Vice President!" : "Not this time"}</h1>
        <p className="mt-1 text-white/80">Score: {result.score}%</p>

        {!result.passed && (
          <div className="mt-6 w-full max-w-xs text-left">
            <p className="text-xs font-semibold uppercase text-white/60">By topic</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {Object.entries(result.byTopic).map(([topic, stat]) => (
                <div key={topic} className="flex justify-between text-sm text-white/80">
                  <span>{topic}</span>
                  <span>
                    {stat.correct}/{stat.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
  const answer = answers[index];

  return (
    <div className="flex min-h-screen select-none flex-col bg-white px-6 pb-10 pt-6">
      <div className="flex items-center justify-between text-sm font-semibold text-ink-500">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span className={secondsLeft <= 10 ? "text-accent-600" : ""}>{timeLabel}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      <p className="mt-8 text-xl font-extrabold leading-snug text-ink-900">{q.prompt}</p>

      {q.kind === "mcq" ? (
        <div className="mt-6 flex flex-col gap-3">
          {q.options.map((option, i) => (
            <button
              key={i}
              onClick={() => updateAnswer({ choiceIndex: i })}
              className={`rounded-xl border-2 px-4 py-4 text-left text-base font-semibold text-ink-900 transition active:scale-[0.98] ${
                answer.choiceIndex === i ? "border-brand-500 bg-brand-50" : "border-ink-300 bg-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-10 flex items-center justify-center gap-2">
          {q.unit && <span className="text-3xl font-extrabold text-ink-500">{q.unit}</span>}
          <input
            type="number"
            inputMode="decimal"
            value={answer.numericValue}
            onChange={(e) => updateAnswer({ numericValue: e.target.value })}
            placeholder="0"
            className="w-32 rounded-xl border-2 border-ink-300 bg-white px-4 py-3 text-center text-3xl font-extrabold text-ink-900 outline-none focus:border-brand-500"
          />
        </div>
      )}

      <button
        onClick={goNext}
        disabled={q.kind === "mcq" ? answer.choiceIndex === null : answer.numericValue === ""}
        className="mt-auto w-full rounded-xl bg-ink-900 py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-40"
      >
        {index + 1 >= questions.length ? "Finish test" : "Next"}
      </button>
    </div>
  );
}
