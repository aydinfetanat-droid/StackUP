import type { LessonCard } from "../../types/lesson";
import { ExplainCardView } from "./ExplainCardView";
import { McqCardView } from "./McqCardView";
import { TrueFalseCardView } from "./TrueFalseCardView";
import { SliderCardView } from "./SliderCardView";
import { FillNumberCardView } from "./FillNumberCardView";

interface Props {
  card: LessonCard;
  onComplete: (correct: boolean) => void;
}

export function CardRenderer({ card, onComplete }: Props) {
  switch (card.type) {
    case "explain":
      return <ExplainCardView card={card} onContinue={() => onComplete(true)} />;
    case "mcq":
      return <McqCardView card={card} onComplete={onComplete} />;
    case "truefalse":
      return <TrueFalseCardView card={card} onComplete={onComplete} />;
    case "slider":
      return <SliderCardView card={card} onComplete={onComplete} />;
    case "fillnumber":
      return <FillNumberCardView card={card} onComplete={onComplete} />;
  }
}
