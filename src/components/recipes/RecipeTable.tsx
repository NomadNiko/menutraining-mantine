// src/components/recipes/RecipeTable.tsx
"use client";
import {
  Table,
  Group,
  Button,
  Text,
  Center,
  Loader,
  UnstyledButton,
  Flex,
  Badge,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconSortAscending,
  IconSortDescending,
  IconEye,
  IconClock,
} from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";
import { Recipe } from "@/services/api/types/recipe";
import { memo } from "react";

interface RecipeTableProps {
  recipes: Recipe[];
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
  onView: (id: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

function RecipeTableComponent({
  recipes,
  loading = false,
  onDelete,
  onView,
  sortField,
  sortDirection,
  onSort,
}: RecipeTableProps) {
  const { t } = useTranslation("restaurant-recipes");

  if (recipes.length === 0 && loading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (recipes.length === 0) {
    return (
      <Center p="xl">
        <Text>{t("noRecipes")}</Text>
      </Center>
    );
  }

  const SortableHeader = ({
    label,
    field,
    width,
  }: {
    label: string;
    field: string;
    width: number;
  }) => {
    const isActive = sortField === field;
    return (
      <th style={{ width, padding: "10px" }}>
        <UnstyledButton
          onClick={() => onSort && onSort(field)}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: onSort ? "pointer" : "default",
            width: "100%",
          }}
        >
          <Flex align="center" justify="space-between">
            <Text fw={500}>{label}</Text>
            {isActive &&
              (sortDirection === "asc" ? (
                <IconSortAscending size={14} />
              ) : (
                <IconSortDescending size={14} />
              ))}
          </Flex>
        </UnstyledButton>
      </th>
    );
  };

  return (
    <Table>
      <thead>
        <tr>
          <SortableHeader
            label={t("table.name")}
            field="recipeName"
            width={200}
          />
          <SortableHeader
            label={t("table.servings")}
            field="recipeServings"
            width={100}
          />
          <SortableHeader
            label={t("table.prepTime")}
            field="recipePrepTime"
            width={120}
          />
          <SortableHeader
            label={t("table.totalTime")}
            field="recipeTotalTime"
            width={120}
          />
          <SortableHeader label={t("table.steps")} field="steps" width={100} />
          <th style={{ width: 250, textAlign: "right", padding: "10px" }}>
            {t("table.actions")}
          </th>
        </tr>
      </thead>
      <tbody>
        {recipes.map((recipe) => (
          <tr key={recipe.id}>
            <td style={{ width: 200, padding: "10px" }}>
              <Text fw={500}>{recipe.recipeName}</Text>
              {recipe.recipeDescription && (
                <Text size="xs" lineClamp={1} c="dimmed">
                  {recipe.recipeDescription}
                </Text>
              )}
            </td>
            <td style={{ width: 100, padding: "10px" }}>
              <Badge color="grape">{recipe.recipeServings}</Badge>
            </td>
            <td style={{ width: 120, padding: "10px" }}>
              <Group gap={5}>
                <IconClock size={14} />
                <Text size="sm">
                  {recipe.recipePrepTime} {t("min")}
                </Text>
              </Group>
            </td>
            <td style={{ width: 120, padding: "10px" }}>
              <Group gap={5}>
                <IconClock size={14} />
                <Text size="sm">
                  {recipe.recipeTotalTime} {t("min")}
                </Text>
              </Group>
            </td>
            <td style={{ width: 100, padding: "10px" }}>
              <Badge>{recipe.recipeSteps.length}</Badge>
            </td>
            <td
              style={{
                width: 250,
                textAlign: "right",
                padding: "10px",
              }}
            >
              <Group gap="xs" justify="flex-end">
                <Button
                  onClick={() => onView(recipe.id)}
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconEye size={14} />}
                >
                  {t("actions.view")}
                </Button>
                <Button
                  component={Link}
                  href={`/restaurant/recipes/edit/${recipe.id}`}
                  size="xs"
                  variant="light"
                  leftSection={<IconEdit size={14} />}
                >
                  {t("actions.edit")}
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => onDelete(recipe.id, recipe.recipeName)}
                >
                  {t("actions.delete")}
                </Button>
              </Group>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

// Use memo to prevent unnecessary re-renders
export const RecipeTable = memo(RecipeTableComponent);
