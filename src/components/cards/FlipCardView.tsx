import { useState } from "react";
import { motion } from "framer-motion";
import type { FlipCard } from "../../types/lesson";

interface Props {
  card: FlipCard;
  onContinue: () => void;
}

export function FlipCardView({ card, onContinue }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex h-full flex-col justify-between px-6">
      <div className="flex flex-1 flex-col justify-center">
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-wide text-brand-600">
          {flipped ? "Here's the fact" : "Tap to reveal"}
        </p>
        <div
          onClick={() => setFlipped(true)}
          className="relative mx-auto w-full max-w-sm cursor-pointer"
          style={{ perspective: 1000 }}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative min-h-[220px] w-full"
          >
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-brand-200 bg-brand-50 p-6"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-center text-xl font-extrabold leading-snug text-ink-900">{card.frontText}</p>
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-brand-500 bg-brand-600 p-6"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <p className="text-center text-lg font-semibold leading-snug text-white">{card.backText}</p>
            </div>
          </motion.div>
        </div>
        {!flipped && (
          <p className="mt-6 text-center text-sm text-ink-500">{card.prompt}</p>
        )}
      </div>
      <div className="pb-8">
        {flipped ? (
          <button
            onClick={onContinue}
            className="w-full rounded-xl bg-brand-600 py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.98]"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="w-full rounded-xl bg-ink-900 py-4 text-base font-bold text-white shadow-sm transition active:scale-[0.98]"
          >
            Reveal
          </button>
        )}
      </div>
    </div>
  );
}
