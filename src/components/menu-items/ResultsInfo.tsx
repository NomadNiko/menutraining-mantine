// src/components/menu-items/ResultsInfo.tsx
"use client";
import { Box, Text, Badge, Group } from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";

interface ResultsInfoProps {
  totalCount: number;
  displayedCount: number;
  searchQuery?: string;
  selectedAllergies: string[];
  allergiesMap: Record<string, string>;
  selectedIngredients: string[];
  allergyExcludeMode: boolean;
  isLoading?: boolean;
}

export function ResultsInfo({
  totalCount,
  displayedCount,
  searchQuery,
  selectedAllergies,
  allergiesMap,
  selectedIngredients,
  allergyExcludeMode,
  isLoading = false,
}: ResultsInfoProps) {
  const { t } = useTranslation("admin-panel-menu-items");

  // Determine if any filters are active
  const hasFilters =
    !!searchQuery ||
    selectedAllergies.length > 0 ||
    selectedIngredients.length > 0;

  // Generate the results message
  let resultsMessage = "";
  if (isLoading) {
    resultsMessage = t("results.loading");
  } else if (totalCount === 0) {
    if (hasFilters) {
      resultsMessage = t("results.noMatchingMenuItems");
    } else {
      resultsMessage = t("results.noMenuItems");
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
          {selectedIngredients.map((ingredientId) => (
            <Badge key={ingredientId} size="sm" color="green">
              {t("results.ingredient")}: {ingredientId}
            </Badge>
          ))}
        </Group>
      )}
    </Box>
  );
}
