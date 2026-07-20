import { useEffect, useState } from "react";
import { Mascot, randomFrom } from "../Mascot";
import { GlossaryText } from "../GlossaryText";
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
    <div className={`fixed inset-x-0 bottom-0 border-t bg-white px-5 pb-8 pt-4 ${correct ? "border-forest-200" : "border-rust-200"}`}>
      {showMascot ? (
        <Mascot quip={quip} tone={correct ? "positive" : "negative"} />
      ) : (
        <p className={`text-sm font-semibold ${correct ? "text-forest-700" : "text-rust-700"}`}>
          {correct ? "Correct" : "Not quite"}
        </p>
      )}
      <p className="mt-1.5 text-sm text-ink-600">
        <GlossaryText text={explanation} />
      </p>
      <button onClick={onContinue} className={`btn mt-4 w-full ${correct ? "btn-accent" : "btn-primary"}`}>
        Continue
      </button>
    </div>
  );
}
