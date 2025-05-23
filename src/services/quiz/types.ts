// src/services/quiz/types.ts
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";

export enum QuestionType {
  INGREDIENTS_IN_DISH = "ingredients_in_dish",
  INGREDIENTS_WITH_ALLERGY = "ingredients_with_allergy",
  MENU_ITEM_CONTAINS_INGREDIENT = "menu_item_contains_ingredient",
  INGREDIENT_OR_MENU_ITEM_CONTAINS_ALLERGY = "ingredient_or_menu_item_contains_allergy",
}

export interface AnswerOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  questionText: string;
  imageUrl?: string | null;
  options: AnswerOption[];
  correctAnswerIds: string[];
  isSingleChoice?: boolean; // Add this to explicitly mark single choice questions
}

export interface QuizConfiguration {
  questionCount: number;
  questionTypes: QuestionType[];
  menuSectionIds: string[];
}

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  userAnswers: Record<number, string[]>;
  score: number;
  totalQuestions: number;
  inProgress: boolean;
  completed: boolean;
  loading: boolean;
  error: string | null;
  configuration?: QuizConfiguration;
}

export interface QuizContextType {
  state: QuizState;
  startQuiz: (config: QuizConfiguration) => Promise<boolean>;
  answerQuestion: (selectedAnswerIds: string[]) => void;
  submitAnswer: () => void;
  resetQuiz: () => void;
}

export interface QuestionGeneratorResult {
  questions: QuizQuestion[];
  error?: string;
}

export interface RestaurantData {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  allergies: Record<string, Allergy>;
}
