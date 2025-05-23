// src/app/[language]/restaurant/quiz/results/page-content.tsx
"use client";
import {
  Container,
  Title,
  Paper,
  Button,
  Stack,
  Text,
  Center,
  Group,
  Alert,
  Loader,
  SegmentedControl,
  Grid,
  Badge,
  Box,
} from "@mantine/core";
import { IconInfoCircle, IconHome, IconFilter } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useQuiz } from "../context/quiz-context";
import { QuizSummary } from "../components/QuizSummary";

type FilterType = "all" | "correct" | "incorrect";

function QuizResultsPage() {
  const { t } = useTranslation("restaurant-quiz");
  const router = useRouter();
  const { state } = useQuiz();
  const [filter, setFilter] = useState<FilterType>("all");

  // Process questions and create summary data
  const questionSummaries = useMemo(() => {
    return state.questions.map((question, index) => {
      const userAnswerIds = state.userAnswers[index] || [];
      const isCorrect =
        userAnswerIds.length === question.correctAnswerIds.length &&
        userAnswerIds.every((id) => question.correctAnswerIds.includes(id)) &&
        question.correctAnswerIds.every((id) => userAnswerIds.includes(id));

      // Find text representations of answers
      const correctAnswers = question.options
        .filter((option) => question.correctAnswerIds.includes(option.id))
        .map((option) => option.text);

      const userAnswers = question.options
        .filter((option) => userAnswerIds.includes(option.id))
        .map((option) => option.text);

      return {
        id: question.id,
        questionNumber: index + 1,
        text: question.questionText,
        correctAnswers,
        userAnswers,
        isCorrect,
        imageUrl: question.imageUrl,
      };
    });
  }, [state.questions, state.userAnswers]);

  // Filter questions based on selected filter
  const filteredQuestions = useMemo(() => {
    switch (filter) {
      case "correct":
        return questionSummaries.filter((q) => q.isCorrect);
      case "incorrect":
        return questionSummaries.filter((q) => !q.isCorrect);
      default:
        return questionSummaries;
    }
  }, [questionSummaries, filter]);

  // Calculate statistics
  const correctCount = questionSummaries.filter((q) => q.isCorrect).length;
  const incorrectCount = questionSummaries.length - correctCount;

  // If quiz is not completed, redirect back to quiz page
  if (!state.completed) {
    router.push("/restaurant/quiz");
    return (
      <Container size="md">
        <Center p="xl">
          <Loader size="sm" />
        </Center>
      </Container>
    );
  }

  // Handle errors
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
        <Center mt="xl">
          <Button
            onClick={() => router.push("/restaurant/quiz")}
            leftSection={<IconHome size={16} />}
          >
            {t("quiz.backToMenu")}
          </Button>
        </Center>
      </Container>
    );
  }

  // Calculate the success threshold
  const isSuccessful = state.score >= Math.ceil(state.totalQuestions * 0.7);

  return (
    <Container size="xl">
      <Stack gap="xl" my="xl">
        <Title order={2}>{t("quiz.resultsTitle")}</Title>

        {/* Score Summary */}
        <Paper p="lg" withBorder>
          <Stack gap="lg">
            <Group justify="center">
              <Stack align="center" gap="xs">
                <Title order={1} c={isSuccessful ? "green" : "red"}>
                  {state.score} / {state.totalQuestions}
                </Title>
                <Text size="xl" fw={500}>
                  {t("quiz.yourScore")}
                </Text>
                <Text ta="center">
                  {isSuccessful ? t("quiz.greatJob") : t("quiz.tryAgain")}
                </Text>
              </Stack>
            </Group>

            {/* Statistics */}
            <Group justify="center" gap="xl">
              <Group gap="xs">
                <Badge color="green" size="lg">
                  {correctCount} {t("quiz.correct")}
                </Badge>
              </Group>
              <Group gap="xs">
                <Badge color="red" size="lg">
                  {incorrectCount} {t("quiz.incorrect")}
                </Badge>
              </Group>
              <Group gap="xs">
                <Badge color="blue" size="lg">
                  {Math.round((state.score / state.totalQuestions) * 100)}%{" "}
                  {t("quiz.accuracy")}
                </Badge>
              </Group>
            </Group>
          </Stack>
        </Paper>

        {/* Filters */}
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center">
            <Group align="center" gap="md">
              <IconFilter size={20} />
              <Text fw={500}>{t("quiz.filterQuestions")}:</Text>
            </Group>
            <SegmentedControl
              data={[
                {
                  label: `${t("quiz.all")} (${questionSummaries.length})`,
                  value: "all",
                },
                {
                  label: `${t("quiz.correct")} (${correctCount})`,
                  value: "correct",
                },
                {
                  label: `${t("quiz.incorrect")} (${incorrectCount})`,
                  value: "incorrect",
                },
              ]}
              value={filter}
              onChange={(value) => setFilter(value as FilterType)}
            />
          </Group>
        </Paper>

        {/* Questions Summary */}
        <Box>
          <Group justify="space-between" align="center" mb="md">
            <Title order={4}>
              {filter === "all" && t("quiz.questionSummary")}
              {filter === "correct" && t("quiz.correctAnswers")}
              {filter === "incorrect" && t("quiz.incorrectAnswers")}
            </Title>
            <Text c="dimmed">
              {t("quiz.showingResults", {
                count: filteredQuestions.length,
                total: questionSummaries.length,
              })}
            </Text>
          </Group>

          {filteredQuestions.length === 0 ? (
            <Paper p="xl" withBorder>
              <Center>
                <Stack align="center" gap="md">
                  <Text size="lg" c="dimmed">
                    {filter === "correct" && t("quiz.noCorrectAnswers")}
                    {filter === "incorrect" && t("quiz.noIncorrectAnswers")}
                  </Text>
                  <Button variant="subtle" onClick={() => setFilter("all")}>
                    {t("quiz.showAllQuestions")}
                  </Button>
                </Stack>
              </Center>
            </Paper>
          ) : (
            <Grid gutter="md">
              {filteredQuestions.map((question) => (
                <Grid.Col key={question.id} span={{ base: 12, md: 6 }}>
                  <QuizSummary
                    question={question}
                    questionNumber={question.questionNumber}
                  />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Box>

        {/* Back Button */}
        <Center>
          <Button
            onClick={() => router.push("/restaurant/quiz")}
            size="lg"
            leftSection={<IconHome size={16} />}
            data-testid="back-to-menu-button"
          >
            {t("quiz.backToMenu")}
          </Button>
        </Center>
      </Stack>
    </Container>
  );
}

export default QuizResultsPage;
