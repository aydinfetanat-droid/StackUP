import { useState } from "react";
import type { TrueFalseCard } from "../../types/lesson";
import { FeedbackBanner } from "./FeedbackBanner";

interface Props {
  card: TrueFalseCard;
  onComplete: (correct: boolean) => void;
}

export function TrueFalseCardView({ card, onComplete }: Props) {
  const [selected, setSelected] = useState<boolean | null>(null);

  const answered = selected !== null;
  const correct = selected === card.correctAnswer;

  function styleFor(value: boolean) {
    if (!answered) return "border-ink-300 bg-white";
    if (value === card.correctAnswer) return "border-brand-500 bg-brand-50";
    if (value === selected) return "border-accent-500 bg-orange-50";
    return "border-ink-300 bg-white opacity-60";
  }

  return (
    <div className="flex h-full flex-col px-6 pb-40">
      <p className="pt-6 text-xl font-extrabold leading-snug text-ink-900">{card.prompt}</p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          disabled={answered}
          onClick={() => setSelected(true)}
          className={`rounded-xl border-2 py-6 text-lg font-bold text-ink-900 transition active:scale-[0.98] ${styleFor(true)}`}
        >
          True
        </button>
        <button
          disabled={answered}
          onClick={() => setSelected(false)}
          className={`rounded-xl border-2 py-6 text-lg font-bold text-ink-900 transition active:scale-[0.98] ${styleFor(false)}`}
        >
          False
        </button>
      </div>

      {answered && (
        <FeedbackBanner correct={correct} explanation={card.explanation} onContinue={() => onComplete(correct)} />
      )}
    </div>
  );
}
