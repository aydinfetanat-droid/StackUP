import { useState } from "react";
import type { SliderCard } from "../../types/lesson";
import { FeedbackBanner } from "./FeedbackBanner";

interface Props {
  card: SliderCard;
  onComplete: (correct: boolean) => void;
  showMascot?: boolean;
}

export function SliderCardView({ card, onComplete, showMascot }: Props) {
  const [value, setValue] = useState(Math.round((card.min + card.max) / 2));
  const [checked, setChecked] = useState(false);

  const correct = Math.abs(value - card.correctAnswer) <= card.tolerance;

  return (
    <div className="flex h-full flex-col px-6 pb-40">
      <p className="pt-6 text-xl font-extrabold leading-snug text-ink-900">{card.prompt}</p>

      <div className="mt-10 flex flex-col items-center">
        <p className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-3 text-4xl font-extrabold text-white shadow-md">
          {card.unit ?? ""}
          {value}
        </p>
        <input
          type="range"
          min={card.min}
          max={card.max}
          step={card.step}
          value={value}
          disabled={checked}
          onChange={(e) => setValue(Number(e.target.value))}
          className="mt-6 w-full accent-emerald-600"
        />
        <div className="mt-1 flex w-full justify-between text-xs text-ink-500">
          <span>
            {card.unit ?? ""}
            {card.min}
          </span>
          <span>
            {card.unit ?? ""}
            {card.max}
          </span>
        </div>
      </div>

      {!checked && (
        <button onClick={() => setChecked(true)} className="btn-chunky btn-chunky--dark mt-10 w-full">
          Check answer
        </button>
      )}

      {checked && (
        <FeedbackBanner correct={correct} explanation={card.explanation} onContinue={() => onComplete(correct)} showMascot={showMascot} />
      )}
    </div>
  );
}
