import { useEffect, useState } from "react";
import { Mascot, randomFrom } from "../Mascot";
import { CORRECT_QUIPS, INCORRECT_QUIPS } from "../../data/mascotQuips";
import { playCorrectSound, playIncorrectSound } from "../../lib/sound";

interface Props {
  correct: boolean;
  explanation: string;
  onContinue: () => void;
  showMascot?: boolean;
}

export function FeedbackBanner({ correct, explanation, onContinue, showMascot = false }: Props) {
  const [quip] = useState(() => randomFrom(correct ? CORRECT_QUIPS : INCORRECT_QUIPS));

  useEffect(() => {
    if (correct) playCorrectSound();
    else playIncorrectSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 border-t px-5 pb-8 pt-4 ${
        correct ? "border-brand-200 bg-brand-50" : "border-accent-400/30 bg-orange-50"
      }`}
    >
      {showMascot ? (
        <Mascot quip={quip} />
      ) : (
        <p className={`text-sm font-bold ${correct ? "text-brand-700" : "text-accent-600"}`}>
          {correct ? "Nice — that's right!" : "Not quite"}
        </p>
      )}
      <p className="mt-1.5 text-sm text-ink-700">{explanation}</p>
      <button
        onClick={onContinue}
        className={`mt-4 w-full rounded-xl py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.98] ${
          correct ? "bg-brand-600" : "bg-ink-900"
        }`}
      >
        Continue
      </button>
    </div>
  );
}
