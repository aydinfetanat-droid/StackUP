import { useState } from "react";
import type { McqCard } from "../../types/lesson";
import { FeedbackBanner } from "./FeedbackBanner";

interface Props {
  card: McqCard;
  onComplete: (correct: boolean) => void;
  showMascot?: boolean;
}

const LETTERS = ["A", "B", "C", "D", "E"];

export function McqCardView({ card, onComplete, showMascot }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const answered = selected !== null;
  const correct = selected === card.correctIndex;

  return (
    <div className="flex h-full flex-col px-6 pb-40">
      <p className="pt-6 text-xl font-extrabold leading-snug text-ink-900">{card.prompt}</p>

      <div className="mt-6 flex flex-col gap-3">
        {card.options.map((option, i) => {
          let style = "border-ink-200 bg-white";
          let badgeStyle = "bg-ink-100 text-ink-500";
          if (answered) {
            if (i === card.correctIndex) {
              style = "border-brand-500 bg-brand-50";
              badgeStyle = "bg-brand-500 text-white";
            } else if (i === selected) {
              style = "border-accent-500 bg-orange-50";
              badgeStyle = "bg-accent-500 text-white";
            } else {
              style = "border-ink-200 bg-white opacity-50";
            }
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-base font-semibold text-ink-900 shadow-sm transition active:scale-[0.98] ${style}`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${badgeStyle}`}>
                {LETTERS[i]}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <FeedbackBanner correct={correct} explanation={card.explanation} onContinue={() => onComplete(correct)} showMascot={showMascot} />
      )}
    </div>
  );
}
