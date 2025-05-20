// src/app/[language]/restaurant/quiz/components/QuizProgress.tsx
import { Progress, Text, Group } from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
}: QuizProgressProps) {
  const { t } = useTranslation("restaurant-quiz");
  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <div>
      <Group justify="space-between" mb="xs">
        <Text>
          {t("quiz.questionCount", {
            current: currentQuestion,
            total: totalQuestions,
          })}
        </Text>
        <Text>{Math.round(progressPercentage)}%</Text>
      </Group>
      <Progress value={progressPercentage} />
    </div>
  );
}
