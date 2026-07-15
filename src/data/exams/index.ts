import type { ExamQuestion } from "../../types/exam";
import type { PlacementQuestion } from "../../types/placement";
import internPromotion from "./intern-promotion.json";
import vpPlacementData from "./vp-placement.json";

interface ExamBank {
  rankId: number;
  questions: ExamQuestion[];
}

export const promotionExamsByRankId: Record<number, ExamBank> = {
  1: internPromotion as ExamBank,
};

export function getPromotionExam(rankId: number): ExamBank | undefined {
  return promotionExamsByRankId[rankId];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawExamQuestions(rankId: number, count: number): ExamQuestion[] {
  const bank = getPromotionExam(rankId);
  if (!bank) return [];
  return shuffle(bank.questions).slice(0, count);
}

const placementQuestions = vpPlacementData.questions as PlacementQuestion[];

// Shuffles at the scenario level so linked question chains ("Jordan's first job")
// stay in their original internal order, then flattens back to a question list.
export function drawPlacementQuestions(count: number): PlacementQuestion[] {
  const groups = new Map<string, PlacementQuestion[]>();
  for (const q of placementQuestions) {
    const key = q.scenarioId ?? q.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(q);
  }
  const shuffledGroups = shuffle([...groups.values()]);
  return shuffledGroups.flat().slice(0, count);
}
