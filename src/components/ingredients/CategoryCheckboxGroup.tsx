"use client";
import { Checkbox, Group, Stack, Text, SimpleGrid } from "@mantine/core";
import { CATEGORY_KEYS } from "@/constants/ingredient-categories";
import { useTranslation } from "@/services/i18n/client";

interface CategoryCheckboxGroupProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  disabled?: boolean;
}

export function CategoryCheckboxGroup({
  selectedCategories,
  onChange,
  disabled = false,
}: CategoryCheckboxGroupProps) {
  const { t } = useTranslation("admin-panel-ingredients");

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedCategories, category]);
    } else {
      onChange(selectedCategories.filter((c) => c !== category));
    }
  };

  return (
    <Stack>
      <Text size="sm" fw={500}>
        {t("form.categories")}
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {CATEGORY_KEYS.map((categoryKey) => (
          <Group key={categoryKey} wrap="nowrap">
            <Checkbox
              label={t(`categories.${categoryKey}`)}
              checked={selectedCategories.includes(categoryKey)}
              onChange={(event) =>
                handleCategoryChange(categoryKey, event.currentTarget.checked)
              }
              disabled={disabled}
            />
          </Group>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
