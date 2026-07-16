import { useState } from "react";
import type { FillNumberCard } from "../../types/lesson";
import { FeedbackBanner } from "./FeedbackBanner";

interface Props {
  card: FillNumberCard;
  onComplete: (correct: boolean) => void;
  showMascot?: boolean;
}

export function FillNumberCardView({ card, onComplete, showMascot }: Props) {
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);

  const numericInput = Number(input);
  const tolerance = card.tolerance ?? 0;
  const correct = input !== "" && !Number.isNaN(numericInput) && Math.abs(numericInput - card.correctAnswer) <= tolerance;

  function handleCheck() {
    if (input === "") return;
    setChecked(true);
  }

  return (
    <div className="flex h-full flex-col px-6 pb-40">
      <p className="pt-6 text-xl font-extrabold leading-snug text-ink-900">{card.prompt}</p>

      <div className="mt-10 flex items-center justify-center gap-2">
        {card.unit && <span className="text-3xl font-extrabold text-ink-500">{card.unit}</span>}
        <input
          type="number"
          inputMode="decimal"
          disabled={checked}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0"
          className="w-32 rounded-xl border-2 border-ink-300 bg-white px-4 py-3 text-center text-3xl font-extrabold text-ink-900 outline-none focus:border-brand-500"
        />
      </div>

      {!checked && (
        <button
          onClick={handleCheck}
          disabled={input === ""}
          className="mt-10 w-full rounded-xl bg-ink-900 py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-40"
        >
          Check answer
        </button>
      )}

      {checked && (
        <FeedbackBanner correct={correct} explanation={card.explanation} onContinue={() => onComplete(correct)} showMascot={showMascot} />
      )}
    </div>
  );
}
