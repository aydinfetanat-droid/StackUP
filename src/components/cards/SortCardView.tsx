import { useState } from "react";
import type { SortCard } from "../../types/lesson";
import { FeedbackBanner } from "./FeedbackBanner";

interface Props {
  card: SortCard;
  onComplete: (correct: boolean) => void;
  showMascot?: boolean;
}

export function SortCardView({ card, onComplete, showMascot }: Props) {
  const [placements, setPlacements] = useState<Record<string, 0 | 1 | null>>(
    Object.fromEntries(card.items.map((i) => [i.id, null])),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const allPlaced = card.items.every((i) => placements[i.id] !== null);

  function selectItem(id: string) {
    if (checked) return;
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function placeInBucket(bucket: 0 | 1) {
    if (checked || !selectedId) return;
    setPlacements((prev) => ({ ...prev, [selectedId]: bucket }));
    setSelectedId(null);
  }

  function returnToPool(id: string) {
    if (checked) return;
    setPlacements((prev) => ({ ...prev, [id]: null }));
  }

  const pool = card.items.filter((i) => placements[i.id] === null);
  const correctCount = card.items.filter((i) => placements[i.id] === i.bucket).length;
  const allCorrect = checked && correctCount === card.items.length;

  function itemStyle(itemId: string, bucket: 0 | 1) {
    if (!checked) return "border-ink-300 bg-white";
    const item = card.items.find((i) => i.id === itemId)!;
    return item.bucket === bucket ? "border-forest-500 bg-forest-50" : "border-rust-500 bg-rust-50";
  }

  return (
    <div className="flex h-full flex-col px-6 pb-48">
      <p className="pt-6 font-display text-xl leading-snug text-ink-900">{card.prompt}</p>

      {pool.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {pool.map((item) => (
            <button
              key={item.id}
              onClick={() => selectItem(item.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                selectedId === item.id ? "border-ink-900 bg-ink-900 text-white" : "border-ink-300 bg-white text-ink-900 hover:border-ink-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        {card.buckets.map((bucketLabel, bucketIndex) => (
          <button
            key={bucketLabel}
            onClick={() => placeInBucket(bucketIndex as 0 | 1)}
            className={`min-h-[140px] rounded-md border border-dashed p-3 text-left transition-colors duration-150 ${
              selectedId ? "border-ink-900 bg-ink-100" : "border-ink-300 bg-ink-50"
            }`}
          >
            <p className="label-caps mb-2">{bucketLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {card.items
                .filter((i) => placements[i.id] === bucketIndex)
                .map((item) => (
                  <span
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      returnToPool(item.id);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${itemStyle(item.id, bucketIndex as 0 | 1)}`}
                  >
                    {item.label}
                  </span>
                ))}
            </div>
          </button>
        ))}
      </div>

      {!checked && (
        <button onClick={() => setChecked(true)} disabled={!allPlaced} className="btn btn-primary mt-6 w-full">
          Check answers
        </button>
      )}

      {checked && (
        <FeedbackBanner
          correct={allCorrect}
          explanation={
            allCorrect
              ? card.explanation
              : `${correctCount}/${card.items.length} correct. ${card.explanation}`
          }
          onContinue={() => onComplete(allCorrect)}
          showMascot={showMascot}
        />
      )}
    </div>
  );
}
