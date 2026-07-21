import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-onyx-deep px-6 text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15">
          <CheckCircle2 size={26} className="text-forest-400" />
        </div>
        <p className="font-display text-lg text-white">
          {validPhase === "pre" ? "Baseline check complete" : "Progress check complete"}
        </p>
        <p className="text-sm text-white/60">Score: {score}%</p>
        <p className="max-w-xs text-sm text-white/60">
          {validPhase === "pre"
            ? "This is just a starting point — no pressure. Let's go learn."
            : "Nice work. Compare this to where you started once you check /admin."}
        </p>
        <button onClick={() => navigate("/", { replace: true })} className="btn btn-invert mt-4 w-full max-w-xs">
          Continue
        </button>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div className="flex min-h-screen flex-col bg-surface px-6 pb-10 pt-6">
      <div>
        <p className="label-caps">{validPhase === "pre" ? "Quick baseline check" : "Progress check"}</p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-onyx transition-all"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Question {index + 1} of {questions.length}
        </p>
      </div>

      <p className="mt-8 font-display text-xl leading-snug text-ink-900">{q.prompt}</p>

      <div className="mt-6 flex flex-col gap-2.5">
        {q.options.map((option, i) => (
          <button
            key={i}
            onClick={() => selectAnswer(i)}
            className={`rounded-md border px-4 py-3.5 text-left text-base font-medium text-ink-900 transition-colors duration-150 ${
              answers[index] === i ? "border-ink-900 bg-ink-100" : "border-ink-300 bg-surface hover:border-ink-400"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <button onClick={goNext} disabled={answers[index] === null} className="btn btn-primary mt-auto w-full">
        {index + 1 >= questions.length ? "Finish" : "Next"}
      </button>
    </div>
  );
}
