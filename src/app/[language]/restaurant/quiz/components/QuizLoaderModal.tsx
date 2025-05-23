import {
  Modal,
  Text,
  Center,
  Stack,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";
import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./QuizLoaderModal.module.css";

interface QuizLoaderModalProps {
  opened: boolean;
  message?: string;
}

// Utility function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Available loader CSS classes
const LOADER_CLASSES = [
  styles.loader1,
  styles.loader2,
  styles.loader3,
  styles.loader4,
  styles.loader5,
];

export function QuizLoaderModal({ opened, message }: QuizLoaderModalProps) {
  const { t } = useTranslation("restaurant-quiz");
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  // Get the loading phrases from translations
  const loadingPhrases = t("quiz.loadingPhrases", {
    returnObjects: true,
  }) as string[];

  // State for current phrase and animation
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [selectedLoaderClass, setSelectedLoaderClass] = useState<string>("");

  // Memoize shuffled phrases to prevent re-shuffling on re-renders
  const shuffledPhrases = useMemo(() => {
    if (Array.isArray(loadingPhrases) && loadingPhrases.length > 0) {
      return shuffleArray(loadingPhrases);
    }
    return [t("quiz.preparingQuiz")]; // Fallback
  }, [loadingPhrases, t]);

  // Select random loader animation when component mounts or modal opens
  useEffect(() => {
    if (opened && !selectedLoaderClass) {
      const randomIndex = Math.floor(Math.random() * LOADER_CLASSES.length);
      setSelectedLoaderClass(LOADER_CLASSES[randomIndex]);
    }
  }, [opened, selectedLoaderClass]);

  // Reset states when modal is closed
  useEffect(() => {
    if (!opened) {
      setCurrentPhraseIndex(0);
      setSelectedLoaderClass("");
    }
  }, [opened]);

  // Cycle through phrases every 2.5 seconds
  useEffect(() => {
    if (!opened || shuffledPhrases.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPhraseIndex(
        (prevIndex) => (prevIndex + 1) % shuffledPhrases.length
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [opened, shuffledPhrases.length]);

  // Get current phrase to display
  const getCurrentPhrase = useCallback(() => {
    if (message) return message;
    if (shuffledPhrases.length === 0) return t("quiz.preparingQuiz");
    return shuffledPhrases[currentPhraseIndex] || t("quiz.preparingQuiz");
  }, [message, shuffledPhrases, currentPhraseIndex, t]);

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
          {/* Animated loader with randomly selected animation */}
          <div className={selectedLoaderClass} />

          {/* Dynamic loading message with fade transition */}
          <Text
            size="lg"
            fw={500}
            mt="xl"
            style={{
              transition: "opacity 0.3s ease-in-out",
              minHeight: "1.5rem", // Prevent layout shift
            }}
          >
            {getCurrentPhrase()}
          </Text>
        </Stack>
      </Center>
    </Modal>
  );
}
