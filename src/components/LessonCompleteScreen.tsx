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

  const bgGradient =
    savedScore === 100
      ? "from-gold-400 via-brand-600 to-brand-800"
      : "from-brand-400 via-brand-600 to-brand-800";

  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${bgGradient} px-6 text-center text-white`}>
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      <div className="relative">
        <ConfettiBurst />
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-5xl shadow-lg"
        >
          {savedScore === 100 ? "🏆" : "🎉"}
        </motion.div>
      </div>

      <h1 className="relative mt-6 text-2xl font-extrabold">Lesson complete!</h1>
      <p className="relative mt-1 font-semibold text-white/80">{lesson.title}</p>

      {showMascot && (
        <div className="relative mt-5 max-w-xs">
          <Mascot quip={quip} size="lg" />
        </div>
      )}

      <div className="relative mt-8 w-full max-w-xs rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
        <p className="text-3xl font-extrabold">{savedScore}%</p>
        <p className="text-xs font-semibold text-white/80">Score</p>
      </div>

      <button
        onClick={() => navigate(triggerReview ? "/review" : "/", { replace: true })}
        className="btn-chunky btn-chunky--white relative mt-10 w-full max-w-xs"
      >
        Continue
      </button>
    </div>
  );
}
