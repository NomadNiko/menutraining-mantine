// src/components/menu-items/FilterPanel.tsx
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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconFilter,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import { AllergyCheckboxGroup } from "../ingredients/AllergyCheckboxGroup";

interface FilterPanelProps {
  allergies: Record<string, string>;
  selectedAllergies: string[];
  selectedIngredients: string[];
  allergyExcludeMode: boolean;
  onFilterChange: (
    allergies: string[],
    ingredients: string[],
    allergyExcludeMode: boolean
  ) => void;
  onFilterReset: () => void;
  disabled?: boolean;
}

export function FilterPanel({
  selectedAllergies,
  selectedIngredients,
  allergyExcludeMode,
  onFilterChange,
  onFilterReset,
  disabled = false,
}: FilterPanelProps) {
  const { t } = useTranslation("admin-panel-menu-items");
  const [opened, { toggle }] = useDisclosure(false);

  // Local state for filter values (before applying)
  const [localSelectedAllergies, setLocalSelectedAllergies] =
    useState<string[]>(selectedAllergies);
  const [localSelectedIngredients, setLocalSelectedIngredients] =
    useState<string[]>(selectedIngredients);
  const [localAllergyExcludeMode, setLocalAllergyExcludeMode] =
    useState<boolean>(allergyExcludeMode);

  // Update local state when props change
  useEffect(() => {
    setLocalSelectedAllergies(selectedAllergies);
    setLocalSelectedIngredients(selectedIngredients);
    setLocalAllergyExcludeMode(allergyExcludeMode);
  }, [selectedAllergies, selectedIngredients, allergyExcludeMode]);

  // Check if any filters are applied
  const hasActiveFilters =
    selectedAllergies.length > 0 || selectedIngredients.length > 0;

  // Calculate active filters count safely
  const calculateActiveFiltersCount = (): number => {
    let count = 0;
    if (selectedAllergies.length > 0) count += 1;
    if (selectedIngredients.length > 0) count += 1;
    return count;
  };

  const activeFiltersCount = calculateActiveFiltersCount();

  // Apply current filters
  const handleApplyFilters = () => {
    onFilterChange(
      localSelectedAllergies,
      localSelectedIngredients,
      localAllergyExcludeMode
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setLocalSelectedAllergies([]);
    setLocalSelectedIngredients([]);
    setLocalAllergyExcludeMode(true);
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
              />
              <Text size="xs" c="dimmed" mt="xs">
                {localAllergyExcludeMode
                  ? t("filters.allergyMode.excludeHint")
                  : t("filters.allergyMode.includeHint")}
              </Text>
            </Box>
          </Box>

          <Group>
            <Button
              onClick={handleApplyFilters}
              disabled={disabled}
              size="compact-sm"
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
                  localSelectedIngredients.length === 0)
              }
              size="compact-sm"
            >
              {t("filters.reset")}
            </Button>
          </Group>
        </Stack>
      </Collapse>
    </Paper>
  );
}
