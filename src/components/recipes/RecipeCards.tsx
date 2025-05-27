// src/components/recipes/RecipeCards.tsx
"use client";
import { Stack, Center, Loader, Text, SimpleGrid } from "@mantine/core";
import { RecipeCard } from "./RecipeCard";
import { useTranslation } from "@/services/i18n/client";
import { Recipe } from "@/services/api/types/recipe";
import { memo } from "react";

interface RecipeCardsProps {
  recipes: Recipe[];
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
  onView: (id: string) => void;
}

function RecipeCardsComponent({
  recipes,
  loading = false,
  onDelete,
  onView,
}: RecipeCardsProps) {
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

  return (
    <Stack gap="md">
      <SimpleGrid cols={1}>
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.recipeId}
            recipe={recipe}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </SimpleGrid>

      {loading && (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      )}
    </Stack>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const RecipeCards = memo(RecipeCardsComponent);
