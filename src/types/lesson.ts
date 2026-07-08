export type CardType = "explain" | "mcq" | "truefalse" | "slider" | "fillnumber";

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

export type LessonCard = ExplainCard | McqCard | TrueFalseCard | SliderCard | FillNumberCard;

export interface Lesson {
  id: string;
  unit: number;
  order: number;
  title: string;
  summary: string;
  cards: LessonCard[];
}

export interface UnitMeta {
  id: number;
  title: string;
  description: string;
  lessonIds: string[];
}
