import type { LessonCard } from "../../types/lesson";
import { ExplainCardView } from "./ExplainCardView";
import { McqCardView } from "./McqCardView";
import { TrueFalseCardView } from "./TrueFalseCardView";
import { SliderCardView } from "./SliderCardView";
import { FillNumberCardView } from "./FillNumberCardView";
import { FlipCardView } from "./FlipCardView";
import { SortCardView } from "./SortCardView";
import { AllocatorCardView } from "./AllocatorCardView";
import { SequenceCardView } from "./SequenceCardView";

interface Props {
  card: LessonCard;
  onComplete: (correct: boolean) => void;
  showMascot?: boolean;
}

export function CardRenderer({ card, onComplete, showMascot }: Props) {
  switch (card.type) {
    case "explain":
      return <ExplainCardView card={card} onContinue={() => onComplete(true)} />;
    case "mcq":
      return <McqCardView card={card} onComplete={onComplete} showMascot={showMascot} />;
    case "truefalse":
      return <TrueFalseCardView card={card} onComplete={onComplete} showMascot={showMascot} />;
    case "slider":
      return <SliderCardView card={card} onComplete={onComplete} showMascot={showMascot} />;
    case "fillnumber":
      return <FillNumberCardView card={card} onComplete={onComplete} showMascot={showMascot} />;
    case "flip":
      return <FlipCardView card={card} onContinue={() => onComplete(true)} />;
    case "sort":
      return <SortCardView card={card} onComplete={onComplete} showMascot={showMascot} />;
    case "allocator":
      return <AllocatorCardView card={card} onComplete={onComplete} showMascot={showMascot} />;
    case "sequence":
      return <SequenceCardView card={card} onComplete={onComplete} showMascot={showMascot} />;
  }
}
