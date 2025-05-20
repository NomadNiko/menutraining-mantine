// src/app/[language]/restaurant/quiz/components/QuizSummary.tsx
import { Paper, Text, Group, Stack, Badge, ThemeIcon } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";

interface QuestionSummary {
  id: string;
  text: string;
  correctAnswers: string[];
  userAnswers: string[];
  isCorrect: boolean;
}

interface QuizSummaryProps {
  question: QuestionSummary;
  questionNumber: number;
}

export function QuizSummary({ question, questionNumber }: QuizSummaryProps) {
  const { t } = useTranslation("restaurant-quiz");

  return (
    <Paper p="md" withBorder mb="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <Text fw={500}>
              {t("quiz.questionNumber", { number: questionNumber })}
            </Text>
            <ThemeIcon
              variant="light"
              color={question.isCorrect ? "green" : "red"}
              size="md"
              radius="xl"
            >
              {question.isCorrect ? (
                <IconCheck size={16} />
              ) : (
                <IconX size={16} />
              )}
            </ThemeIcon>
          </Group>
        </Group>

        <Text>{question.text}</Text>

        <Stack gap="xs">
          <Text fw={500}>{t("quiz.correctAnswers")}:</Text>
          <Group>
            {question.correctAnswers.map((answer, index) => (
              <Badge key={index} color="green">
                {answer}
              </Badge>
            ))}
          </Group>
        </Stack>

        <Stack gap="xs">
          <Text fw={500}>{t("quiz.yourAnswers")}:</Text>
          <Group>
            {question.userAnswers.map((answer, index) => (
              <Badge
                key={index}
                color={
                  question.correctAnswers.includes(answer) ? "green" : "red"
                }
              >
                {answer}
              </Badge>
            ))}
          </Group>
        </Stack>
      </Stack>
    </Paper>
  );
}
