// src/components/ingredients/FilterPanel.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Paper,
  Group,
  Text,
  Button,
  Stack,
  Collapse,
  Box,
  SegmentedControl,
  Select,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconFilter,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import { AllergyCheckboxGroup } from "./AllergyCheckboxGroup";
import { CategoryCheckboxGroup } from "./CategoryCheckboxGroup";

interface FilterPanelProps {
  allergies: Record<string, string>;
  selectedAllergies: string[];
  hasSubIngredients: boolean | null;
  allergyExcludeMode: boolean;
  selectedCategories: string[];
  categoryExcludeMode: boolean;
  onFilterChange: (
    allergies: string[],
    hasSubIngredients: boolean | null,
    allergyExcludeMode: boolean,
    categories: string[],
    categoryExcludeMode: boolean
  ) => void;
  onFilterReset: () => void;
  disabled?: boolean;
}

export function FilterPanel({
  selectedAllergies,
  hasSubIngredients,
  allergyExcludeMode,
  selectedCategories,
  categoryExcludeMode,
  onFilterChange,
  onFilterReset,
  disabled = false,
}: FilterPanelProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  const [opened, { toggle }] = useDisclosure(false);

  // Local state for filter values (before applying)
  const [localSelectedAllergies, setLocalSelectedAllergies] =
    useState<string[]>(selectedAllergies);
  const [localHasSubIngredients, setLocalHasSubIngredients] = useState<
    boolean | null
  >(hasSubIngredients);
  const [localAllergyExcludeMode, setLocalAllergyExcludeMode] =
    useState<boolean>(allergyExcludeMode);
  const [localSelectedCategories, setLocalSelectedCategories] =
    useState<string[]>(selectedCategories);
  const [localCategoryExcludeMode, setLocalCategoryExcludeMode] =
    useState<boolean>(categoryExcludeMode);

  // Update local state when props change
  useEffect(() => {
    setLocalSelectedAllergies(selectedAllergies);
    setLocalHasSubIngredients(hasSubIngredients);
    setLocalAllergyExcludeMode(allergyExcludeMode);
    setLocalSelectedCategories(selectedCategories);
    setLocalCategoryExcludeMode(categoryExcludeMode);
  }, [
    selectedAllergies,
    hasSubIngredients,
    allergyExcludeMode,
    selectedCategories,
    categoryExcludeMode,
  ]);

  // Check if any filters are applied
  const hasActiveFilters =
    selectedAllergies.length > 0 ||
    hasSubIngredients !== null ||
    selectedCategories.length > 0;

  // Calculate active filters count safely
  const calculateActiveFiltersCount = (): number => {
    let count = 0;
    if (selectedAllergies.length > 0) count += 1;
    if (hasSubIngredients !== null) count += 1;
    if (selectedCategories.length > 0) count += 1;
    return count;
  };

  const activeFiltersCount = calculateActiveFiltersCount();

  // Handle subIngredient type change
  const handleSubIngredientTypeChange = (value: string | null) => {
    if (!value) return;

    switch (value) {
      case "raw":
        setLocalHasSubIngredients(false);
        break;
      case "compound":
        setLocalHasSubIngredients(true);
        break;
      default:
        setLocalHasSubIngredients(null);
    }
  };

  // Get current subIngredient type value for select
  const getSubIngredientTypeValue = (): string => {
    if (localHasSubIngredients === true) return "compound";
    if (localHasSubIngredients === false) return "raw";
    return "all";
  };

  // Apply current filters
  const handleApplyFilters = () => {
    onFilterChange(
      localSelectedAllergies,
      localHasSubIngredients,
      localAllergyExcludeMode,
      localSelectedCategories,
      localCategoryExcludeMode
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setLocalSelectedAllergies([]);
    setLocalHasSubIngredients(null);
    setLocalAllergyExcludeMode(true);
    setLocalSelectedCategories([]);
    setLocalCategoryExcludeMode(true);
    onFilterReset();
  };

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb={opened ? "md" : 0}>
        <Group>
          <IconFilter size={18} />
          <Text fw={500}>{t("filters.title")}</Text>
          {hasActiveFilters && (
            <Text size="sm" c="dimmed">
              {t("filters.active", {
                count: activeFiltersCount,
              })}
            </Text>
          )}
        </Group>
        <Button
          variant="subtle"
          onClick={toggle}
          rightSection={
            opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />
          }
          size="compact-sm"
          data-testid="filter-toggle-button"
        >
          {opened ? t("filters.hide") : t("filters.show")}
        </Button>
      </Group>
      <Collapse in={opened}>
        <Stack gap="md">
          {/* Allergy filters - checkbox group */}
          <Box>
            <AllergyCheckboxGroup
              selectedAllergies={localSelectedAllergies}
              onChange={setLocalSelectedAllergies}
              disabled={disabled}
            />
            <Box mt="xs">
              <Text size="sm" mb="xs">
                {t("filters.allergyMode.label")}
              </Text>
              <SegmentedControl
                data={[
                  { value: "exclude", label: t("filters.allergyMode.exclude") },
                  { value: "include", label: t("filters.allergyMode.include") },
                ]}
                value={localAllergyExcludeMode ? "exclude" : "include"}
                onChange={(value) =>
                  setLocalAllergyExcludeMode(value === "exclude")
                }
                disabled={disabled || localSelectedAllergies.length === 0}
                data-testid="allergy-mode-selector"
              />
              <Text size="xs" c="dimmed" mt="xs">
                {localAllergyExcludeMode
                  ? t("filters.allergyMode.excludeHint")
                  : t("filters.allergyMode.includeHint")}
              </Text>
            </Box>
          </Box>

          {/* Category filters - checkbox group */}
          <Box>
            <CategoryCheckboxGroup
              selectedCategories={localSelectedCategories}
              onChange={setLocalSelectedCategories}
              disabled={disabled}
            />
            <Box mt="xs">
              <Text size="sm" mb="xs">
                {t("filters.categoryMode.label")}
              </Text>
              <SegmentedControl
                data={[
                  {
                    value: "exclude",
                    label: t("filters.categoryMode.exclude"),
                  },
                  {
                    value: "include",
                    label: t("filters.categoryMode.include"),
                  },
                ]}
                value={localCategoryExcludeMode ? "exclude" : "include"}
                onChange={(value) =>
                  setLocalCategoryExcludeMode(value === "exclude")
                }
                disabled={disabled || localSelectedCategories.length === 0}
                data-testid="category-mode-selector"
              />
              <Text size="xs" c="dimmed" mt="xs">
                {localCategoryExcludeMode
                  ? t("filters.categoryMode.excludeHint")
                  : t("filters.categoryMode.includeHint")}
              </Text>
            </Box>
          </Box>

          {/* Sub-ingredients dropdown selector */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {t("filters.hasSubIngredients.label")}
            </Text>
            <Select
              data={[
                { value: "all", label: t("filters.subIngredientsType.all") },
                { value: "raw", label: t("filters.subIngredientsType.raw") },
                {
                  value: "compound",
                  label: t("filters.subIngredientsType.compound"),
                },
              ]}
              value={getSubIngredientTypeValue()}
              onChange={handleSubIngredientTypeChange}
              disabled={disabled}
              width="sm"
              data-testid="sub-ingredients-selector"
            />
            <Text size="xs" c="dimmed" mt="xs">
              {t("filters.subIngredientsType.hint")}
            </Text>
          </Box>

          <Group>
            <Button
              onClick={handleApplyFilters}
              disabled={disabled}
              size="compact-sm"
              data-testid="apply-filters-button"
            >
              {t("filters.apply")}
            </Button>
            <Button
              variant="outline"
              onClick={handleResetFilters}
              disabled={
                disabled ||
                (!hasActiveFilters &&
                  localSelectedAllergies.length === 0 &&
                  localSelectedCategories.length === 0 &&
                  localHasSubIngredients === null)
              }
              size="compact-sm"
              data-testid="reset-filters-button"
            >
              {t("filters.reset")}
            </Button>
          </Group>
        </Stack>
      </Collapse>
    </Paper>
  );
}
