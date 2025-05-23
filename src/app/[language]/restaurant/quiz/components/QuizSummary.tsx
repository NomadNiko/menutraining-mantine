// src/app/[language]/restaurant/quiz/components/QuizSummary.tsx
import {
  Paper,
  Text,
  Group,
  Stack,
  Badge,
  ThemeIcon,
  Image,
  Center,
  Box,
  Flex,
} from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";

interface QuestionSummary {
  id: string;
  text: string;
  correctAnswers: string[];
  userAnswers: string[];
  isCorrect: boolean;
  imageUrl?: string | null;
}

interface QuizSummaryProps {
  question: QuestionSummary;
  questionNumber: number;
}

export function QuizSummary({ question, questionNumber }: QuizSummaryProps) {
  const { t } = useTranslation("restaurant-quiz");

  return (
    <Paper
      p="md"
      withBorder
      h="100%"
      style={{
        borderColor: question.isCorrect
          ? "var(--mantine-color-green-6)"
          : "var(--mantine-color-red-6)",
        borderWidth: "2px",
      }}
    >
      <Stack gap="md" h="100%">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              #{questionNumber}
            </Text>
            <ThemeIcon
              variant="light"
              color={question.isCorrect ? "green" : "red"}
              size="sm"
              radius="xl"
            >
              {question.isCorrect ? (
                <IconCheck size={14} />
              ) : (
                <IconX size={14} />
              )}
            </ThemeIcon>
          </Group>
          <Badge
            color={question.isCorrect ? "green" : "red"}
            variant="light"
            size="sm"
          >
            {question.isCorrect ? t("quiz.correct") : t("quiz.incorrect")}
          </Badge>
        </Group>

        {/* Question Text */}
        <Text size="sm" fw={500} lineClamp={3}>
          {question.text}
        </Text>

        {/* Question Image */}
        {question.imageUrl && (
          <Center>
            <Image
              src={question.imageUrl}
              alt="Question Image"
              height={100}
              width={150}
              fit="cover"
              radius="sm"
              fallbackSrc="/api/placeholder/150/100"
            />
          </Center>
        )}

        {/* Spacer to push answers to bottom */}
        <Box style={{ flex: 1 }} />

        {/* Answers Section */}
        <Stack gap="xs">
          {/* Correct Answers */}
          <Box>
            <Text size="xs" fw={600} c="green" mb="xs">
              {t("quiz.correctAnswers")}:
            </Text>
            <Flex gap="xs" wrap="wrap">
              {question.correctAnswers.map((answer, index) => (
                <Badge
                  key={index}
                  color="green"
                  variant="light"
                  size="sm"
                  style={{ maxWidth: "100%" }}
                >
                  <Text size="xs" lineClamp={1}>
                    {answer}
                  </Text>
                </Badge>
              ))}
            </Flex>
          </Box>

          {/* User Answers */}
          <Box>
            <Text size="xs" fw={600} c="blue" mb="xs">
              {t("quiz.yourAnswers")}:
            </Text>
            {question.userAnswers.length === 0 ? (
              <Badge color="gray" variant="light" size="sm">
                <Text size="xs">{t("quiz.noAnswerSelected")}</Text>
              </Badge>
            ) : (
              <Flex gap="xs" wrap="wrap">
                {question.userAnswers.map((answer, index) => {
                  const isCorrectAnswer =
                    question.correctAnswers.includes(answer);
                  return (
                    <Badge
                      key={index}
                      color={isCorrectAnswer ? "green" : "red"}
                      variant="light"
                      size="sm"
                      style={{ maxWidth: "100%" }}
                    >
                      <Text size="xs" lineClamp={1}>
                        {answer}
                      </Text>
                    </Badge>
                  );
                })}
              </Flex>
            )}
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
