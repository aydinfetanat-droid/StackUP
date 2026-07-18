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
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-ink-900 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs font-semibold tabular-nums text-ink-500">
          {index + 1}/{questions.length}
        </span>
      </div>
      <p className="label-caps px-5 pt-2">Quick recap</p>

      <div className="flex-1">
        <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }} className="h-full">
          <CardRenderer card={current.card} onComplete={handleComplete} showMascot={showMascot} />
        </motion.div>
      </div>
    </div>
  );
}
