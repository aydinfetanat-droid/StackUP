export type CardType =
  | "explain"
  | "mcq"
  | "truefalse"
  | "slider"
  | "fillnumber"
  | "flip"
  | "sort"
  | "allocator"
  | "sequence";

interface BaseCard {
  type: CardType;
  prompt: string;
  explanation: string;
}

export interface ExplainCard extends BaseCard {
  type: "explain";
}

export interface McqCard extends BaseCard {
  type: "mcq";
  options: string[];
  correctIndex: number;
}

export interface TrueFalseCard extends BaseCard {
  type: "truefalse";
  correctAnswer: boolean;
}

export interface SliderCard extends BaseCard {
  type: "slider";
  min: number;
  max: number;
  step: number;
  unit?: string;
  correctAnswer: number;
  tolerance: number;
}

export interface FillNumberCard extends BaseCard {
  type: "fillnumber";
  unit?: string;
  correctAnswer: number;
  tolerance?: number;
}

// Tap-to-reveal card: a question or teaser on the front, a fact/answer on the
// back. Not scored — a lightweight, more interactive alternative to a plain
// explain card for delivering real facts and detail.
export interface FlipCard extends BaseCard {
  type: "flip";
  frontText: string;
  backText: string;
}

// Tap-to-select-then-tap-bucket sorting game: classify a pile of items into
// one of two buckets (e.g. Need vs Want).
export interface SortCard extends BaseCard {
  type: "sort";
  buckets: [string, string];
  items: { id: string; label: string; bucket: 0 | 1 }[];
}

// Interactive slider-based allocator: split a total amount across categories
// with a live visual, must sum to 100% before checking.
export interface AllocatorCard extends BaseCard {
  type: "allocator";
  totalAmount: number;
  unit?: string;
  categories: { id: string; label: string; correctPercent: number; tolerancePercent: number }[];
}

// Tap-to-append ordering game: tap steps in the pool to build up the sequence
// in order (tap a placed step to send it back to the pool).
export interface SequenceCard extends BaseCard {
  type: "sequence";
  steps: { id: string; label: string }[];
  correctOrder: string[];
}

export type LessonCard =
  | ExplainCard
  | McqCard
  | TrueFalseCard
  | SliderCard
  | FillNumberCard
  | FlipCard
  | SortCard
  | AllocatorCard
  | SequenceCard;

export interface Lesson {
  id: string;
  unit: number;
  order: number;
  title: string;
  summary: string;
  cards: LessonCard[];
  lastReviewed: string;
  doThisToday?: string;
}

export interface UnitMeta {
  id: number;
  rankId: number;
  title: string;
  description: string;
  lessonIds: string[];
}
