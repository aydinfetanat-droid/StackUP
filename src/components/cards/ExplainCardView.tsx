import { useState } from "react";
import { Lightbulb, ChevronDown } from "lucide-react";
import type { ExplainCard } from "../../types/lesson";
import { GlossaryText } from "../GlossaryText";

interface Props {
  card: ExplainCard;
  onContinue: () => void;
}

export function ExplainCardView({ card, onContinue }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-1 flex-col justify-center px-6">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-ink-100 text-ink-700">
          <Lightbulb size={20} />
        </div>
        <p className="font-display text-2xl leading-snug text-ink-900">{card.prompt}</p>
        <p className="mt-4 text-base leading-relaxed text-ink-600">
          <GlossaryText text={card.explanation} />
        </p>

        {card.digDeeper && (
          <div className="mt-4">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-semibold text-ink-700 transition-colors duration-150 hover:text-ink-900"
            >
              <ChevronDown size={15} className={`transition-transform duration-150 ${expanded ? "rotate-180" : ""}`} />
              {expanded ? "Show less" : "Dig deeper"}
            </button>
            {expanded && (
              <p className="mt-2.5 border-l-2 border-ink-200 pl-3 text-sm leading-relaxed text-ink-600">
                <GlossaryText text={card.digDeeper} />
              </p>
            )}
          </div>
        )}
      </div>
      <div className="px-5 pb-8">
        <button onClick={onContinue} className="btn btn-accent w-full">
          Got it
        </button>
      </div>
    </div>
  );
}
