// src/components/data-preload/DataPreloadModal.tsx
import {
  Modal,
  Text,
  useMantineTheme,
  useMantineColorScheme,
  Box,
} from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";
import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./DataPreloadModal.module.css";

interface DataPreloadModalProps {
  opened: boolean;
  message?: string;
  progress?: {
    loaded: number;
    total: number;
  };
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Using similar loader classes but with data-themed animations
const LOADER_CLASSES = [
  styles.dataLoader1, // Progress bar style
  styles.dataLoader2, // Circular progress
  styles.dataLoader3, // Dots loading
  styles.dataLoader4, // Data sync animation
  styles.dataLoader5, // Database icon animation
  styles.dataLoader6, // Server communication
];

export function DataPreloadModal({
  opened,
  message,
  progress,
}: DataPreloadModalProps) {
  const { t } = useTranslation("common");
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [selectedLoaderClass, setSelectedLoaderClass] = useState<string>("");

  const shuffledPhrases = useMemo(() => {
    // Loading phrases specific to data loading
    const loadingPhrases = [
      t("dataPreload.loadingRestaurantData"),
      t("dataPreload.fetchingIngredients"),
      t("dataPreload.loadingMenuItems"),
      t("dataPreload.preparingRecipes"),
      t("dataPreload.syncingAllergies"),
      t("dataPreload.organizingMenus"),
      t("dataPreload.optimizingPerformance"),
    ];
    return shuffleArray(loadingPhrases);
  }, [t]);

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
    if (!opened || message) return;

    const interval = setInterval(() => {
      setCurrentPhraseIndex(
        (prevIndex) => (prevIndex + 1) % shuffledPhrases.length
      );
    }, 2000); // Slightly longer interval for data loading messages

    return () => clearInterval(interval);
  }, [opened, shuffledPhrases.length, message]);

  const getCurrentPhrase = useCallback(() => {
    if (message) return message;
    return shuffledPhrases[currentPhraseIndex] || t("dataPreload.loadingData");
  }, [message, shuffledPhrases, currentPhraseIndex, t]);

  const getProgressText = useCallback(() => {
    if (!progress) return null;
    const percentage = Math.round((progress.loaded / progress.total) * 100);
    return `${percentage}%`;
  }, [progress]);

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      centered
      withCloseButton={false}
      overlayProps={{ opacity: 0.75, blur: 5 }}
      styles={{
        header: { display: "none" },
        body: { padding: 0 },
        content: {
          background: isDark ? theme.colors.dark[7] : theme.white,
          width: "400px",
          height: "250px",
          borderRadius: theme.radius.md,
          boxShadow: theme.shadows.xl,
        },
      }}
      size="400px"
      data-testid="data-preload-modal"
    >
      <Box
        style={{
          width: "400px",
          height: "250px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "20px",
        }}
      >
        {/* Logo or branding */}
        <Text
          size="lg"
          fw={700}
          mb="md"
          style={{
            color: theme.primaryColor,
            letterSpacing: "0.5px",
          }}
        >
          MenuTraining.com
        </Text>

        {/* Animation container */}
        <Box
          style={{
            width: "120px",
            height: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <div
            className={selectedLoaderClass}
            style={{
              transform: "scale(0.8)",
              transformOrigin: "center",
            }}
          />
        </Box>

        {/* Text container */}
        <Box
          style={{
            width: "320px",
            minHeight: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "8px",
          }}
        >
          <Text
            size="sm"
            fw={500}
            style={{
              transition: "opacity 0.3s ease-in-out",
              color: isDark ? theme.colors.gray[3] : theme.colors.gray[7],
            }}
            data-testid="data-preload-text"
          >
            {getCurrentPhrase()}
          </Text>

          {/* Progress indicator if available */}
          {progress && (
            <Text
              size="xs"
              fw={600}
              style={{
                color: theme.primaryColor,
              }}
              data-testid="data-preload-progress"
            >
              {getProgressText()}
            </Text>
          )}
        </Box>
      </Box>
    </Modal>
  );
}
