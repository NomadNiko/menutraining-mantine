// src/app/[language]/restaurant/quiz/components/QuizLoaderModal.tsx
import {
  Modal,
  Text,
  useMantineTheme,
  useMantineColorScheme,
  Box,
} from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";
import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./QuizLoaderModal.module.css";

interface QuizLoaderModalProps {
  opened: boolean;
  message?: string;
  disableCycling?: boolean;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const LOADER_CLASSES = [
  styles.loader1,
  styles.loader2,
  styles.loader3,
  styles.loader4,
  styles.loader5,
  styles.loader6,
  styles.loader7,
  styles.loader8,
  styles.loader9,
  styles.loader10,
  styles.loader11,
  styles.loader12,
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

  const loadingPhrases = t("quiz.loadingPhrases", {
    returnObjects: true,
  }) as string[];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [selectedLoaderClass, setSelectedLoaderClass] = useState<string>("");

  const shuffledPhrases = useMemo(() => {
    if (Array.isArray(loadingPhrases) && loadingPhrases.length > 0) {
      return shuffleArray(loadingPhrases);
    }
    return [t("quiz.preparingQuiz")];
  }, [loadingPhrases, t]);

  useEffect(() => {
    if (opened && !selectedLoaderClass) {
      const randomIndex = Math.floor(Math.random() * LOADER_CLASSES.length);
      setSelectedLoaderClass(LOADER_CLASSES[randomIndex]);
    }
  }, [opened, selectedLoaderClass]);

  useEffect(() => {
    if (!opened) {
      setCurrentPhraseIndex(0);
      setSelectedLoaderClass("");
    }
  }, [opened]);

  useEffect(() => {
    if (!opened || shuffledPhrases.length <= 1 || disableCycling || message)
      return;

    const interval = setInterval(() => {
      setCurrentPhraseIndex(
        (prevIndex) => (prevIndex + 1) % shuffledPhrases.length
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [opened, shuffledPhrases.length, disableCycling, message]);

  const getCurrentPhrase = useCallback(() => {
    if (disableCycling && message) return message;
    if (!disableCycling && shuffledPhrases.length > 0) {
      return shuffledPhrases[currentPhraseIndex] || t("quiz.preparingQuiz");
    }
    return message || t("quiz.preparingQuiz");
  }, [message, shuffledPhrases, currentPhraseIndex, t, disableCycling]);

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      centered
      withCloseButton={false}
      overlayProps={{ opacity: 0.55, blur: 3 }}
      styles={{
        header: { display: "none" },
        body: { padding: 0 },
        content: {
          background: isDark ? theme.colors.dark[7] : theme.white,
          width: "320px",
          height: "200px",
        },
      }}
      size="320px"
    >
      <Box
        style={{
          width: "320px",
          height: "200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Fixed animation container */}
        <Box
          style={{
            width: "100px",
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <div
            className={selectedLoaderClass}
            style={{
              transform: "scale(0.7)",
              transformOrigin: "center",
            }}
          />
        </Box>

        {/* Fixed text container */}
        <Box
          style={{
            width: "280px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Text
            size="sm"
            fw={500}
            style={{
              transition: "opacity 0.3s ease-in-out",
            }}
          >
            {getCurrentPhrase()}
          </Text>
        </Box>
      </Box>
    </Modal>
  );
}
