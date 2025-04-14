// src/app/[language]/restaurant/recipes/create/page-content.tsx
"use client";
import { Container, Paper } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import { useCreateRecipeService } from "@/services/api/services/recipes";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { CreateRecipeDto } from "@/services/api/types/recipe";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useState } from "react";
import { useResponsive } from "@/services/responsive/use-responsive";

function CreateRecipe() {
  const { t } = useTranslation("restaurant-recipes");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createRecipeService = useCreateRecipeService();
  const { isMobile, isTablet } = useResponsive();

  // Determine container size based on screen size
  const containerSize = isMobile || isTablet ? "xs" : "sm";

  const handleSubmit = async (formData: CreateRecipeDto) => {
    if (!selectedRestaurant) {
      enqueueSnackbar(t("noRestaurantSelected"), { variant: "error" });
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Ensure restaurant ID is set to the selected restaurant
      const dataWithRestaurant = {
        ...formData,
        restaurantId: selectedRestaurant.restaurantId,
      };

      const { status } = await createRecipeService(dataWithRestaurant);

      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(t("createSuccess"), { variant: "success" });
        router.push("/restaurant/recipes");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        enqueueSnackbar(t("createError"), { variant: "error" });
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
      enqueueSnackbar(t("createError"), { variant: "error" });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  if (!selectedRestaurant) {
    return null; // Will be handled by route guard
  }

  return (
    <Container size={containerSize}>
      <Paper p="md" withBorder>
        <RecipeForm
          restaurantId={selectedRestaurant.restaurantId}
          restaurantName={selectedRestaurant.name}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Paper>
    </Container>
  );
}

export default CreateRecipe;
