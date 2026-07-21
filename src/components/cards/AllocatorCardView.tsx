import { useState } from "react";
import type { AllocatorCard } from "../../types/lesson";
import { FeedbackBanner } from "./FeedbackBanner";

interface Props {
  card: AllocatorCard;
  onComplete: (correct: boolean) => void;
  showMascot?: boolean;
}

const COLORS = ["bg-onyx", "bg-forest-600", "bg-ink-500", "bg-forest-300", "bg-ink-300"];

export function AllocatorCardView({ card, onComplete, showMascot }: Props) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(card.categories.map((c) => [c.id, 0])),
  );
  const [checked, setChecked] = useState(false);

  const total = Object.values(values).reduce((a, b) => a + b, 0);
  const isValidTotal = total === 100;

  function setValue(id: string, value: number) {
    if (checked) return;
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  const allCorrect =
    checked &&
    card.categories.every((c) => Math.abs(values[c.id] - c.correctPercent) <= c.tolerancePercent);

  return (
    <div className="flex h-full flex-col px-6 pb-48">
      <p className="pt-6 font-display text-xl leading-snug text-ink-900">{card.prompt}</p>

      <div className="mt-5 flex h-2 w-full overflow-hidden rounded-full bg-ink-100">
        {card.categories.map((c, i) =>
          values[c.id] > 0 ? (
            <div key={c.id} className={COLORS[i % COLORS.length]} style={{ width: `${values[c.id]}%` }} />
          ) : null,
        )}
      </div>
      <p className={`mt-2 text-right text-sm font-semibold tabular-nums ${isValidTotal ? "text-forest-700" : "text-ink-500"}`}>
        {total}% allocated
      </p>

      <div className="mt-4 flex flex-col gap-5">
        {card.categories.map((c, i) => (
          <div key={c.id}>
            <div className="flex items-center justify-between text-sm font-medium text-ink-700">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${COLORS[i % COLORS.length]}`} />
                {c.label}
              </span>
              <span className="tabular-nums">
                {values[c.id]}% {card.unit ?? ""}
                {Math.round((values[c.id] / 100) * card.totalAmount)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={values[c.id]}
              disabled={checked}
              onChange={(e) => setValue(c.id, Number(e.target.value))}
              className="mt-1.5 w-full accent-forest-600"
            />
          </div>
        ))}
      </div>

      {!checked && (
        <button onClick={() => setChecked(true)} disabled={!isValidTotal} className="btn btn-primary mt-6 w-full">
          {isValidTotal ? "Check my split" : `Adjust to 100% (currently ${total}%)`}
        </button>
      )}

      {checked && (
        <FeedbackBanner correct={allCorrect} explanation={card.explanation} onContinue={() => onComplete(allCorrect)} showMascot={showMascot} />
      )}
    </div>
  );
}
