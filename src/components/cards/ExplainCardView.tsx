import type { ExplainCard } from "../../types/lesson";

interface Props {
  card: ExplainCard;
  onContinue: () => void;
}

export function ExplainCardView({ card, onContinue }: Props) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-1 flex-col justify-center px-6">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-2xl shadow-md">
          💡
        </div>
        <p className="text-2xl font-extrabold leading-snug text-ink-900">{card.prompt}</p>
        <p className="mt-4 text-base leading-relaxed text-ink-700">{card.explanation}</p>
      </div>
      <div className="px-5 pb-8">
        <button onClick={onContinue} className="btn-chunky btn-chunky--brand w-full">
          Got it
        </button>
      </div>
    </div>
  );
}
