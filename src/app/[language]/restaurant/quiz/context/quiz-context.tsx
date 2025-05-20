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
} from "@/services/quiz/types";
import { generateQuizQuestions } from "@/services/quiz/question-generator";
import { useGetMenuItemsService } from "@/services/api/services/menu-items";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { useGetAllergiesService } from "@/services/api/services/allergies";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";

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
};

// Actions
type QuizAction =
  | { type: "START_QUIZ_LOADING" }
  | { type: "START_QUIZ_SUCCESS"; payload: QuestionGeneratorResult }
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
        questions: action.payload.questions,
        totalQuestions: action.payload.questions.length,
        inProgress: true,
        loading: false,
        error: action.payload.error || null,
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

  // Start the quiz - fetch data and generate questions
  const startQuiz = async (): Promise<boolean> => {
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

      // Fetch menu items for the restaurant
      const menuItemsResponse = await getMenuItemsService(undefined, {
        restaurantId: selectedRestaurant.restaurantId,
        limit: 100,
      });

      if (menuItemsResponse.status !== HTTP_CODES_ENUM.OK) {
        throw new Error("Failed to fetch menu items");
      }

      const menuItems = Array.isArray(menuItemsResponse.data)
        ? menuItemsResponse.data
        : menuItemsResponse.data?.data || [];

      console.log(`Fetched ${menuItems.length} menu items`);

      // Fetch ingredients for the restaurant
      const ingredientsResponse = await getIngredientsService(undefined, {
        restaurantId: selectedRestaurant.restaurantId,
        limit: 100,
      });

      if (ingredientsResponse.status !== HTTP_CODES_ENUM.OK) {
        throw new Error("Failed to fetch ingredients");
      }

      const ingredients = Array.isArray(ingredientsResponse.data)
        ? ingredientsResponse.data
        : ingredientsResponse.data?.data || [];

      console.log(`Fetched ${ingredients.length} ingredients`);

      // Fetch allergies
      const allergiesResponse = await getAllergiesService(undefined, {
        page: 1,
        limit: 100,
      });

      if (allergiesResponse.status !== HTTP_CODES_ENUM.OK) {
        throw new Error("Failed to fetch allergies");
      }

      const allergiesArray = Array.isArray(allergiesResponse.data)
        ? allergiesResponse.data
        : allergiesResponse.data?.data || [];

      console.log(`Fetched ${allergiesArray.length} allergies`);

      const allergiesMap: Record<string, (typeof allergiesArray)[0]> = {};
      allergiesArray.forEach((allergy) => {
        allergiesMap[allergy.allergyId] = allergy;
      });

      // Generate questions
      const result = await generateQuizQuestions(
        {
          menuItems,
          ingredients,
          allergies: allergiesMap,
        },
        10
      );

      console.log(`Generated ${result.questions.length} questions`);

      dispatch({
        type: "START_QUIZ_SUCCESS",
        payload: result,
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
