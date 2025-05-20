import {
  Modal,
  Text,
  Center,
  Stack,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";
import styles from "./QuizLoaderModal.module.css";

interface QuizLoaderModalProps {
  opened: boolean;
  message?: string;
}

export function QuizLoaderModal({ opened, message }: QuizLoaderModalProps) {
  const { t } = useTranslation("restaurant-quiz");
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Modal
      opened={opened}
      onClose={() => {}} // No close handler - will be controlled by parent
      centered
      withCloseButton={false}
      overlayProps={{ opacity: 0.55, blur: 3 }}
      styles={{
        header: { display: "none" }, // Hide the header
        body: { padding: "2rem" }, // Add some padding
        content: { background: isDark ? theme.colors.dark[7] : theme.white },
      }}
      size="auto"
    >
      <Center>
        <Stack align="center" gap="md">
          <div className={styles.loader} />
          <Text size="lg" fw={500} mt="xl">
            {message || t("quiz.preparingQuiz")}
          </Text>
        </Stack>
      </Center>
    </Modal>
  );
}
