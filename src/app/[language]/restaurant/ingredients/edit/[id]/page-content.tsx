"use client";
import { useEffect, useState } from "react";
import { Container, Paper } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetIngredientService,
  useUpdateIngredientService,
} from "@/services/api/services/ingredients";
import { IngredientForm } from "@/components/ingredients/IngredientForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  Ingredient,
  UpdateIngredientDto,
} from "@/services/api/types/ingredient";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useResponsive } from "@/services/responsive/use-responsive";
import { useRestaurantDataCache } from "@/services/restaurant/restaurant-data-cache";

function EditIngredient() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useTranslation("admin-panel-ingredients");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const { isMobile, isTablet } = useResponsive();

  // Determine container size based on screen size
  const containerSize = isMobile || isTablet ? "xs" : "sm";

  const [ingredient, setIngredient] = useState<Ingredient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const getIngredientService = useGetIngredientService();
  const updateIngredientService = useUpdateIngredientService();
  const { refreshData } = useRestaurantDataCache();

  // Load ingredient data
  useEffect(() => {
    if (!selectedRestaurant) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { status, data } = await getIngredientService({ id });
        if (status === HTTP_CODES_ENUM.OK) {
          const ingredientData = data;
          setIngredient(ingredientData);

          // Verify this ingredient belongs to the selected restaurant
          if (ingredientData.restaurantId === selectedRestaurant.restaurantId) {
            setIsAuthorized(true);
          } else {
            // Not authorized - ingredient belongs to a different restaurant
            enqueueSnackbar(t("unauthorized"), { variant: "error" });
            router.push("/restaurant/ingredients");
          }
        } else {
          enqueueSnackbar(t("ingredientNotFound"), { variant: "error" });
          router.push("/restaurant/ingredients");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
        router.push("/restaurant/ingredients");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    id,
    selectedRestaurant,
    getIngredientService,
    setLoading,
    router,
    t,
    enqueueSnackbar,
  ]);

  const handleSubmit = async (formData: UpdateIngredientDto) => {
    if (!selectedRestaurant || !isAuthorized) return;

    setIsSubmitting(true);
    setLoading(true);
    try {
      // Ensure restaurant ID is set to the selected restaurant
      const dataWithRestaurant = {
        ...formData,
        restaurantId: selectedRestaurant.restaurantId,
      };

      const { status } = await updateIngredientService(dataWithRestaurant, {
        id,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t("updateSuccess"), { variant: "success" });
        // Refresh the cache before navigating
        await refreshData();
        router.push("/restaurant/ingredients");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        enqueueSnackbar(t("updateError"), { variant: "error" });
      }
    } catch (error) {
      console.error("Error updating ingredient:", error);
      enqueueSnackbar(t("updateError"), { variant: "error" });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <Container size={containerSize}>
      <Paper p="md" withBorder>
        {ingredient && isAuthorized && selectedRestaurant && (
          <IngredientForm
            restaurantId={selectedRestaurant.restaurantId}
            restaurantName={selectedRestaurant.name}
            initialData={ingredient}
            onSubmit={handleSubmit}
            isEdit={true}
            isLoading={isSubmitting}
          />
        )}
      </Paper>
    </Container>
  );
}

export default EditIngredient;
