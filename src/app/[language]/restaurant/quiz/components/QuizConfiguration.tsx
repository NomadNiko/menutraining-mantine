// src/app/[language]/restaurant/quiz/components/QuizConfiguration.tsx
"use client";

import {
  Paper,
  Stack,
  Title,
  SegmentedControl,
  Checkbox,
  Group,
  Text,
  Button,
  Divider,
  Loader,
  Center,
  Box,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { useTranslation } from "@/services/i18n/client";
import {
  QuestionType,
  Difficulty,
  QuizMode,
  QUIZ_MODE_SETTINGS,
} from "@/services/quiz/types";
import { useGetMenuSectionsService } from "@/services/api/services/menu-sections";
import { MenuSection } from "@/services/api/types/menu-section";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";

interface QuizConfigurationProps {
  onStartQuiz: (config: {
    mode: QuizMode;
    questionCount: number;
    questionTypes: QuestionType[];
    menuSectionIds: string[];
    difficulty: Difficulty;
  }) => void;
  isLoading?: boolean;
}

export function QuizConfiguration({
  onStartQuiz,
  isLoading = false,
}: QuizConfigurationProps) {
  const { t } = useTranslation("restaurant-quiz");
  const { selectedRestaurant } = useSelectedRestaurant();
  const getMenuSectionsService = useGetMenuSectionsService();

  // Configuration state
  const [selectedMode, setSelectedMode] = useState<QuizMode>(QuizMode.MEDIUM);

  // Custom mode specific state
  const [customQuestionCount, setCustomQuestionCount] = useState<string>("10");
  const [customDifficulty, setCustomDifficulty] = useState<Difficulty>(
    Difficulty.MEDIUM
  );
  const [customQuestionTypes, setCustomQuestionTypes] = useState<
    QuestionType[]
  >(Object.values(QuestionType));

  // Shared state
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [selectedMenuSections, setSelectedMenuSections] = useState<string[]>(
    []
  );
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Load menu sections
  useEffect(() => {
    if (!selectedRestaurant) return;

    const loadMenuSections = async () => {
      setSectionsLoading(true);
      try {
        const { status, data } = await getMenuSectionsService(undefined, {
          restaurantId: selectedRestaurant.restaurantId,
          limit: 300,
        });

        if (status === HTTP_CODES_ENUM.OK) {
          const sectionsData = Array.isArray(data) ? data : data?.data || [];
          setMenuSections(sectionsData);
          // Default to all sections selected
          setSelectedMenuSections(sectionsData.map((s) => s.id));
        }
      } catch (error) {
        console.error("Error loading menu sections:", error);
      } finally {
        setSectionsLoading(false);
      }
    };

    loadMenuSections();
  }, [selectedRestaurant, getMenuSectionsService]);

  // Get current configuration based on mode
  const getCurrentConfiguration = () => {
    if (selectedMode === QuizMode.CUSTOM) {
      return {
        mode: selectedMode,
        questionCount: parseInt(customQuestionCount),
        questionTypes: customQuestionTypes,
        difficulty: customDifficulty,
        menuSectionIds:
          selectedMenuSections.length === menuSections.length
            ? [] // Empty array means all sections
            : selectedMenuSections,
      };
    } else {
      const modeSettings = QUIZ_MODE_SETTINGS[selectedMode];
      return {
        mode: selectedMode,
        questionCount: modeSettings.questionCount,
        questionTypes: modeSettings.questionTypes,
        difficulty: modeSettings.difficulty,
        menuSectionIds:
          selectedMenuSections.length === menuSections.length
            ? [] // Empty array means all sections
            : selectedMenuSections,
      };
    }
  };

  // Handle question type toggle (custom mode only)
  const handleQuestionTypeToggle = (type: QuestionType) => {
    setCustomQuestionTypes((prev) => {
      if (prev.includes(type)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Handle menu section toggle
  const handleMenuSectionToggle = (sectionId: string) => {
    setSelectedMenuSections((prev) => {
      if (prev.includes(sectionId)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  // Handle select all sections
  const handleSelectAllSections = () => {
    if (selectedMenuSections.length === menuSections.length) {
      // If all are selected, deselect all except the first one
      setSelectedMenuSections([menuSections[0].id]);
    } else {
      // Select all
      setSelectedMenuSections(menuSections.map((s) => s.id));
    }
  };

  const handleStartQuiz = () => {
    onStartQuiz(getCurrentConfiguration());
  };

  const getModeDescription = (mode: QuizMode) => {
    switch (mode) {
      case QuizMode.EASY:
        return t("quiz.configuration.easyModeDescription");
      case QuizMode.MEDIUM:
        return t("quiz.configuration.mediumModeDescription");
      case QuizMode.HARD:
        return t("quiz.configuration.hardModeDescription");
      case QuizMode.CUSTOM:
        return t("quiz.configuration.customModeDescription");
      default:
        return "";
    }
  };

  const isStartDisabled = () => {
    if (selectedMenuSections.length === 0) return true;
    if (selectedMode === QuizMode.CUSTOM) {
      return customQuestionTypes.length === 0;
    }
    return false;
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="lg">
        <Title order={5}>{t("quiz.configuration.title")}</Title>

        {/* Quiz Mode Selection */}
        <div>
          <Text size="sm" fw={500} mb="xs">
            {t("quiz.configuration.mode")}
          </Text>
          <SegmentedControl
            data={[
              { label: t("quiz.configuration.easy"), value: QuizMode.EASY },
              { label: t("quiz.configuration.medium"), value: QuizMode.MEDIUM },
              { label: t("quiz.configuration.hard"), value: QuizMode.HARD },
              { label: t("quiz.configuration.custom"), value: QuizMode.CUSTOM },
            ]}
            value={selectedMode}
            onChange={(value) => setSelectedMode(value as QuizMode)}
            fullWidth
          />
          <Text size="xs" c="dimmed" mt="xs">
            {getModeDescription(selectedMode)}
          </Text>
        </div>

        {selectedMode !== QuizMode.CUSTOM && (
          <Box>
            <Text size="sm" c="dimmed">
              {t("quiz.configuration.modeSettings", {
                questions: QUIZ_MODE_SETTINGS[selectedMode].questionCount,
                choices:
                  selectedMode === QuizMode.EASY
                    ? 2
                    : selectedMode === QuizMode.MEDIUM
                      ? 4
                      : 6,
              })}
            </Text>
          </Box>
        )}

        {/* Custom Mode Settings */}
        {selectedMode === QuizMode.CUSTOM && (
          <>
            <Divider />

            {/* Number of Questions */}
            <div>
              <Text size="sm" fw={500} mb="xs">
                {t("quiz.configuration.numberOfQuestions")}
              </Text>
              <SegmentedControl
                data={[
                  { label: "5", value: "5" },
                  { label: "10", value: "10" },
                  { label: "20", value: "20" },
                ]}
                value={customQuestionCount}
                onChange={setCustomQuestionCount}
                fullWidth
              />
            </div>

            {/* Difficulty Setting */}
            <div>
              <Text size="sm" fw={500} mb="xs">
                {t("quiz.configuration.difficulty")}
              </Text>
              <SegmentedControl
                data={[
                  {
                    label: t("quiz.configuration.easy"),
                    value: Difficulty.EASY,
                  },
                  {
                    label: t("quiz.configuration.medium"),
                    value: Difficulty.MEDIUM,
                  },
                  {
                    label: t("quiz.configuration.hard"),
                    value: Difficulty.HARD,
                  },
                ]}
                value={customDifficulty}
                onChange={(value) => setCustomDifficulty(value as Difficulty)}
                fullWidth
              />
              <Text size="xs" c="dimmed" mt="xs">
                {customDifficulty === Difficulty.EASY &&
                  t("quiz.configuration.easyDescription")}
                {customDifficulty === Difficulty.MEDIUM &&
                  t("quiz.configuration.mediumDescription")}
                {customDifficulty === Difficulty.HARD &&
                  t("quiz.configuration.hardDescription")}
              </Text>
            </div>

            {/* Question Types */}
            <div>
              <Text size="sm" fw={500} mb="xs">
                {t("quiz.configuration.questionTypes")}
              </Text>
              <Stack gap="xs">
                <Checkbox
                  label={t("quiz.configuration.ingredientsInDish")}
                  checked={customQuestionTypes.includes(
                    QuestionType.INGREDIENTS_IN_DISH
                  )}
                  onChange={() =>
                    handleQuestionTypeToggle(QuestionType.INGREDIENTS_IN_DISH)
                  }
                />
                <Checkbox
                  label={t("quiz.configuration.ingredientsWithAllergy")}
                  checked={customQuestionTypes.includes(
                    QuestionType.INGREDIENTS_WITH_ALLERGY
                  )}
                  onChange={() =>
                    handleQuestionTypeToggle(
                      QuestionType.INGREDIENTS_WITH_ALLERGY
                    )
                  }
                />
                <Checkbox
                  label={t("quiz.configuration.menuItemContainsIngredient")}
                  checked={customQuestionTypes.includes(
                    QuestionType.MENU_ITEM_CONTAINS_INGREDIENT
                  )}
                  onChange={() =>
                    handleQuestionTypeToggle(
                      QuestionType.MENU_ITEM_CONTAINS_INGREDIENT
                    )
                  }
                />
                <Checkbox
                  label={t("quiz.configuration.ingredientContainsAllergy")}
                  checked={customQuestionTypes.includes(
                    QuestionType.INGREDIENT_CONTAINS_ALLERGY
                  )}
                  onChange={() =>
                    handleQuestionTypeToggle(
                      QuestionType.INGREDIENT_CONTAINS_ALLERGY
                    )
                  }
                />
                <Checkbox
                  label={t("quiz.configuration.menuItemContainsAllergy")}
                  checked={customQuestionTypes.includes(
                    QuestionType.MENU_ITEM_CONTAINS_ALLERGY
                  )}
                  onChange={() =>
                    handleQuestionTypeToggle(
                      QuestionType.MENU_ITEM_CONTAINS_ALLERGY
                    )
                  }
                />
              </Stack>
            </div>
          </>
        )}

        <Divider />

        {/* Menu Sections */}
        <div>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              {t("quiz.configuration.menuSections")}
            </Text>
            {menuSections.length > 0 && (
              <Button
                variant="subtle"
                size="xs"
                onClick={handleSelectAllSections}
              >
                {selectedMenuSections.length === menuSections.length
                  ? t("quiz.configuration.deselectAll")
                  : t("quiz.configuration.selectAll")}
              </Button>
            )}
          </Group>
          {sectionsLoading ? (
            <Center p="md">
              <Loader size="sm" />
            </Center>
          ) : menuSections.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t("quiz.configuration.noMenuSections")}
            </Text>
          ) : (
            <Stack gap="xs">
              {menuSections.map((section) => (
                <Checkbox
                  key={section.id}
                  label={section.title}
                  checked={selectedMenuSections.includes(section.id)}
                  onChange={() => handleMenuSectionToggle(section.id)}
                />
              ))}
            </Stack>
          )}
        </div>

        <Button
          onClick={handleStartQuiz}
          fullWidth
          size="lg"
          disabled={isLoading || isStartDisabled()}
          loading={isLoading}
        >
          {t("quiz.startButton")}
        </Button>
      </Stack>
    </Paper>
  );
}
