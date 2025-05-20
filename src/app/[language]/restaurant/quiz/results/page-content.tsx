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
  Divider,
  Alert,
  Loader,
} from "@mantine/core";
import { IconInfoCircle, IconHome } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import { useRouter } from "next/navigation";
import { useQuiz } from "../context/quiz-context";
import { QuizSummary } from "../components/QuizSummary";

function QuizResultsPage() {
  const { t } = useTranslation("restaurant-quiz");
  const router = useRouter();
  const { state } = useQuiz();

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
    <Container size="lg">
      <Stack gap="xl" my="xl">
        <Title order={2}>{t("quiz.resultsTitle")}</Title>

        <Paper p="md" withBorder>
          <Stack gap="lg">
            <Group justify="center">
              <Stack align="center" gap="xs">
                <Title order={1} c={isSuccessful ? "green" : "red"}>
                  {state.score} / {state.totalQuestions}
                </Title>
                <Text size="xl" fw={500}>
                  {t("quiz.yourScore")}
                </Text>
                <Text>
                  {isSuccessful ? t("quiz.greatJob") : t("quiz.tryAgain")}
                </Text>
              </Stack>
            </Group>

            <Divider my="md" />

            <Title order={4}>{t("quiz.questionSummary")}</Title>

            {state.questions.map((question, index) => {
              const userAnswerIds = state.userAnswers[index] || [];
              const isCorrect =
                userAnswerIds.length === question.correctAnswerIds.length &&
                userAnswerIds.every((id) =>
                  question.correctAnswerIds.includes(id)
                ) &&
                question.correctAnswerIds.every((id) =>
                  userAnswerIds.includes(id)
                );

              // Find text representations of answers
              const correctAnswers = question.options
                .filter((option) =>
                  question.correctAnswerIds.includes(option.id)
                )
                .map((option) => option.text);

              const userAnswers = question.options
                .filter((option) => userAnswerIds.includes(option.id))
                .map((option) => option.text);

              return (
                <QuizSummary
                  key={question.id}
                  question={{
                    id: question.id,
                    text: question.questionText,
                    correctAnswers,
                    userAnswers,
                    isCorrect,
                  }}
                  questionNumber={index + 1}
                />
              );
            })}
          </Stack>
        </Paper>

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
