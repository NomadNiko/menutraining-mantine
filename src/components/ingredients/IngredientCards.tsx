// src/components/ingredients/IngredientCards.tsx
"use client";
import { Stack, Center, Loader, Text, SimpleGrid } from "@mantine/core";
import { IngredientCard } from "./IngredientCard";
import { useTranslation } from "@/services/i18n/client";
import { Ingredient } from "@/services/api/types/ingredient";
import { memo } from "react";

interface IngredientCardsProps {
  ingredients: Ingredient[];
  allergies: { [key: string]: string };
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
}

function IngredientCardsComponent({
  ingredients,
  allergies,
  loading = false,
  onDelete,
}: IngredientCardsProps) {
  const { t } = useTranslation("admin-panel-ingredients");

  if (ingredients.length === 0 && loading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (ingredients.length === 0) {
    return (
      <Center p="xl">
        <Text>{t("noIngredients")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <SimpleGrid cols={1}>
        {ingredients.map((ingredient) => (
          <IngredientCard
            key={ingredient.ingredientId}
            ingredient={ingredient}
            allergies={allergies}
            onDelete={onDelete}
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
export const IngredientCards = memo(IngredientCardsComponent);
