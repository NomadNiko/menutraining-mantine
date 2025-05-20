// src/app/[language]/restaurant/quiz/components/HighScoreBoard.tsx
import { Table, Text, Center, Paper, Title } from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";

interface HighScoreBoardProps {
  restaurantId: string;
}

export function HighScoreBoard({ restaurantId }: HighScoreBoardProps) {
  const { t } = useTranslation("restaurant-quiz");

  // Placeholder data - will be replaced with actual high scores
  const highScores = [
    { name: "John", score: 10, date: "2025-05-15" },
    { name: "Sarah", score: 9, date: "2025-05-14" },
    { name: "Mike", score: 8, date: "2025-05-13" },
  ];

  if (highScores.length === 0) {
    return (
      <Center>
        <Text c="dimmed">{t("quiz.noHighScores")}</Text>
      </Center>
    );
  }

  return (
    <Paper withBorder>
      <Title order={6} p="xs">
        Restaurant ID: {restaurantId}
      </Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("quiz.rank")}</Table.Th>
            <Table.Th>{t("quiz.player")}</Table.Th>
            <Table.Th>{t("quiz.score")}</Table.Th>
            <Table.Th>{t("quiz.date")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {highScores.map((score, index) => (
            <Table.Tr key={index}>
              <Table.Td>{index + 1}</Table.Td>
              <Table.Td>{score.name}</Table.Td>
              <Table.Td>{score.score}</Table.Td>
              <Table.Td>{score.date}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
