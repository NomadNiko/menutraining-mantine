// ./menutraining-mantine/src/services/quiz/generators/which-menu-item-is-this.ts
// src/services/quiz/generators/which-menu-item-is-this.ts
import {
  QuizQuestion,
  QuestionType,
  Difficulty,
  DIFFICULTY_SETTINGS,
} from "../types";
import { MenuItem } from "@/services/api/types/menu-item";
import { getRandomSubset, combineAndShuffleOptions } from "./utils";

/**
 * Generates a "Which menu item is this?" question showing an image
 * and asking the user to identify the correct menu item from multiple choices
 */
export function generateWhichMenuItemIsThisQuestion(
  allMenuItems: MenuItem[],
  difficulty: Difficulty = Difficulty.MEDIUM
): QuizQuestion | null {
  try {
    // Early validation
    if (!allMenuItems.length) {
      return null;
    }

    const settings = DIFFICULTY_SETTINGS[difficulty];

    // Filter menu items that have images
    const menuItemsWithImages = allMenuItems.filter(
      (item) => item.menuItemUrl && item.menuItemUrl.trim() !== ""
    );

    // Early validation - ensure we have enough menu items with images
    if (menuItemsWithImages.length < 1) {
      return null;
    }

    // Filter out other menu items (excluding those with images to avoid conflicts)
    const otherMenuItems = allMenuItems.filter(
      (item) => !menuItemsWithImages.some((imgItem) => imgItem.id === item.id)
    );

    // Calculate incorrect count to reach total choices
    const incorrectCount = settings.totalChoices - 1;

    // Early validation - ensure we have enough incorrect options
    if (otherMenuItems.length < incorrectCount) {
      // If we don't have enough items without images, use items with images but different from the correct one
      const availableIncorrectItems = allMenuItems.filter(
        (item) => item.id !== menuItemsWithImages[0].id
      );

      if (availableIncorrectItems.length < incorrectCount) {
        return null;
      }
    }

    // Select a random menu item with an image as the correct answer
    const correctMenuItem = getRandomSubset(menuItemsWithImages, 1)[0];

    // Filter out the correct answer to get potential incorrect answers
    const availableIncorrectItems = allMenuItems.filter(
      (item) => item.id !== correctMenuItem.id
    );

    const incorrectMenuItems = getRandomSubset(
      availableIncorrectItems,
      incorrectCount
    );

    // Create options from menu items
    const correctOption = {
      id: correctMenuItem.id,
      text: correctMenuItem.menuItemName,
    };

    const incorrectOptions = incorrectMenuItems.map((item) => ({
      id: item.id,
      text: item.menuItemName,
    }));

    // Ensure we have the right total number of options
    if (1 + incorrectOptions.length !== settings.totalChoices) {
      return null;
    }

    // Combine and shuffle options
    const allOptions = combineAndShuffleOptions(
      [correctOption],
      incorrectOptions
    );

    return {
      id: `q_which_menu_item_${correctMenuItem.id}_${Date.now()}`,
      type: QuestionType.WHICH_MENU_ITEM_IS_THIS,
      questionText: "Which menu item is this?",
      imageUrl: correctMenuItem.menuItemUrl,
      options: allOptions,
      correctAnswerIds: [correctOption.id],
      isSingleChoice: true,
    };
  } catch (error) {
    console.error("Error generating which menu item is this question:", error);
    return null;
  }
}
