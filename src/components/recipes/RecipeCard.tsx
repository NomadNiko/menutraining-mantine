// src/components/recipes/RecipeCard.tsx
"use client";
import { Card, Text, Group, Stack, Button, Badge, Box } from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconClock,
  IconExternalLink,
} from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";
import { Recipe } from "@/services/api/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  onDelete: (id: string, name: string) => void;
  onView: (id: string) => void;
}

export function RecipeCard({ recipe, onDelete, onView }: RecipeCardProps) {
  const { t } = useTranslation("restaurant-recipes");

  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Stack gap="xs">
        <Text size="lg" fw={500}>
          {recipe.recipeName}
        </Text>

        {recipe.recipeDescription && (
          <Text size="sm" lineClamp={2}>
            {recipe.recipeDescription}
          </Text>
        )}

        <Group gap="md">
          <Badge leftSection={<IconClock size={14} />} color="blue">
            {t("prepTime")}: {recipe.recipePrepTime} {t("minutes")}
          </Badge>

          <Badge color="green">
            {t("totalTime")}: {recipe.recipeTotalTime} {t("minutes")}
          </Badge>

          <Badge color="grape">
            {t("servings")}: {recipe.recipeServings}
          </Badge>
        </Group>

        <Box>
          <Text size="sm" fw={500} mb="xs">
            {t("steps")}: {recipe.recipeSteps.length}
          </Text>
        </Box>
      </Stack>

      <Group justify="flex-end" mt="md">
        <Button
          size="compact-xs"
          variant="light"
          color="blue"
          leftSection={<IconEye size={14} />}
          onClick={() => onView(recipe.id)}
        >
          {t("actions.quickView")}
        </Button>

        <Button
          component={Link}
          href={`/restaurant/recipes/view/${recipe.id}`}
          size="compact-xs"
          variant="light"
          color="teal"
          leftSection={<IconExternalLink size={14} />}
        >
          {t("actions.fullView")}
        </Button>

        <Button
          component={Link}
          href={`/restaurant/recipes/edit/${recipe.id}`}
          size="compact-xs"
          variant="light"
          leftSection={<IconEdit size={14} />}
        >
          {t("actions.edit")}
        </Button>

        <Button
          size="compact-xs"
          variant="light"
          color="red"
          leftSection={<IconTrash size={14} />}
          onClick={() => onDelete(recipe.id, recipe.recipeName)}
        >
          {t("actions.delete")}
        </Button>
      </Group>
    </Card>
  );
}
