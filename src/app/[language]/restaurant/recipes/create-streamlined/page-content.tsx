// src/app/[language]/restaurant/recipes/create-streamlined/page-content.tsx
"use client";
import { Container, Paper } from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";
import { useCreateRecipeService } from "@/services/api/services/recipes";
import { RecipeFormStreamlined } from "@/components/recipes/RecipeFormStreamlined";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { CreateRecipeDto, Recipe } from "@/services/api/types/recipe";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useState } from "react";
import { useResponsive } from "@/services/responsive/use-responsive";

function CreateRecipeStreamlined() {
  const { t } = useTranslation("restaurant-recipes");
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const [createdRecipe, setCreatedRecipe] = useState<Recipe | null>(null);
  const createRecipeService = useCreateRecipeService();
  const { isMobile, isTablet } = useResponsive();

  // Determine container size based on screen size
  const containerSize = isMobile || isTablet ? "xs" : "sm";

  const handleRecipeCreated = async (formData: CreateRecipeDto) => {
    if (!selectedRestaurant) {
      enqueueSnackbar(t("noRestaurantSelected"), { variant: "error" });
      return;
    }

    setLoading(true);

    try {
      // Ensure restaurant ID is set to the selected restaurant
      const dataWithRestaurant = {
        ...formData,
        restaurantId: selectedRestaurant.restaurantId,
      };

      const { status, data } = await createRecipeService(dataWithRestaurant);

      if (status === HTTP_CODES_ENUM.CREATED && data) {
        enqueueSnackbar(t("createSuccess"), { variant: "success" });
        setCreatedRecipe(data);
        // Stay on the same page to allow adding steps
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        enqueueSnackbar(t("createError"), { variant: "error" });
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
      enqueueSnackbar(t("createError"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeUpdated = (updatedRecipe: Recipe) => {
    setCreatedRecipe(updatedRecipe);
  };

  if (!selectedRestaurant) {
    return null; // Will be handled by route guard
  }

  return (
    <Container size={containerSize}>
      <Paper p="md" withBorder>
        <RecipeFormStreamlined
          restaurantId={selectedRestaurant.restaurantId}
          restaurantName={selectedRestaurant.name}
          recipe={createdRecipe || undefined}
          onRecipeCreated={handleRecipeCreated}
          onRecipeUpdated={handleRecipeUpdated}
          isNewRecipe={!createdRecipe}
        />
      </Paper>
    </Container>
  );
}

export default CreateRecipeStreamlined;
