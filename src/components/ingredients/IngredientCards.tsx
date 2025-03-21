"use client";
import { useEffect, useRef } from "react";
import { Stack, Center, Loader, Text } from "@mantine/core";
import { IngredientCard } from "./IngredientCard";
import { useTranslation } from "@/services/i18n/client";
import { Ingredient } from "@/services/api/types/ingredient";

interface IngredientCardsProps {
  ingredients: Ingredient[];
  allergies: { [key: string]: string };
  subIngredientNames: { [key: string]: string };
  handleLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onDelete: (id: string, name: string) => void;
}

export function IngredientCards({
  ingredients,
  allergies,
  subIngredientNames,
  handleLoadMore,
  hasMore = false,
  loading = false,
  onDelete,
}: IngredientCardsProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget || !hasMore || loading || !handleLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(currentTarget);
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [handleLoadMore, hasMore, loading]);

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
      {ingredients.map((ingredient) => (
        <IngredientCard
          key={ingredient.id}
          ingredient={ingredient}
          allergies={allergies}
          subIngredientNames={subIngredientNames}
          onDelete={onDelete}
        />
      ))}
      {/* Loader for fetching next page */}
      {loading && hasMore && (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      )}
      {/* Invisible element for intersection observer */}
      <div ref={observerTarget} style={{ height: 10 }}></div>
    </Stack>
  );
}
