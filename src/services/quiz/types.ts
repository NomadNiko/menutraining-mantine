// src/services/quiz/types.ts
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";

export enum QuestionType {
  INGREDIENTS_IN_DISH = "ingredients_in_dish",
  INGREDIENTS_WITH_ALLERGY = "ingredients_with_allergy",
  MENU_ITEM_CONTAINS_INGREDIENT = "menu_item_contains_ingredient",
  INGREDIENT_CONTAINS_ALLERGY = "ingredient_contains_allergy",
  MENU_ITEM_CONTAINS_ALLERGY = "menu_item_contains_allergy",
}

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum QuizMode {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  CUSTOM = "custom",
}

export interface DifficultySettings {
  totalChoices: number;
  minCorrect: number;
  maxCorrect: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  [Difficulty.EASY]: {
    totalChoices: 2,
    minCorrect: 1,
    maxCorrect: 1,
  },
  [Difficulty.MEDIUM]: {
    totalChoices: 4,
    minCorrect: 1,
    maxCorrect: 3,
  },
  [Difficulty.HARD]: {
    totalChoices: 6,
    minCorrect: 1,
    maxCorrect: 5,
  },
};

export interface QuizModeSettings {
  questionCount: number;
  difficulty: Difficulty;
  questionTypes: QuestionType[];
}

export const QUIZ_MODE_SETTINGS: Record<
  Exclude<QuizMode, QuizMode.CUSTOM>,
  QuizModeSettings
> = {
  [QuizMode.EASY]: {
    questionCount: 5,
    difficulty: Difficulty.EASY,
    questionTypes: [
      QuestionType.MENU_ITEM_CONTAINS_INGREDIENT,
      QuestionType.INGREDIENTS_IN_DISH,
    ],
  },
  [QuizMode.MEDIUM]: {
    questionCount: 10,
    difficulty: Difficulty.MEDIUM,
    questionTypes: [
      QuestionType.MENU_ITEM_CONTAINS_INGREDIENT,
      QuestionType.INGREDIENTS_IN_DISH,
      QuestionType.INGREDIENT_CONTAINS_ALLERGY,
    ],
  },
  [QuizMode.HARD]: {
    questionCount: 20,
    difficulty: Difficulty.HARD,
    questionTypes: Object.values(QuestionType),
  },
};

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
  isSingleChoice?: boolean;
}

export interface QuizConfiguration {
  mode: QuizMode;
  questionCount: number;
  questionTypes: QuestionType[];
  menuSectionIds: string[];
  difficulty: Difficulty;
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
