// src/app/[language]/restaurant/recipes/[id]/edit-streamlined/page-content.tsx
"use client";
import { Container, Paper, Center, Loader, Text } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import { useGetRecipeService } from "@/services/api/services/recipes";
import { RecipeFormStreamlined } from "@/components/recipes/RecipeFormStreamlined";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Recipe } from "@/services/api/types/recipe";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useEffect, useState } from "react";
import { useResponsive } from "@/services/responsive/use-responsive";

function EditRecipeStreamlined() {
  const { t } = useTranslation("restaurant-recipes");
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const getRecipeService = useGetRecipeService();
  const { isMobile, isTablet } = useResponsive();

  // Determine container size based on screen size
  const containerSize = isMobile || isTablet ? "xs" : "sm";

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId || !selectedRestaurant) return;

      try {
        const { status, data } = await getRecipeService({ recipeId: recipeId });

        if (status === HTTP_CODES_ENUM.OK && data) {
          // Verify the recipe belongs to the selected restaurant
          if (data.restaurantId === selectedRestaurant.restaurantId) {
            setRecipe(data);
          } else {
            enqueueSnackbar(t("recipeNotFound"), { variant: "error" });
            router.push("/restaurant/recipes");
          }
        } else {
          enqueueSnackbar(t("loadError"), { variant: "error" });
          router.push("/restaurant/recipes");
        }
      } catch (error) {
        console.error("Error loading recipe:", error);
        enqueueSnackbar(t("loadError"), { variant: "error" });
        router.push("/restaurant/recipes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [
    recipeId,
    selectedRestaurant,
    getRecipeService,
    enqueueSnackbar,
    router,
    t,
  ]);

  const handleRecipeUpdated = (updatedRecipe: Recipe) => {
    setRecipe(updatedRecipe);
  };

  if (!selectedRestaurant) {
    return null; // Will be handled by route guard
  }

  if (isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  if (!recipe) {
    return (
      <Center p="xl">
        <Text>{t("recipeNotFound")}</Text>
      </Center>
    );
  }

  return (
    <Container size={containerSize}>
      <Paper p="md" withBorder>
        <RecipeFormStreamlined
          restaurantId={selectedRestaurant.restaurantId}
          restaurantName={selectedRestaurant.name}
          recipe={recipe}
          onRecipeUpdated={handleRecipeUpdated}
          isNewRecipe={false}
        />
      </Paper>
    </Container>
  );
}

export default EditRecipeStreamlined;
