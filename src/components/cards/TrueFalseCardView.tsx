import { useState } from "react";
import { Check, X } from "lucide-react";
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
    if (!answered) return "border-ink-200 bg-white hover:border-ink-400";
    if (value === card.correctAnswer) return "border-forest-500 bg-forest-50";
    if (value === selected) return "border-rust-500 bg-rust-50";
    return "border-ink-200 bg-white opacity-50";
  }

  return (
    <div className="flex h-full flex-col px-6 pb-40">
      <p className="pt-6 font-display text-xl leading-snug text-ink-900">{card.prompt}</p>

      <div className="mt-8 grid grid-cols-2 gap-2.5">
        <button
          disabled={answered}
          onClick={() => setSelected(true)}
          className={`flex flex-col items-center gap-2 rounded-md border py-6 text-base font-semibold text-ink-900 transition-colors duration-150 ${styleFor(true)}`}
        >
          <Check size={20} className="text-ink-400" />
          True
        </button>
        <button
          disabled={answered}
          onClick={() => setSelected(false)}
          className={`flex flex-col items-center gap-2 rounded-md border py-6 text-base font-semibold text-ink-900 transition-colors duration-150 ${styleFor(false)}`}
        >
          <X size={20} className="text-ink-400" />
          False
        </button>
      </div>

      {answered && (
        <FeedbackBanner correct={correct} explanation={card.explanation} onContinue={() => onComplete(correct)} showMascot={showMascot} />
      )}
    </div>
  );
}
