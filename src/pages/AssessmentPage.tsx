import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import assessmentData from "../data/assessments/financial-literacy-10q.json";
import type { ExamQuestion } from "../types/exam";

const questions = assessmentData.questions as ExamQuestion[];

type Phase = "pre" | "post";

export function AssessmentPage() {
  const { phase } = useParams<{ phase: Phase }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const validPhase: Phase = phase === "post" ? "post" : "pre";

  function selectAnswer(choiceIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = choiceIndex;
      return next;
    });
  }

  async function finish() {
    const correct = questions.filter((q, i) => answers[i] === q.correctIndex).length;
    const finalScore = Math.round((correct / questions.length) * 100);

    if (user) {
      await supabase
        .from("assessment_attempts")
        .upsert({ user_id: user.id, phase: validPhase, score: finalScore }, { onConflict: "user_id,phase" });
    }

    setScore(finalScore);
    setFinished(true);
  }

  function goNext() {
    if (index + 1 >= questions.length) {
      finish();
    } else {
      setIndex(index + 1);
    }
  }

  if (finished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-600 px-6 text-center text-white">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-4xl"
        >
          ✅
        </motion.div>
        <p className="text-lg font-bold">
          {validPhase === "pre" ? "Baseline check complete" : "Progress check complete"}
        </p>
        <p className="text-sm text-brand-100">Score: {score}%</p>
        <p className="max-w-xs text-sm text-brand-100">
          {validPhase === "pre"
            ? "This is just a starting point — no pressure. Let's go learn."
            : "Nice work. Compare this to where you started once you check /admin."}
        </p>
        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-4 w-full max-w-xs rounded-xl bg-white py-4 text-base font-bold text-brand-700 shadow-sm transition active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 pb-10 pt-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
          {validPhase === "pre" ? "Quick baseline check" : "Progress check"}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Question {index + 1} of {questions.length}
        </p>
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
        {index + 1 >= questions.length ? "Finish" : "Next"}
      </button>
    </div>
  );
}
