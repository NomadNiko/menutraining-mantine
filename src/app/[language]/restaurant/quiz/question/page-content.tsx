// src/app/[language]/restaurant/quiz/question/page-content.tsx
"use client";
import {
  Container,
  Title,
  Paper,
  Button,
  Stack,
  Group,
  Text,
  Center,
  Image,
  Grid,
  Alert,
  Loader,
} from "@mantine/core";
import { IconInfoCircle, IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuiz } from "../context/quiz-context";
import { QuizProgress } from "../components/QuizProgress";
import { AnswerOption } from "../components/AnswerOption";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";

function QuizQuestionPage() {
  const { t } = useTranslation("restaurant-quiz");
  const router = useRouter();
  const { selectedRestaurant } = useSelectedRestaurant();
  const { state, answerQuestion, submitAnswer } = useQuiz();
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);

  // Redirect to results page when quiz completes
  useEffect(() => {
    if (state.completed) {
      router.push("/restaurant/quiz/results");
    }
  }, [state.completed, router]);

  // Initialize selected answers from state when question changes
  useEffect(() => {
    const currentAnswers = state.userAnswers[state.currentQuestionIndex] || [];
    setSelectedAnswers(currentAnswers);
  }, [state.currentQuestionIndex, state.userAnswers]);

  // Handle answer selection
  const toggleAnswerSelection = (answerId: string) => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    const isSingleChoice = currentQuestion?.isSingleChoice;

    let newSelectedAnswers: string[];

    if (isSingleChoice) {
      // For single choice questions, only allow one selection
      newSelectedAnswers = [answerId];
    } else {
      // For multiple choice questions, allow toggle
      newSelectedAnswers = selectedAnswers.includes(answerId)
        ? selectedAnswers.filter((id) => id !== answerId)
        : [...selectedAnswers, answerId];
    }

    setSelectedAnswers(newSelectedAnswers);
    answerQuestion(newSelectedAnswers);
  };

  // Handle submission
  const handleSubmit = () => {
    submitAnswer();
  };

  // Early returns for special cases
  if (!selectedRestaurant) {
    return (
      <Container size="md">
        <Alert
          icon={<IconInfoCircle size={16} />}
          title={t("quiz.noRestaurantSelected")}
          color="blue"
        >
          {t("quiz.pleaseSelectRestaurant")}
        </Alert>
      </Container>
    );
  }

  if (state.loading) {
    return (
      <Container size="md">
        <Center p="xl">
          <Loader size="xl" />
        </Center>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container size="md">
        <Alert
          icon={<IconInfoCircle size={16} />}
          title={t("quiz.error")}
          color="red"
        >
          {state.error}
        </Alert>
      </Container>
    );
  }

  if (!state.inProgress || state.questions.length === 0) {
    router.push("/restaurant/quiz");
    return (
      <Container size="md">
        <Center p="xl">
          <Loader size="sm" />
        </Center>
      </Container>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const isSingleChoice = currentQuestion.isSingleChoice;

  return (
    <Container size="lg">
      <Stack gap="lg" my="xl">
        <Group justify="space-between">
          <Title order={3}>
            {t("quiz.questionTitleWithRestaurant", {
              restaurant: selectedRestaurant.name,
            })}
          </Title>
          <Text size="lg" fw={500}>
            {t("quiz.score")}:{" "}
            <span data-testid="current-score">{state.score}</span> /{" "}
            {state.totalQuestions}
          </Text>
        </Group>

        <QuizProgress
          currentQuestion={state.currentQuestionIndex + 1}
          totalQuestions={state.totalQuestions}
        />

        <Paper p="md" withBorder>
          <Stack gap="md">
            <Text size="xl" fw={500}>
              {currentQuestion.questionText}
            </Text>

            {currentQuestion.imageUrl && (
              <Center mb="md">
                <Image
                  src={currentQuestion.imageUrl}
                  alt="Question Image"
                  height={200}
                  width={300}
                  fallbackSrc="/api/placeholder/300/200"
                />
              </Center>
            )}

            <Text fw={500}>
              {isSingleChoice
                ? t("quiz.selectAnswer")
                : t("quiz.selectAnswers")}
            </Text>

            <Grid>
              {currentQuestion.options.map((option) => (
                <Grid.Col key={option.id} span={{ base: 12, md: 6 }}>
                  <AnswerOption
                    id={option.id}
                    text={option.text}
                    selected={selectedAnswers.includes(option.id)}
                    onSelect={toggleAnswerSelection}
                    isSingleChoice={isSingleChoice}
                  />
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Paper>

        <Group justify="center">
          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={selectedAnswers.length === 0}
            data-testid="submit-answer-button"
            rightSection={<IconArrowRight size={16} />}
          >
            {t("quiz.submitAnswer")}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}

export default QuizQuestionPage;
