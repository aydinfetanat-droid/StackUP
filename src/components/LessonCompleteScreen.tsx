import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { NavigateFunction } from "react-router-dom";
import type { Lesson } from "../types/lesson";
import { Mascot, randomFrom } from "./Mascot";
import { ConfettiBurst } from "./ConfettiBurst";
import { PERFECT_LESSON_QUIPS, GOOD_LESSON_QUIPS } from "../data/mascotQuips";
import { playCelebrationSound } from "../lib/sound";

interface Props {
  lesson: Lesson;
  savedScore: number;
  showMascot: boolean;
  triggerReview: boolean;
  navigate: NavigateFunction;
}

export function LessonCompleteScreen({ lesson, savedScore, showMascot, triggerReview, navigate }: Props) {
  const [quip] = useState(() => randomFrom(savedScore === 100 ? PERFECT_LESSON_QUIPS : GOOD_LESSON_QUIPS));

  useEffect(() => {
    playCelebrationSound();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-600 px-6 text-center text-white">
      <div className="relative">
        <ConfettiBurst />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/15 text-5xl"
        >
          {savedScore === 100 ? "🏆" : "🎉"}
        </motion.div>
      </div>

      <h1 className="mt-6 text-2xl font-extrabold">Lesson complete!</h1>
      <p className="mt-1 text-brand-100">{lesson.title}</p>

      {showMascot && (
        <div className="mt-5 max-w-xs">
          <Mascot quip={quip} size="lg" />
        </div>
      )}

      <div className="mt-8 w-full max-w-xs rounded-2xl bg-white/10 p-4">
        <p className="text-3xl font-extrabold">{savedScore}%</p>
        <p className="text-xs text-brand-100">Score</p>
      </div>

      <button
        onClick={() => navigate(triggerReview ? "/review" : "/", { replace: true })}
        className="mt-10 w-full max-w-xs rounded-xl bg-white py-4 text-base font-bold text-brand-700 shadow-sm transition active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  );
}
