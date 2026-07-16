import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { getLesson } from "../data/lessons";
import { CardRenderer } from "../components/cards/CardRenderer";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { logEvent } from "../lib/analytics";
import { calcLessonXp } from "../lib/levels";
import { toLaDateString } from "../lib/streak";
import { getRankIdForUnit } from "../lib/ranks";
import { LessonCompleteScreen } from "../components/LessonCompleteScreen";

const REVIEW_SESSION_INTERVAL = 10;

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, addXp } = useAuth();

  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const showMascot = lesson ? getRankIdForUnit(lesson.unit) === 1 : false;

  const [cardIndex, setCardIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [savedScore, setSavedScore] = useState(0);
  const [triggerReview, setTriggerReview] = useState(false);
  const startedLogged = useRef(false);
  const finishedRef = useRef(false);

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

    if (isScored && user) {
      await supabase.from("missed_card_answers").insert({
        user_id: user.id,
        lesson_id: lesson!.id,
        card_index: cardIndex,
        correct,
      });
    }

    const nextIndex = cardIndex + 1;
    if (nextIndex >= lesson!.cards.length) {
      await finishLesson(nextResults);
    } else {
      setCardIndex(nextIndex);
    }
  }

  async function finishLesson(finalResults: boolean[]) {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const correctCount = finalResults.filter(Boolean).length;
    const score = finalResults.length > 0 ? Math.round((correctCount / finalResults.length) * 100) : 100;

    let earned = 0;
    if (user) {
      const { data: priorCompletions } = await supabase
        .from("lesson_completions")
        .select("lesson_id, completed_at")
        .eq("user_id", user.id);

      const alreadyCompletedToday = (priorCompletions ?? []).some(
        (row) => toLaDateString(new Date(row.completed_at)) === toLaDateString(new Date()),
      );

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

        const totalCompleted = (priorCompletions ?? []).length + 1;
        if (totalCompleted % REVIEW_SESSION_INTERVAL === 0) {
          setTriggerReview(true);
        }
      } else if (score > existing.score) {
        await supabase.from("lesson_completions").update({ score }).eq("id", existing.id);
      }

      if (!alreadyCompletedToday) {
        await logEvent("streak_day_recorded");
      }

      await logEvent("lesson_completed", { lesson_id: lesson!.id, score, xp_earned: earned });
    }

    setSavedScore(score);
    setFinished(true);
  }

  if (finished) {
    return <LessonCompleteScreen lesson={lesson} savedScore={savedScore} showMascot={showMascot} triggerReview={triggerReview} navigate={navigate} />;
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
            onComplete={(correct) => handleCardComplete(correct, currentCard.type !== "explain" && currentCard.type !== "flip")}
            showMascot={showMascot}
          />
        </motion.div>
      </div>
    </div>
  );
}
