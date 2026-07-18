import { useEffect, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { Award, CheckCircle2 } from "lucide-react";
import type { Lesson } from "../types/lesson";
import { Mascot, randomFrom } from "./Mascot";
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
  const perfect = savedScore === 100;

  useEffect(() => {
    playCelebrationSound();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15">
        {perfect ? <Award size={26} className="text-ochre-400" /> : <CheckCircle2 size={26} className="text-forest-400" />}
      </div>

      <h1 className="mt-6 font-display text-2xl text-white">Lesson complete</h1>
      <p className="mt-1 text-white/60">{lesson.title}</p>

      {showMascot && (
        <div className="mt-5 max-w-xs text-white/80 [&_svg]:text-inherit [&_p]:text-white/90">
          <Mascot quip={quip} tone="positive" />
        </div>
      )}

      <div className="mt-8 w-full max-w-xs rounded-md border border-white/15 p-4">
        <p className="font-display text-3xl tabular-nums text-white">{savedScore}%</p>
        <p className="text-xs text-white/50">Score</p>
      </div>

      <button
        onClick={() => navigate(triggerReview ? "/review" : "/", { replace: true })}
        className="btn btn-invert mt-10 w-full max-w-xs"
      >
        Continue
      </button>
    </div>
  );
}
