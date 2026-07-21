import { Heart } from "lucide-react";

interface Props {
  hearts: number;
  maxHearts: number;
  justLost: boolean;
}

export function Hearts({ hearts, maxHearts, justLost }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {Array.from({ length: maxHearts }).map((_, i) => {
        const filled = i < hearts;
        const isLastLost = justLost && i === hearts;
        return (
          <Heart
            key={i}
            size={15}
            className={`${filled ? "text-rust-500" : "text-ink-200"} ${isLastLost ? "heart-lose" : ""}`}
            fill={filled ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}
