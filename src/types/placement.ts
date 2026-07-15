export type PlacementQuestionKind = "mcq" | "fillnumber";

interface BasePlacementQuestion {
  id: string;
  kind: PlacementQuestionKind;
  prompt: string;
  explanation: string;
  topic: string;
  scenarioId?: string;
}

export interface PlacementMcqQuestion extends BasePlacementQuestion {
  kind: "mcq";
  options: string[];
  correctIndex: number;
}

export interface PlacementFillNumberQuestion extends BasePlacementQuestion {
  kind: "fillnumber";
  unit?: string;
  correctAnswer: number;
  tolerance?: number;
}

export type PlacementQuestion = PlacementMcqQuestion | PlacementFillNumberQuestion;
