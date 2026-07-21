import { useState } from "react";

export const MAX_HEARTS = 5;

export function useHearts() {
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [justLost, setJustLost] = useState(false);

  function loseHeart() {
    setHearts((h) => Math.max(0, h - 1));
    setJustLost(true);
    setTimeout(() => setJustLost(false), 300);
  }

  function reset() {
    setHearts(MAX_HEARTS);
  }

  return { hearts, maxHearts: MAX_HEARTS, isOut: hearts <= 0, justLost, loseHeart, reset };
}
