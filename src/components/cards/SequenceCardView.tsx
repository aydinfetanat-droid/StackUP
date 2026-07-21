import { useMemo, useState } from "react";
import type { SequenceCard } from "../../types/lesson";
import { FeedbackBanner } from "./FeedbackBanner";

interface Props {
  card: SequenceCard;
  onComplete: (correct: boolean) => void;
  showMascot?: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function SequenceCardView({ card, onComplete, showMascot }: Props) {
  const shuffledSteps = useMemo(() => shuffle(card.steps), [card]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const pool = shuffledSteps.filter((s) => !placed.includes(s.id));
  const allPlaced = placed.length === card.steps.length;
  const allCorrect = checked && placed.every((id, i) => id === card.correctOrder[i]);

  function appendStep(id: string) {
    if (checked) return;
    setPlaced((prev) => [...prev, id]);
  }

  function removeStep(id: string) {
    if (checked) return;
    setPlaced((prev) => prev.filter((s) => s !== id));
  }

  function labelFor(id: string) {
    return card.steps.find((s) => s.id === id)?.label ?? "";
  }

  return (
    <div className="flex h-full flex-col px-6 pb-48">
      <p className="pt-6 font-display text-xl leading-snug text-ink-900">{card.prompt}</p>

      <div className="mt-5 flex flex-col gap-2">
        {card.correctOrder.map((_, i) => {
          const id = placed[i];
          const isCorrect = checked && id === card.correctOrder[i];
          return (
            <button
              key={i}
              onClick={() => id && removeStep(id)}
              className={`flex min-h-[52px] items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors duration-150 ${
                id
                  ? checked
                    ? isCorrect
                      ? "border-forest-500 bg-forest-50"
                      : "border-rust-500 bg-rust-50"
                    : "border-ink-300 bg-surface"
                  : "border-dashed border-ink-300 bg-ink-50"
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-onyx text-xs font-semibold tabular-nums text-white">
                {i + 1}
              </span>
              <span className="font-medium text-ink-900">{id ? labelFor(id) : "Tap a step below"}</span>
            </button>
          );
        })}
      </div>

      {pool.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {pool.map((step) => (
            <button
              key={step.id}
              onClick={() => appendStep(step.id)}
              className="rounded-full border border-ink-300 bg-surface px-4 py-2 text-sm font-medium text-ink-900 transition-colors duration-150 hover:border-ink-400"
            >
              {step.label}
            </button>
          ))}
        </div>
      )}

      {!checked && (
        <button onClick={() => setChecked(true)} disabled={!allPlaced} className="btn btn-primary mt-6 w-full">
          Check order
        </button>
      )}

      {checked && (
        <FeedbackBanner correct={allCorrect} explanation={card.explanation} onContinue={() => onComplete(allCorrect)} showMascot={showMascot} />
      )}
    </div>
  );
}
