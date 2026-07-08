import { useState } from "react";
import type { McqCard } from "../../types/lesson";
import { FeedbackBanner } from "./FeedbackBanner";

interface Props {
  card: McqCard;
  onComplete: (correct: boolean) => void;
}

export function McqCardView({ card, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const answered = selected !== null;
  const correct = selected === card.correctIndex;

  return (
    <div className="flex h-full flex-col px-6 pb-40">
      <p className="pt-6 text-xl font-extrabold leading-snug text-ink-900">{card.prompt}</p>

      <div className="mt-6 flex flex-col gap-3">
        {card.options.map((option, i) => {
          let style = "border-ink-300 bg-white";
          if (answered) {
            if (i === card.correctIndex) style = "border-brand-500 bg-brand-50";
            else if (i === selected) style = "border-accent-500 bg-orange-50";
            else style = "border-ink-300 bg-white opacity-60";
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`rounded-xl border-2 px-4 py-4 text-left text-base font-semibold text-ink-900 transition active:scale-[0.98] ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <FeedbackBanner correct={correct} explanation={card.explanation} onContinue={() => onComplete(correct)} />
      )}
    </div>
  );
}
