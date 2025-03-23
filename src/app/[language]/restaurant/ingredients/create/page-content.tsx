"use client";
import { Container, Paper } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import { useCreateIngredientService } from "@/services/api/services/ingredients";
import { IngredientForm } from "@/components/ingredients/IngredientForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { CreateIngredientDto } from "@/services/api/types/ingredient";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useState } from "react";
import { useResponsive } from "@/services/responsive/use-responsive";

function CreateIngredient() {
  const { t } = useTranslation("admin-panel-ingredients");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createIngredientService = useCreateIngredientService();
  const { isMobile, isTablet } = useResponsive();

  // Determine container size based on screen size
  const containerSize = isMobile || isTablet ? "xs" : "sm";

  // Fixed the type here to match what IngredientForm expects
  const handleSubmit = async (
    formData: CreateIngredientDto | Partial<CreateIngredientDto>
  ) => {
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
      } as CreateIngredientDto; // Cast to ensure it meets the requirements

      const { status } = await createIngredientService(dataWithRestaurant);
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(t("createSuccess"), { variant: "success" });
        router.push("/restaurant/ingredients");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        enqueueSnackbar(t("createError"), { variant: "error" });
      }
    } catch (error) {
      console.error("Error creating ingredient:", error);
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
        <IngredientForm
          restaurantId={selectedRestaurant.restaurantId}
          restaurantName={selectedRestaurant.name}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Paper>
    </Container>
  );
}

export default CreateIngredient;
