import { Lightbulb } from "lucide-react";
import type { ExplainCard } from "../../types/lesson";

interface Props {
  card: ExplainCard;
  onContinue: () => void;
}

export function ExplainCardView({ card, onContinue }: Props) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-1 flex-col justify-center px-6">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-ink-100 text-ink-700">
          <Lightbulb size={20} />
        </div>
        <p className="font-display text-2xl leading-snug text-ink-900">{card.prompt}</p>
        <p className="mt-4 text-base leading-relaxed text-ink-600">{card.explanation}</p>
      </div>
      <div className="px-5 pb-8">
        <button onClick={onContinue} className="btn btn-accent w-full">
          Got it
        </button>
      </div>
    </div>
  );
}
