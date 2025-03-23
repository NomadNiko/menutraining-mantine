// ./menutraining-mantine/src/components/ingredients/FilterPanel.tsx

"use client";
import { useState, useEffect } from "react";
import {
  Paper,
  Group,
  Text,
  MultiSelect,
  Switch,
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
import { useResponsive } from "@/services/responsive/use-responsive";
import { CATEGORY_KEYS } from "@/constants/ingredient-categories";

interface FilterOption {
  value: string;
  label: string;
}

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
  allergies,
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
  const { isMobile } = useResponsive();
  const [opened, { toggle }] = useDisclosure(!isMobile);

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

  // Convert allergies object to array of options for MultiSelect
  const allergyOptions: FilterOption[] = Object.entries(allergies).map(
    ([id, name]) => ({
      value: id,
      label: name,
    })
  );

  // Create category options for MultiSelect
  const categoryOptions: FilterOption[] = CATEGORY_KEYS.map((categoryKey) => ({
    value: categoryKey,
    label: t(`categories.${categoryKey}`),
  }));

  // Check if any filters are applied
  const hasActiveFilters =
    selectedAllergies.length > 0 ||
    hasSubIngredients !== null ||
    selectedCategories.length > 0;

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
                count:
                  (selectedAllergies.length || 0) +
                  (hasSubIngredients !== null ? 1 : 0) +
                  (selectedCategories.length || 0),
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
          {/* Allergy filters */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {t("filters.allergies.label")}
            </Text>
            <MultiSelect
              placeholder={t("filters.allergies.placeholder")}
              data={allergyOptions}
              value={localSelectedAllergies}
              onChange={setLocalSelectedAllergies}
              searchable
              clearable
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

          {/* Category filters */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {t("filters.categories.label")}
            </Text>
            <MultiSelect
              placeholder={t("filters.categories.placeholder")}
              data={categoryOptions}
              value={localSelectedCategories}
              onChange={setLocalSelectedCategories}
              searchable
              clearable
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
              />
              <Text size="xs" c="dimmed" mt="xs">
                {localCategoryExcludeMode
                  ? t("filters.categoryMode.excludeHint")
                  : t("filters.categoryMode.includeHint")}
              </Text>
            </Box>
          </Box>

          {/* Sub-ingredients filter */}
          <Switch
            label={t("filters.hasSubIngredients.label")}
            checked={localHasSubIngredients === true}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              setLocalHasSubIngredients(checked ? true : false);
            }}
            disabled={disabled}
          />

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
                  !localSelectedAllergies.length &&
                  !localSelectedCategories.length &&
                  localHasSubIngredients === null)
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
