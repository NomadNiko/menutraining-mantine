// src/services/quiz/generators/utils.ts
/**
 * Utility functions for quiz question generators
 */
import { AnswerOption } from "../types";

/**
 * Shuffles an array using the Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets a random subset of items from an array
 */
export function getRandomSubset<T>(array: T[], count: number): T[] {
  if (!array.length) return [];
  if (array.length <= count) return [...array];
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

/**
 * Creates a standardized answer option from an object with id and text properties
 */
export function createAnswerOption(obj: {
  id: string;
  text: string;
}): AnswerOption {
  return {
    id: obj.id,
    text: obj.text,
  };
}

/**
 * Combines and shuffles correct and incorrect options
 */
export function combineAndShuffleOptions(
  correctOptions: AnswerOption[],
  incorrectOptions: AnswerOption[]
): AnswerOption[] {
  return shuffleArray([...correctOptions, ...incorrectOptions]);
}
