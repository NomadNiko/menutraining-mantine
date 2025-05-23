// src/app/[language]/restaurant/quiz/components/QuizLoaderModal.tsx
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
  disableCycling?: boolean; // New prop to control cycling behavior
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

export function QuizLoaderModal({
  opened,
  message,
  disableCycling = false,
}: QuizLoaderModalProps) {
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

  // Cycle through phrases every 2.5 seconds (only if cycling is enabled)
  useEffect(() => {
    if (!opened || shuffledPhrases.length <= 1 || disableCycling || message)
      return;

    const interval = setInterval(() => {
      setCurrentPhraseIndex(
        (prevIndex) => (prevIndex + 1) % shuffledPhrases.length
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [opened, shuffledPhrases.length, disableCycling, message]);

  // Get current phrase to display
  const getCurrentPhrase = useCallback(() => {
    // Only use message if cycling is disabled or message is specifically provided
    if (disableCycling && message) return message;

    // Use cycling phrases if available and cycling is enabled
    if (!disableCycling && shuffledPhrases.length > 0) {
      return shuffledPhrases[currentPhraseIndex] || t("quiz.preparingQuiz");
    }

    // Fallback
    return message || t("quiz.preparingQuiz");
  }, [message, shuffledPhrases, currentPhraseIndex, t, disableCycling]);

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
