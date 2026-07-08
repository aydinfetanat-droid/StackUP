import type { ExplainCard } from "../../types/lesson";

interface Props {
  card: ExplainCard;
  onContinue: () => void;
}

export function ExplainCardView({ card, onContinue }: Props) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-1 flex-col justify-center px-6">
        <p className="text-2xl font-extrabold leading-snug text-ink-900">{card.prompt}</p>
        <p className="mt-4 text-base leading-relaxed text-ink-700">{card.explanation}</p>
      </div>
      <div className="px-5 pb-8">
        <button
          onClick={onContinue}
          className="w-full rounded-xl bg-brand-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.98]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
