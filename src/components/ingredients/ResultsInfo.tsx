"use client";
import { Box, Text, Badge, Group } from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";

interface ResultsInfoProps {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchQuery?: string;
  selectedAllergies: string[];
  allergiesMap: Record<string, string>;
  hasSubIngredients: boolean | null;
  allergyExcludeMode: boolean;
  isLoading?: boolean;
}

export function ResultsInfo({
  totalCount,
  currentPage,
  pageSize,
  searchQuery,
  selectedAllergies,
  allergiesMap,
  hasSubIngredients,
  allergyExcludeMode,
  isLoading = false,
}: ResultsInfoProps) {
  const { t } = useTranslation("admin-panel-ingredients");

  // Calculate range of items being displayed
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Determine if any filters are active
  const hasFilters =
    !!searchQuery || selectedAllergies.length > 0 || hasSubIngredients !== null;

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
      start: startItem,
      end: endItem,
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

          {hasSubIngredients !== null && (
            <Badge size="sm" color="green">
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
