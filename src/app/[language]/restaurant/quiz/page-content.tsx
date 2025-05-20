"use client";
import {
  Container,
  Title,
  Paper,
  Button,
  Stack,
  Text,
  Center,
  Alert,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HighScoreBoard } from "./components/HighScoreBoard";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useQuiz } from "./context/quiz-context";
import { QuizLoaderModal } from "./components/QuizLoaderModal";

function QuizLandingPage() {
  const { t } = useTranslation("restaurant-quiz");
  const router = useRouter();
  const { selectedRestaurant } = useSelectedRestaurant();
  const { state, startQuiz, resetQuiz } = useQuiz();
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  // Reset quiz when landing on this page
  useEffect(() => {
    // Only reset if not in progress or completed
    if (!state.inProgress && !state.completed) {
      resetQuiz();
    }
  }, [resetQuiz, state.inProgress, state.completed]);

  const handleStartQuiz = async () => {
    setShowLoadingModal(true);
    const success = await startQuiz();

    // Only navigate if quiz was started successfully
    if (success) {
      router.push("/restaurant/quiz/question");
    } else {
      setShowLoadingModal(false);
    }
  };

  // If a quiz is already in progress, offer to continue
  const handleContinueQuiz = () => {
    router.push(
      state.completed ? "/restaurant/quiz/results" : "/restaurant/quiz/question"
    );
  };

  return (
    <Container size="md">
      <Stack gap="xl" my="xl">
        <Title order={2}>{t("quiz.welcomeTitle")}</Title>
        {!selectedRestaurant ? (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title={t("quiz.noRestaurantSelected")}
            color="blue"
          >
            {t("quiz.pleaseSelectRestaurant")}
          </Alert>
        ) : (
          <>
            <Paper p="md" withBorder>
              <Stack gap="lg">
                {state.error && (
                  <Alert
                    icon={<IconInfoCircle size={16} />}
                    title={t("quiz.error")}
                    color="red"
                  >
                    {state.error}
                  </Alert>
                )}
                <Text size="lg">{t("quiz.description")}</Text>
                <Text>{t("quiz.instructions")}</Text>
                <Center>
                  {state.inProgress || state.completed ? (
                    <Stack gap="md">
                      <Button
                        onClick={handleContinueQuiz}
                        size="lg"
                        color="green"
                        data-testid="continue-quiz-button"
                      >
                        {state.completed
                          ? t("quiz.viewResults")
                          : t("quiz.continueQuiz")}
                      </Button>
                      <Button
                        onClick={resetQuiz}
                        variant="outline"
                        color="red"
                        data-testid="reset-quiz-button"
                      >
                        {t("quiz.startNewQuiz")}
                      </Button>
                    </Stack>
                  ) : (
                    <Button
                      onClick={handleStartQuiz}
                      size="lg"
                      color="blue"
                      data-testid="start-quiz-button"
                      disabled={state.loading}
                    >
                      {t("quiz.startButton")}
                    </Button>
                  )}
                </Center>
              </Stack>
            </Paper>
            <Paper p="md" withBorder>
              <Stack gap="md">
                <Title order={4}>{t("quiz.highScores")}</Title>
                <HighScoreBoard
                  restaurantId={selectedRestaurant.restaurantId}
                />
              </Stack>
            </Paper>
          </>
        )}
      </Stack>

      {/* Custom loading modal with animation */}
      <QuizLoaderModal
        opened={showLoadingModal || state.loading}
        message={t("quiz.preparingQuiz")}
      />
    </Container>
  );
}

export default QuizLandingPage;
