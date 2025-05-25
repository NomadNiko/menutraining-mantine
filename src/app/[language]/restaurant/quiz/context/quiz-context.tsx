// src/app/[language]/restaurant/quiz/context/quiz-context.tsx
"use client";
import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import {
  QuizState,
  QuizContextType,
  QuestionGeneratorResult,
  QuizConfiguration,
} from "@/services/quiz/types";
import { generateQuizQuestions } from "@/services/quiz/question-generator";
import { useGetMenuItemsService } from "@/services/api/services/menu-items";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { useGetAllergiesService } from "@/services/api/services/allergies";
import { useGetMenuSectionsService } from "@/services/api/services/menu-sections";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { MenuSection, SectionItem } from "@/services/api/types/menu-section";
import { MenuItem } from "@/services/api/types/menu-item";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";
import { useRestaurantDataCache } from "@/services/restaurant/restaurant-data-cache";

// Storage key for quiz state
const QUIZ_STATE_STORAGE_KEY = "restaurant_quiz_state";

// Initial state
const initialState: QuizState = {
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  score: 0,
  totalQuestions: 10,
  inProgress: false,
  completed: false,
  loading: false,
  error: null,
  configuration: undefined,
};

// Actions
type QuizAction =
  | { type: "START_QUIZ_LOADING" }
  | {
      type: "START_QUIZ_SUCCESS";
      payload: { result: QuestionGeneratorResult; config: QuizConfiguration };
    }
  | { type: "START_QUIZ_ERROR"; payload: string }
  | {
      type: "ANSWER_QUESTION";
      payload: { questionIndex: number; answerIds: string[] };
    }
  | { type: "SUBMIT_ANSWER" }
  | { type: "RESET_QUIZ" }
  | { type: "LOAD_SAVED_STATE"; payload: QuizState };

// Reducer
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  let newState: QuizState;

  switch (action.type) {
    case "START_QUIZ_LOADING":
      newState = {
        ...initialState,
        loading: true,
      };
      break;

    case "START_QUIZ_SUCCESS":
      newState = {
        ...initialState,
        questions: action.payload.result.questions,
        totalQuestions: action.payload.result.questions.length,
        inProgress: true,
        loading: false,
        error: action.payload.result.error || null,
        configuration: action.payload.config,
      };
      break;

    case "START_QUIZ_ERROR":
      newState = {
        ...initialState,
        error: action.payload,
        loading: false,
      };
      break;

    case "ANSWER_QUESTION":
      newState = {
        ...state,
        userAnswers: {
          ...state.userAnswers,
          [action.payload.questionIndex]: action.payload.answerIds,
        },
      };
      break;

    case "SUBMIT_ANSWER": {
      const { currentQuestionIndex, questions, userAnswers } = state;
      const currentQuestion = questions[currentQuestionIndex];
      const userAnswerIds = userAnswers[currentQuestionIndex] || [];

      // Calculate if the answer is correct (exact match of arrays)
      const isCorrect =
        userAnswerIds.length === currentQuestion.correctAnswerIds.length &&
        userAnswerIds.every((id) =>
          currentQuestion.correctAnswerIds.includes(id)
        ) &&
        currentQuestion.correctAnswerIds.every((id) =>
          userAnswerIds.includes(id)
        );

      // Check if this was the last question
      const isLastQuestion = currentQuestionIndex === questions.length - 1;

      newState = {
        ...state,
        score: state.score + (isCorrect ? 1 : 0),
        currentQuestionIndex: isLastQuestion
          ? currentQuestionIndex
          : currentQuestionIndex + 1,
        completed: isLastQuestion,
      };
      break;
    }

    case "RESET_QUIZ":
      newState = initialState;
      break;

    case "LOAD_SAVED_STATE":
      newState = action.payload;
      break;

    default:
      return state;
  }

  // Save state to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(QUIZ_STATE_STORAGE_KEY, JSON.stringify(newState));
  }

  return newState;
}

// Create context
const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Provider component
export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const { selectedRestaurant } = useSelectedRestaurant();
  const getMenuItemsService = useGetMenuItemsService();
  const getIngredientsService = useGetIngredientsService();
  const getAllergiesService = useGetAllergiesService();
  const getMenuSectionsService = useGetMenuSectionsService();

  // Use the restaurant data cache
  const { data: cacheData } = useRestaurantDataCache();

  // Load saved state from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem(QUIZ_STATE_STORAGE_KEY);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState) as QuizState;
          // Only restore if we have a quiz in progress or completed
          if (parsedState.inProgress || parsedState.completed) {
            dispatch({ type: "LOAD_SAVED_STATE", payload: parsedState });
          }
        } catch (e) {
          console.error("Error parsing saved quiz state", e);
          localStorage.removeItem(QUIZ_STATE_STORAGE_KEY);
        }
      }
    }
  }, []);

  // Start the quiz - use cached data
  const startQuiz = async (config: QuizConfiguration): Promise<boolean> => {
    if (!selectedRestaurant) {
      dispatch({
        type: "START_QUIZ_ERROR",
        payload: "No restaurant selected",
      });
      return false;
    }

    dispatch({ type: "START_QUIZ_LOADING" });

    try {
      console.log(
        "Starting quiz for restaurant:",
        selectedRestaurant.restaurantId
      );
      console.log("Quiz configuration:", config);

      let menuItems: MenuItem[];
      let ingredients: Ingredient[];
      let allergiesMap: Record<string, Allergy>;

      // Use cached data if available
      if (cacheData && !cacheData.isLoading && cacheData.menuItems.length > 0) {
        console.log("Using cached data for quiz generation");

        // Filter menu items by selected menu sections if specified
        if (config.menuSectionIds.length > 0) {
          const menuItemIdsInSections = new Set<string>();
          cacheData.menuSections
            .filter((section: MenuSection) =>
              config.menuSectionIds.includes(section.id)
            )
            .forEach((section: MenuSection) => {
              section.items?.forEach((item: SectionItem) => {
                menuItemIdsInSections.add(item.menuItemId);
              });
            });

          menuItems = cacheData.menuItems.filter((item: MenuItem) =>
            menuItemIdsInSections.has(item.id)
          );
        } else {
          menuItems = cacheData.menuItems;
        }

        ingredients = cacheData.ingredients;

        // Convert allergies array to map
        allergiesMap = {};
        cacheData.allergies.forEach((allergy) => {
          allergiesMap[allergy.allergyId] = allergy;
        });
      } else {
        console.log("Cache not ready, fetching data directly");

        // Fall back to fetching data
        const [
          menuItemsResponse,
          ingredientsResponse,
          allergiesResponse,
          menuSectionsResponse,
        ] = await Promise.all([
          getMenuItemsService(undefined, {
            restaurantId: selectedRestaurant.restaurantId,
            limit: 300,
          }),
          getIngredientsService(undefined, {
            restaurantId: selectedRestaurant.restaurantId,
            limit: 300,
          }),
          getAllergiesService(undefined, {
            page: 1,
            limit: 300,
          }),
          config.menuSectionIds.length > 0
            ? getMenuSectionsService(undefined, {
                restaurantId: selectedRestaurant.restaurantId,
                limit: 300,
              })
            : Promise.resolve({ status: HTTP_CODES_ENUM.OK, data: [] }),
        ]);

        // Check for API errors
        if (menuItemsResponse.status !== HTTP_CODES_ENUM.OK) {
          throw new Error("Failed to fetch menu items");
        }
        if (ingredientsResponse.status !== HTTP_CODES_ENUM.OK) {
          throw new Error("Failed to fetch ingredients");
        }
        if (allergiesResponse.status !== HTTP_CODES_ENUM.OK) {
          throw new Error("Failed to fetch allergies");
        }

        // Process menu items
        const allMenuItems = Array.isArray(menuItemsResponse.data)
          ? menuItemsResponse.data
          : menuItemsResponse.data?.data || [];

        // Filter menu items by selected menu sections if specified
        if (
          config.menuSectionIds.length > 0 &&
          menuSectionsResponse.status === HTTP_CODES_ENUM.OK
        ) {
          const allSections = Array.isArray(menuSectionsResponse.data)
            ? menuSectionsResponse.data
            : menuSectionsResponse.data?.data || [];

          // Filter sections by selected IDs and extract menu item IDs
          const menuItemIdsInSections = new Set<string>();
          allSections
            .filter((section: MenuSection) =>
              config.menuSectionIds.includes(section.id)
            )
            .forEach((section: MenuSection) => {
              section.items?.forEach((item: SectionItem) => {
                menuItemIdsInSections.add(item.menuItemId);
              });
            });

          menuItems = allMenuItems.filter((item: MenuItem) =>
            menuItemIdsInSections.has(item.id)
          );
        } else {
          menuItems = allMenuItems;
        }

        // Process ingredients
        ingredients = Array.isArray(ingredientsResponse.data)
          ? ingredientsResponse.data
          : ingredientsResponse.data?.data || [];

        // Process allergies
        const allergiesArray = Array.isArray(allergiesResponse.data)
          ? allergiesResponse.data
          : allergiesResponse.data?.data || [];

        allergiesMap = {};
        allergiesArray.forEach((allergy) => {
          allergiesMap[allergy.allergyId] = allergy;
        });
      }

      console.log(
        `Using ${menuItems.length} menu items, ${ingredients.length} ingredients, ${Object.keys(allergiesMap).length} allergies`
      );

      // Generate questions with configuration
      const result = await generateQuizQuestions(
        {
          menuItems,
          ingredients,
          allergies: allergiesMap,
        },
        config.questionCount,
        config.questionTypes,
        config.difficulty
      );

      console.log(`Generated ${result.questions.length} questions`);

      if (result.questions.length === 0) {
        throw new Error(result.error || "Failed to generate any questions");
      }

      dispatch({
        type: "START_QUIZ_SUCCESS",
        payload: { result, config },
      });

      return result.questions.length > 0;
    } catch (error) {
      console.error("Error starting quiz:", error);
      dispatch({
        type: "START_QUIZ_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to start quiz",
      });
      return false;
    }
  };

  // Handle answering a question
  const answerQuestion = (selectedAnswerIds: string[]) => {
    dispatch({
      type: "ANSWER_QUESTION",
      payload: {
        questionIndex: state.currentQuestionIndex,
        answerIds: selectedAnswerIds,
      },
    });
  };

  // Submit the current answer and move to next question
  const submitAnswer = () => {
    dispatch({ type: "SUBMIT_ANSWER" });
  };

  // Reset the quiz
  const resetQuiz = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(QUIZ_STATE_STORAGE_KEY);
    }
    dispatch({ type: "RESET_QUIZ" });
  };

  const contextValue: QuizContextType = {
    state,
    startQuiz,
    answerQuestion,
    submitAnswer,
    resetQuiz,
  };

  return (
    <QuizContext.Provider value={contextValue}>{children}</QuizContext.Provider>
  );
}

// Custom hook to use the quiz context
export function useQuiz(): QuizContextType {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
}
