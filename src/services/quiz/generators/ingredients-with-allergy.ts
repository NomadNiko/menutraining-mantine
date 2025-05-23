// src/services/quiz/generators/ingredients-with-allergy.ts
import {
  QuizQuestion,
  QuestionType,
  Difficulty,
  DIFFICULTY_SETTINGS,
} from "../types";
import { Allergy } from "@/services/api/types/allergy";
import { Ingredient } from "@/services/api/types/ingredient";
import { getRandomSubset, combineAndShuffleOptions } from "./utils";

/**
 * Gets all allergies for an ingredient, including allergies from sub-ingredients
 * @param ingredient The ingredient to check
 * @param allIngredients Array of all available ingredients
 * @param visited Set to prevent infinite recursion
 * @returns Set of all allergy IDs
 */
function getIngredientAllAllergies(
  ingredient: Ingredient,
  allIngredients: Ingredient[],
  visited: Set<string> = new Set()
): Set<string> {
  const allAllergies = new Set<string>();

  // Prevent infinite recursion
  if (visited.has(ingredient.ingredientId)) {
    return allAllergies;
  }
  visited.add(ingredient.ingredientId);

  // Add direct allergies
  if (ingredient.ingredientAllergies) {
    ingredient.ingredientAllergies.forEach((allergyId) =>
      allAllergies.add(allergyId)
    );
  }

  // Add derived allergies (if they exist in the data model)
  if (ingredient.derivedAllergies) {
    ingredient.derivedAllergies.forEach((allergyId) =>
      allAllergies.add(allergyId)
    );
  }

  // Add allergies from sub-ingredients
  if (ingredient.subIngredients && ingredient.subIngredients.length > 0) {
    const ingredientMap = new Map<string, Ingredient>();
    allIngredients.forEach((ing) => {
      ingredientMap.set(ing.ingredientId, ing);
    });

    ingredient.subIngredients.forEach((subIngredientId) => {
      const subIngredient = ingredientMap.get(subIngredientId);
      if (subIngredient) {
        const subAllergies = getIngredientAllAllergies(
          subIngredient,
          allIngredients,
          visited
        );
        subAllergies.forEach((allergyId) => allAllergies.add(allergyId));
      }
    });
  }

  return allAllergies;
}

/**
 * Generates a question about ingredients that contain a specific allergy
 * Now considers allergies from sub-ingredients recursively and uses difficulty settings
 */
export function generateIngredientsWithAllergyQuestion(
  allergy: Allergy,
  allIngredients: Ingredient[],
  difficulty: Difficulty = Difficulty.MEDIUM
): QuizQuestion | null {
  try {
    // Early validation
    if (!allIngredients.length || !allergy.allergyId) {
      return null;
    }

    const settings = DIFFICULTY_SETTINGS[difficulty];

    // Separate ingredients with and without the allergy in one pass
    // Now considering sub-ingredient allergies
    const ingredientsWithAllergy: Ingredient[] = [];
    const ingredientsWithoutAllergy: Ingredient[] = [];

    for (const ingredient of allIngredients) {
      const allAllergies = getIngredientAllAllergies(
        ingredient,
        allIngredients
      );
      if (allAllergies.has(allergy.allergyId)) {
        ingredientsWithAllergy.push(ingredient);
      } else {
        ingredientsWithoutAllergy.push(ingredient);
      }
    }

    // Calculate required counts based on difficulty
    const minCorrectNeeded = settings.minCorrect;
    const maxCorrectAllowed = Math.min(
      settings.maxCorrect,
      ingredientsWithAllergy.length
    );
    const minIncorrectNeeded = settings.totalChoices - maxCorrectAllowed;

    // Early validation - ensure we have enough ingredients
    if (
      ingredientsWithAllergy.length < minCorrectNeeded ||
      ingredientsWithoutAllergy.length < minIncorrectNeeded
    ) {
      return null;
    }

    // Determine actual correct count within difficulty constraints
    const correctCount = Math.min(
      ingredientsWithAllergy.length,
      Math.max(
        minCorrectNeeded,
        Math.floor(Math.random() * (maxCorrectAllowed - minCorrectNeeded + 1)) +
          minCorrectNeeded
      )
    );

    const selectedCorrect = getRandomSubset(
      ingredientsWithAllergy,
      correctCount
    ).map((ing) => ({
      id: ing.ingredientId,
      text: ing.ingredientName,
    }));

    // Calculate incorrect count to reach total choices
    const incorrectCount = settings.totalChoices - correctCount;
    const selectedIncorrect = getRandomSubset(
      ingredientsWithoutAllergy,
      Math.min(incorrectCount, ingredientsWithoutAllergy.length)
    ).map((ing) => ({
      id: ing.ingredientId,
      text: ing.ingredientName,
    }));

    // Ensure we have the right total number of options
    if (
      selectedCorrect.length + selectedIncorrect.length !==
      settings.totalChoices
    ) {
      return null;
    }

    // Combine and shuffle options
    const allOptions = combineAndShuffleOptions(
      selectedCorrect,
      selectedIncorrect
    );

    return {
      id: `q_allergy_${allergy.allergyId}`,
      type: QuestionType.INGREDIENTS_WITH_ALLERGY,
      questionText: `Which ingredients contain the ${allergy.allergyName} allergy?`,
      imageUrl: allergy.allergyLogoUrl || null,
      options: allOptions,
      correctAnswerIds: selectedCorrect.map((ing) => ing.id),
    };
  } catch (error) {
    console.error("Error generating allergy question:", error);
    return null;
  }
}
