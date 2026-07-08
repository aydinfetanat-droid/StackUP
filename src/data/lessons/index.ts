import type { Lesson } from "../../types/lesson";
import unit1Lesson1 from "./unit1-lesson1.json";
import unit1Lesson2 from "./unit1-lesson2.json";
import unit1Lesson3 from "./unit1-lesson3.json";

export const lessons: Lesson[] = [
  unit1Lesson1 as Lesson,
  unit1Lesson2 as Lesson,
  unit1Lesson3 as Lesson,
];

export const lessonsById: Record<string, Lesson> = Object.fromEntries(
  lessons.map((lesson) => [lesson.id, lesson]),
);

export function getLesson(id: string): Lesson | undefined {
  return lessonsById[id];
}
