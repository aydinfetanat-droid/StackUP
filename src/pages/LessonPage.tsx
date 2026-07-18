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
import { RecapQuiz } from "../components/RecapQuiz";
import { sampleRecapQuestions, recapPassThreshold } from "../lib/recap";
import type { LessonCard } from "../types/lesson";

const REVIEW_SESSION_INTERVAL = 10;

type Stage = "lesson" | "recap" | "recap-retry" | "finished";

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, addXp } = useAuth();

  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const showMascot = lesson ? getRankIdForUnit(lesson.unit) === 1 : false;

  const [cardIndex, setCardIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("lesson");
  const [recapQuestions, setRecapQuestions] = useState<{ card: LessonCard; cardIndex: number }[]>([]);
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

  async function logCardAnswer(index: number, correct: boolean) {
    if (!user) return;
    await supabase.from("missed_card_answers").insert({
      user_id: user.id,
      lesson_id: lesson!.id,
      card_index: index,
      correct,
    });
  }

  function handleCardComplete(correct: boolean, isScored: boolean) {
    if (isScored) logCardAnswer(cardIndex, correct);

    const nextIndex = cardIndex + 1;
    if (nextIndex >= lesson!.cards.length) {
      beginRecap();
    } else {
      setCardIndex(nextIndex);
    }
  }

  function beginRecap() {
    setRecapQuestions(sampleRecapQuestions(lesson!));
    setStage("recap");
  }

  async function handleRecapDone(recapResults: boolean[]) {
    const correctCount = recapResults.filter(Boolean).length;
    const passed = correctCount >= recapPassThreshold(recapResults.length);
    const score = recapResults.length > 0 ? Math.round((correctCount / recapResults.length) * 100) : 100;

    if (passed) {
      await finishLesson(score);
    } else {
      setStage("recap-retry");
    }
  }

  async function finishLesson(score: number) {
    if (finishedRef.current) return;
    finishedRef.current = true;

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
    setStage("finished");
  }

  if (stage === "finished") {
    return <LessonCompleteScreen lesson={lesson} savedScore={savedScore} showMascot={showMascot} triggerReview={triggerReview} navigate={navigate} />;
  }

  if (stage === "recap-retry") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-900 px-6 text-center text-white">
        <span className="text-5xl">🔄</span>
        <h1 className="mt-4 text-2xl font-extrabold">Not quite there yet</h1>
        <p className="mt-2 max-w-xs text-sm text-white/70">
          A couple of these didn't stick. Let's run through a fresh recap — you've got this.
        </p>
        <button onClick={beginRecap} className="btn-chunky btn-chunky--gold mt-8 w-full max-w-xs">
          Try the recap again
        </button>
      </div>
    );
  }

  if (stage === "recap") {
    return (
      <RecapQuiz
        questions={recapQuestions}
        showMascot={showMascot}
        onCardAnswered={logCardAnswer}
        onDone={handleRecapDone}
      />
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
          transition={{ duration: 0.15 }}
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
