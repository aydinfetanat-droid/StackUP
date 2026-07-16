import { useState } from "react";
import type { TrueFalseCard } from "../../types/lesson";
import { FeedbackBanner } from "./FeedbackBanner";

interface Props {
  card: TrueFalseCard;
  onComplete: (correct: boolean) => void;
  showMascot?: boolean;
}

export function TrueFalseCardView({ card, onComplete, showMascot }: Props) {
  const [selected, setSelected] = useState<boolean | null>(null);

  const answered = selected !== null;
  const correct = selected === card.correctAnswer;

  function styleFor(value: boolean) {
    if (!answered) return value ? "border-brand-200 bg-brand-50" : "border-coral-200 bg-rose-50";
    if (value === card.correctAnswer) return "border-brand-500 bg-brand-50";
    if (value === selected) return "border-accent-500 bg-orange-50";
    return "border-ink-200 bg-white opacity-50";
  }

  return (
    <div className="flex h-full flex-col px-6 pb-40">
      <p className="pt-6 text-xl font-extrabold leading-snug text-ink-900">{card.prompt}</p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          disabled={answered}
          onClick={() => setSelected(true)}
          className={`rounded-2xl border-2 py-6 text-lg font-extrabold text-ink-900 shadow-sm transition active:scale-[0.98] ${styleFor(true)}`}
        >
          ✅ True
        </button>
        <button
          disabled={answered}
          onClick={() => setSelected(false)}
          className={`rounded-2xl border-2 py-6 text-lg font-extrabold text-ink-900 shadow-sm transition active:scale-[0.98] ${styleFor(false)}`}
        >
          ❌ False
        </button>
      </div>

      {answered && (
        <FeedbackBanner correct={correct} explanation={card.explanation} onContinue={() => onComplete(correct)} showMascot={showMascot} />
      )}
    </div>
  );
}
