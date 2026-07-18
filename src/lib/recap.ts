import type { Lesson, LessonCard } from "../types/lesson";

const UNSCORED_TYPES = new Set(["explain", "flip"]);

export const RECAP_SIZE = 5;
export const RECAP_PASS_RATIO = 0.8;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Recap questions are sampled from the lesson's own scored cards (mcq,
// truefalse, fillnumber, slider, sort, allocator, sequence) — no separate
// content bank needed. Returns each card paired with its original index in
// lesson.cards, so missed_card_answers logging stays consistent with the
// main lesson pass.
export function sampleRecapQuestions(lesson: Lesson): { card: LessonCard; cardIndex: number }[] {
  const scored = lesson.cards
    .map((card, cardIndex) => ({ card, cardIndex }))
    .filter((entry) => !UNSCORED_TYPES.has(entry.card.type));

  const sampled = shuffle(scored).slice(0, RECAP_SIZE);
  // Keep them in their original lesson order so the recap still reads coherently.
  return sampled.sort((a, b) => a.cardIndex - b.cardIndex);
}

export function recapPassThreshold(total: number): number {
  return Math.ceil(total * RECAP_PASS_RATIO);
}
