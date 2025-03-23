// src/components/ingredients/FilterPanel.tsx
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

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPanelProps {
  allergies: Record<string, string>;
  selectedAllergies: string[];
  hasSubIngredients: boolean | null;
  allergyExcludeMode: boolean;
  onFilterChange: (
    allergies: string[],
    hasSubIngredients: boolean | null,
    allergyExcludeMode: boolean
  ) => void;
  onFilterReset: () => void;
  disabled?: boolean;
}

export function FilterPanel({
  allergies,
  selectedAllergies,
  hasSubIngredients,
  allergyExcludeMode,
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

  // Update local state when props change
  useEffect(() => {
    setLocalSelectedAllergies(selectedAllergies);
    setLocalHasSubIngredients(hasSubIngredients);
    setLocalAllergyExcludeMode(allergyExcludeMode);
  }, [selectedAllergies, hasSubIngredients, allergyExcludeMode]);

  // Convert allergies object to array of options for MultiSelect
  const allergyOptions: FilterOption[] = Object.entries(allergies).map(
    ([id, name]) => ({
      value: id,
      label: name,
    })
  );

  // Check if any filters are applied
  const hasActiveFilters =
    selectedAllergies.length > 0 || hasSubIngredients !== null;

  // Apply current filters
  const handleApplyFilters = () => {
    onFilterChange(
      localSelectedAllergies,
      localHasSubIngredients,
      localAllergyExcludeMode
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setLocalSelectedAllergies([]);
    setLocalHasSubIngredients(null);
    setLocalAllergyExcludeMode(true); // Default to exclude mode
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
                  (hasSubIngredients !== null ? 1 : 0),
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
          <MultiSelect
            label={t("filters.allergies.label")}
            placeholder={t("filters.allergies.placeholder")}
            data={allergyOptions}
            value={localSelectedAllergies}
            onChange={setLocalSelectedAllergies}
            searchable
            clearable
            disabled={disabled}
          />

          <Box>
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
