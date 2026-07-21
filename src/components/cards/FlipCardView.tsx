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
        <p className="label-caps mb-4 text-center">{flipped ? "Here's the fact" : "Tap to reveal"}</p>
        <div
          onClick={() => setFlipped(true)}
          className="relative mx-auto w-full max-w-sm cursor-pointer"
          style={{ perspective: 1000 }}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative min-h-[220px] w-full"
          >
            <div
              className="absolute inset-0 flex items-center justify-center rounded-md border border-ink-200 bg-surface p-6"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-center font-display text-xl leading-snug text-ink-900">{card.frontText}</p>
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center rounded-md border border-ink-800 bg-onyx p-6"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <p className="text-center text-lg font-medium leading-snug text-white">{card.backText}</p>
            </div>
          </motion.div>
        </div>
        {!flipped && (
          <p className="mt-6 text-center text-sm text-ink-500">{card.prompt}</p>
        )}
      </div>
      <div className="pb-8">
        {flipped ? (
          <button onClick={onContinue} className="btn btn-accent w-full">
            Continue
          </button>
        ) : (
          <button onClick={() => setFlipped(true)} className="btn btn-primary w-full">
            Reveal
          </button>
        )}
      </div>
    </div>
  );
}
