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
      <p className="pt-6 font-display text-xl leading-snug text-ink-900">{card.prompt}</p>

      <div className="mt-6 flex flex-col gap-2.5">
        {card.options.map((option, i) => {
          let style = "border-ink-200 bg-surface";
          let badgeStyle = "bg-ink-100 text-ink-500";
          if (answered) {
            if (i === card.correctIndex) {
              style = "border-forest-500 bg-forest-50";
              badgeStyle = "bg-forest-600 text-white";
            } else if (i === selected) {
              style = "border-rust-500 bg-rust-50";
              badgeStyle = "bg-rust-600 text-white";
            } else {
              style = "border-ink-200 bg-surface opacity-50";
            }
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-3 rounded-md border px-4 py-3.5 text-left text-base font-medium text-ink-900 transition-colors duration-150 ${
                !answered && "hover:border-ink-400"
              } ${style}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-150 ${badgeStyle}`}>
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
