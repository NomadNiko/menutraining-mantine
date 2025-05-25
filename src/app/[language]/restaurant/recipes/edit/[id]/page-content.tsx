// src/app/[language]/restaurant/recipes/edit/[id]/page-content.tsx
"use client";
import { useEffect, useState } from "react";
import { Container, Paper } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetRecipeService,
  useUpdateRecipeService,
} from "@/services/api/services/recipes";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Recipe, UpdateRecipeDto } from "@/services/api/types/recipe";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useResponsive } from "@/services/responsive/use-responsive";
import { normalizeRecipe } from "@/utils/recipe-normalizer";

function EditRecipe() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useTranslation("restaurant-recipes");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const { isMobile, isTablet } = useResponsive();
  const containerSize = isMobile || isTablet ? "xs" : "sm";

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const getRecipeService = useGetRecipeService();
  const updateRecipeService = useUpdateRecipeService();

  // Load recipe data
  useEffect(() => {
    if (!selectedRestaurant) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { status, data } = await getRecipeService({ id });

        if (status === HTTP_CODES_ENUM.OK) {
          setRecipe(normalizeRecipe(data));

          // Verify this recipe belongs to the selected restaurant
          if (data.restaurantId === selectedRestaurant.restaurantId) {
            setIsAuthorized(true);
          } else {
            // Not authorized - recipe belongs to a different restaurant
            enqueueSnackbar(t("unauthorized"), { variant: "error" });
            router.push("/restaurant/recipes");
          }
        } else {
          enqueueSnackbar(t("recipeNotFound"), { variant: "error" });
          router.push("/restaurant/recipes");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
        router.push("/restaurant/recipes");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    id,
    selectedRestaurant,
    getRecipeService,
    setLoading,
    router,
    t,
    enqueueSnackbar,
  ]);

  const handleSubmit = async (formData: UpdateRecipeDto) => {
    if (!selectedRestaurant || !isAuthorized) return;

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Ensure restaurant ID is set to the selected restaurant
      const dataWithRestaurant = {
        ...formData,
        restaurantId: selectedRestaurant.restaurantId,
      };

      const { status } = await updateRecipeService(dataWithRestaurant, { id });

      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t("updateSuccess"), { variant: "success" });
        router.push("/restaurant/recipes");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        enqueueSnackbar(t("updateError"), { variant: "error" });
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      enqueueSnackbar(t("updateError"), { variant: "error" });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <Container size={containerSize}>
      <Paper p="md" withBorder>
        {recipe && isAuthorized && selectedRestaurant && (
          <RecipeForm
            restaurantId={selectedRestaurant.restaurantId}
            restaurantName={selectedRestaurant.name}
            initialData={recipe}
            onSubmit={handleSubmit}
            isEdit={true}
            isLoading={isSubmitting}
          />
        )}
      </Paper>
    </Container>
  );
}

export default EditRecipe;
