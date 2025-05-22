// src/services/quiz/generators/ingredients-with-allergy.ts
import { QuizQuestion, QuestionType } from "../types";
import { Allergy } from "@/services/api/types/allergy";
import { Ingredient } from "@/services/api/types/ingredient";
import { getRandomSubset, combineAndShuffleOptions } from "./utils";

/**
 * Generates a question about ingredients that contain a specific allergy
 */
export function generateIngredientsWithAllergyQuestion(
  allergy: Allergy,
  allIngredients: Ingredient[]
): QuizQuestion | null {
  try {
    // Find ingredients that contain this allergy
    const ingredientsWithAllergy = allIngredients.filter((ing) => {
      const allAllergies = [
        ...(ing.ingredientAllergies || []),
        ...(ing.derivedAllergies || []),
      ];
      return allAllergies.includes(allergy.allergyId);
    });

    // We need at least 1 ingredient with this allergy
    if (ingredientsWithAllergy.length < 1) {
      return null;
    }

    // Get 1-3 correct ingredients (or all if fewer)
    const correctCount = Math.min(
      ingredientsWithAllergy.length,
      Math.floor(Math.random() * 3) + 1 // 1-3 correct answers
    );
    const selectedCorrect = getRandomSubset(
      ingredientsWithAllergy,
      correctCount
    ).map((ing) => ({
      id: ing.ingredientId,
      text: ing.ingredientName,
    }));

    // Find ingredients that do NOT contain this allergy
    const ingredientsWithoutAllergy = allIngredients.filter((ing) => {
      const allAllergies = [
        ...(ing.ingredientAllergies || []),
        ...(ing.derivedAllergies || []),
      ];
      return !allAllergies.includes(allergy.allergyId);
    });

    // Get 3-5 incorrect options to ensure we have enough choices
    const targetIncorrectCount = 6 - correctCount; // Aim for 6 total options
    const incorrectCount = Math.min(
      ingredientsWithoutAllergy.length,
      Math.max(3, targetIncorrectCount) // At least 3 incorrect options
    );

    if (ingredientsWithoutAllergy.length < 3) {
      // Not enough incorrect options to make a good question
      return null;
    }

    const selectedIncorrected = getRandomSubset(
      ingredientsWithoutAllergy,
      incorrectCount
    ).map((ing) => ({
      id: ing.ingredientId,
      text: ing.ingredientName,
    }));

    // Combine and shuffle options
    const allOptions = combineAndShuffleOptions(
      selectedCorrect,
      selectedIncorrected
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
