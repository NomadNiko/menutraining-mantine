// src/components/ingredients/ResultsInfo.tsx
"use client";
import { Box, Text, Badge, Group } from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";

interface ResultsInfoProps {
  totalCount: number;
  displayedCount: number;
  searchQuery?: string;
  selectedAllergies: string[];
  allergiesMap: Record<string, string>;
  hasSubIngredients: boolean | null;
  allergyExcludeMode: boolean;
  selectedCategories: string[];
  categoryExcludeMode: boolean;
  isLoading?: boolean;
}

export function ResultsInfo({
  totalCount,
  displayedCount,
  searchQuery,
  selectedAllergies,
  allergiesMap,
  hasSubIngredients,
  allergyExcludeMode,
  selectedCategories,
  categoryExcludeMode,
  isLoading = false,
}: ResultsInfoProps) {
  const { t } = useTranslation("admin-panel-ingredients");

  // Determine if any filters are active
  const hasFilters =
    !!searchQuery ||
    selectedAllergies.length > 0 ||
    hasSubIngredients !== null ||
    selectedCategories.length > 0;

  // Generate the results message
  let resultsMessage = "";
  if (isLoading) {
    resultsMessage = t("results.loading");
  } else if (totalCount === 0) {
    if (hasFilters) {
      resultsMessage = t("results.noMatchingIngredients");
    } else {
      resultsMessage = t("results.noIngredients");
    }
  } else {
    resultsMessage = t("results.showing", {
      displayed: displayedCount,
      total: totalCount,
    });

    if (hasFilters) {
      resultsMessage += ` ${t("results.filtered")}`;
    }
  }

  return (
    <Box py="md">
      <Text size="sm" mb={hasFilters ? "xs" : 0}>
        {resultsMessage}
      </Text>
      {hasFilters && (
        <Group mt="xs" gap="xs">
          {searchQuery && (
            <Badge size="sm" color="blue">
              {t("results.search")}: {searchQuery}
            </Badge>
          )}
          {selectedAllergies.map((allergyId) => (
            <Badge key={allergyId} size="sm" color="red">
              {allergyExcludeMode
                ? `${t("results.excludes")}: `
                : `${t("results.includes")}: `}
              {allergiesMap[allergyId] || allergyId}
            </Badge>
          ))}
          {selectedCategories.map((categoryKey) => (
            <Badge key={categoryKey} size="sm" color="green">
              {categoryExcludeMode
                ? `${t("results.excludes")}: `
                : `${t("results.includes")}: `}
              {t(`categories.${categoryKey}`)}
            </Badge>
          ))}
          {hasSubIngredients !== null && (
            <Badge size="sm" color="indigo">
              {hasSubIngredients
                ? t("results.hasSubIngredients")
                : t("results.noSubIngredients")}
            </Badge>
          )}
        </Group>
      )}
    </Box>
  );
}
