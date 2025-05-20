// src/app/[language]/restaurant/quiz/components/AnswerOption.tsx
import { Paper, Checkbox, Text, Group } from "@mantine/core";

interface AnswerOptionProps {
  id: string;
  text: string;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function AnswerOption({
  id,
  text,
  selected,
  onSelect,
}: AnswerOptionProps) {
  return (
    <Paper
      p="md"
      withBorder
      mb="md"
      className={selected ? "answer-option selected" : "answer-option"}
      style={{
        cursor: "pointer",
        backgroundColor: selected ? "var(--mantine-color-blue-0)" : undefined,
        borderColor: selected ? "var(--mantine-color-blue-6)" : undefined,
      }}
      onClick={() => onSelect(id)}
    >
      <Group justify="space-between" wrap="nowrap">
        <Text>{text}</Text>
        <Checkbox
          checked={selected}
          onChange={() => onSelect(id)}
          onClick={(e) => e.stopPropagation()}
          styles={{
            input: {
              cursor: "pointer",
            },
          }}
        />
      </Group>
    </Paper>
  );
}
