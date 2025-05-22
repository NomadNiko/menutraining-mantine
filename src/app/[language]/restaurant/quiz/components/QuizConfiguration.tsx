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
} from "@mantine/core";
import { useState, useEffect } from "react";
import { useTranslation } from "@/services/i18n/client";
import { QuestionType } from "@/services/quiz/types";
import { useGetMenuSectionsService } from "@/services/api/services/menu-sections";
import { MenuSection } from "@/services/api/types/menu-section";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";

interface QuizConfigurationProps {
  onStartQuiz: (config: {
    questionCount: number;
    questionTypes: QuestionType[];
    menuSectionIds: string[];
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
  const [questionCount, setQuestionCount] = useState<string>("10");
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<
    QuestionType[]
  >(Object.values(QuestionType));
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
          limit: 100,
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

  // Handle question type toggle
  const handleQuestionTypeToggle = (type: QuestionType) => {
    setSelectedQuestionTypes((prev) => {
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
    onStartQuiz({
      questionCount: parseInt(questionCount),
      questionTypes: selectedQuestionTypes,
      menuSectionIds:
        selectedMenuSections.length === menuSections.length
          ? [] // Empty array means all sections
          : selectedMenuSections,
    });
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="lg">
        <Title order={5}>{t("quiz.configuration.title")}</Title>

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
            value={questionCount}
            onChange={setQuestionCount}
            fullWidth
          />
        </div>

        <Divider />

        {/* Question Types */}
        <div>
          <Text size="sm" fw={500} mb="xs">
            {t("quiz.configuration.questionTypes")}
          </Text>
          <Stack gap="xs">
            <Checkbox
              label={t("quiz.configuration.ingredientsInDish")}
              checked={selectedQuestionTypes.includes(
                QuestionType.INGREDIENTS_IN_DISH
              )}
              onChange={() =>
                handleQuestionTypeToggle(QuestionType.INGREDIENTS_IN_DISH)
              }
            />
            <Checkbox
              label={t("quiz.configuration.ingredientsWithAllergy")}
              checked={selectedQuestionTypes.includes(
                QuestionType.INGREDIENTS_WITH_ALLERGY
              )}
              onChange={() =>
                handleQuestionTypeToggle(QuestionType.INGREDIENTS_WITH_ALLERGY)
              }
            />
          </Stack>
        </div>

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
          disabled={
            isLoading ||
            selectedQuestionTypes.length === 0 ||
            selectedMenuSections.length === 0
          }
          loading={isLoading}
        >
          {t("quiz.startButton")}
        </Button>
      </Stack>
    </Paper>
  );
}
