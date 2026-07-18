import { useState } from "react";
import { motion } from "framer-motion";
import type { LessonCard } from "../types/lesson";
import { CardRenderer } from "./cards/CardRenderer";

interface Props {
  questions: { card: LessonCard; cardIndex: number }[];
  showMascot: boolean;
  onCardAnswered: (cardIndex: number, correct: boolean) => void;
  onDone: (results: boolean[]) => void;
}

export function RecapQuiz({ questions, showMascot, onCardAnswered, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  const current = questions[index];
  const progress = (index / questions.length) * 100;

  function handleComplete(correct: boolean) {
    onCardAnswered(current.cardIndex, correct);
    const next = [...results, correct];
    setResults(next);
    if (index + 1 >= questions.length) {
      onDone(next);
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex items-center gap-3 px-5 pt-6">
        <span className="text-xl">⚡</span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs font-extrabold text-gold-600">
          {index + 1}/{questions.length}
        </span>
      </div>
      <p className="px-5 pt-2 text-xs font-extrabold uppercase tracking-wide text-gold-600">Quick Recap</p>

      <div className="flex-1">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className="h-full"
        >
          <CardRenderer card={current.card} onComplete={handleComplete} showMascot={showMascot} />
        </motion.div>
      </div>
    </div>
  );
}
