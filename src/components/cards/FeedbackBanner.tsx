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
      className={`fixed inset-x-0 bottom-0 border-t-2 px-5 pb-8 pt-4 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] ${
        correct ? "border-brand-300 bg-gradient-to-b from-brand-100 to-white" : "border-accent-400/40 bg-gradient-to-b from-orange-100 to-white"
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
        className={`btn-chunky mt-4 w-full ${correct ? "btn-chunky--brand" : "btn-chunky--dark"}`}
      >
        Continue
      </button>
    </div>
  );
}
