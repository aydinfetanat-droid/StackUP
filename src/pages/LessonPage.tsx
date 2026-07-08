import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { getLesson } from "../data/lessons";
import { CardRenderer } from "../components/cards/CardRenderer";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { logEvent } from "../lib/analytics";
import { calcLessonXp } from "../lib/levels";

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, addXp } = useAuth();

  const lesson = lessonId ? getLesson(lessonId) : undefined;

  const [cardIndex, setCardIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [savedScore, setSavedScore] = useState(0);
  const startedLogged = useRef(false);

  useEffect(() => {
    if (lesson && !startedLogged.current) {
      startedLogged.current = true;
      logEvent("lesson_started", { lesson_id: lesson.id });
    }
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-100 px-6 text-center">
        <p className="text-lg font-bold text-ink-900">Lesson not found</p>
        <button onClick={() => navigate("/")} className="font-semibold text-brand-600">
          Back home
        </button>
      </div>
    );
  }

  async function handleCardComplete(correct: boolean, isScored: boolean) {
    const nextResults = isScored ? [...results, correct] : results;
    if (isScored) setResults(nextResults);

    const nextIndex = cardIndex + 1;
    if (nextIndex >= lesson!.cards.length) {
      await finishLesson(nextResults);
    } else {
      setCardIndex(nextIndex);
    }
  }

  async function finishLesson(finalResults: boolean[]) {
    const correctCount = finalResults.filter(Boolean).length;
    const score = finalResults.length > 0 ? Math.round((correctCount / finalResults.length) * 100) : 100;

    let earned = 0;
    if (user) {
      const { data: existing } = await supabase
        .from("lesson_completions")
        .select("id, score")
        .eq("user_id", user.id)
        .eq("lesson_id", lesson!.id)
        .maybeSingle();

      if (!existing) {
        earned = calcLessonXp(score);
        await supabase.from("lesson_completions").insert({
          user_id: user.id,
          lesson_id: lesson!.id,
          score,
          xp_earned: earned,
        });
        await addXp(earned);
      } else if (score > existing.score) {
        await supabase.from("lesson_completions").update({ score }).eq("id", existing.id);
      }

      await logEvent("lesson_completed", { lesson_id: lesson!.id, score, xp_earned: earned });
    }

    setXpEarned(earned);
    setSavedScore(score);
    setFinished(true);
  }

  if (finished) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-600 px-6 text-center text-white">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-white/15 text-5xl"
        >
          {savedScore === 100 ? "🏆" : "🎉"}
        </motion.div>
        <h1 className="mt-6 text-2xl font-extrabold">Lesson complete!</h1>
        <p className="mt-1 text-brand-100">{lesson.title}</p>

        <div className="mt-8 grid w-full max-w-xs grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-2xl font-extrabold">{savedScore}%</p>
            <p className="text-xs text-brand-100">Score</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-2xl font-extrabold">+{xpEarned}</p>
            <p className="text-xs text-brand-100">XP earned</p>
          </div>
        </div>

        {xpEarned === 0 && (
          <p className="mt-4 text-xs text-brand-100">
            You already completed this lesson before, so no extra XP this time — but your best score is saved.
          </p>
        )}

        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-10 w-full max-w-xs rounded-xl bg-white py-4 text-base font-bold text-brand-700 shadow-sm transition active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    );
  }

  const progress = (cardIndex / lesson.cards.length) * 100;
  const currentCard = lesson.cards[cardIndex];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex items-center gap-3 px-5 pt-6">
        <button onClick={() => navigate("/")} className="text-2xl leading-none text-ink-500" aria-label="Exit lesson">
          ×
        </button>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1">
        <motion.div
          key={cardIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="h-full"
        >
          <CardRenderer
            card={currentCard}
            onComplete={(correct) => handleCardComplete(correct, currentCard.type !== "explain")}
          />
        </motion.div>
      </div>
    </div>
  );
}
