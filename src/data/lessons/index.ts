import type { Lesson } from "../../types/lesson";
import unit1Lesson1 from "./unit1-lesson1.json";
import unit1Lesson2 from "./unit1-lesson2.json";
import unit1Lesson3 from "./unit1-lesson3.json";
import unit2Lesson1 from "./unit2-lesson1.json";
import unit2Lesson2 from "./unit2-lesson2.json";
import unit2Lesson3 from "./unit2-lesson3.json";
import unit3Lesson1 from "./unit3-lesson1.json";
import unit3Lesson2 from "./unit3-lesson2.json";
import unit3Lesson3 from "./unit3-lesson3.json";
import unit4Lesson1 from "./unit4-lesson1.json";
import unit4Lesson2 from "./unit4-lesson2.json";
import unit4Lesson3 from "./unit4-lesson3.json";
import unit5Lesson1 from "./unit5-lesson1.json";
import unit5Lesson2 from "./unit5-lesson2.json";
import unit5Lesson3 from "./unit5-lesson3.json";
import unit6Lesson1 from "./unit6-lesson1.json";
import unit6Lesson2 from "./unit6-lesson2.json";
import unit6Lesson3 from "./unit6-lesson3.json";

export const lessons: Lesson[] = [
  unit1Lesson1, unit1Lesson2, unit1Lesson3,
  unit2Lesson1, unit2Lesson2, unit2Lesson3,
  unit3Lesson1, unit3Lesson2, unit3Lesson3,
  unit4Lesson1, unit4Lesson2, unit4Lesson3,
  unit5Lesson1, unit5Lesson2, unit5Lesson3,
  unit6Lesson1, unit6Lesson2, unit6Lesson3,
] as Lesson[];

export const lessonsById: Record<string, Lesson> = Object.fromEntries(
  lessons.map((lesson) => [lesson.id, lesson]),
);

export function getLesson(id: string): Lesson | undefined {
  return lessonsById[id];
}
