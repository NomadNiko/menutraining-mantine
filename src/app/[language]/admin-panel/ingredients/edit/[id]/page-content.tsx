"use client";
import { useEffect, useState } from "react";
import { Container, Paper } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetIngredientService,
  useUpdateIngredientService,
} from "@/services/api/services/ingredients";
import { useGetRestaurantByCodeService } from "@/services/api/services/restaurants";
import { IngredientForm } from "@/components/ingredients/IngredientForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { RoleEnum } from "@/services/api/types/role";
import RouteGuard from "@/services/auth/route-guard";
import {
  Ingredient,
  UpdateIngredientDto,
} from "@/services/api/types/ingredient";
import { Restaurant } from "@/services/api/types/restaurant";

function EditIngredient() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useTranslation("admin-panel-ingredients");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const [ingredient, setIngredient] = useState<Ingredient | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getIngredientService = useGetIngredientService();
  const updateIngredientService = useUpdateIngredientService();
  const getRestaurantService = useGetRestaurantByCodeService();

  // Load ingredient and restaurant data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First get the ingredient
        const { status, data } = await getIngredientService({ id });
        if (status === HTTP_CODES_ENUM.OK) {
          // Handle direct object or nested data
          const ingredientData = data;
          setIngredient(ingredientData);
          // Then get the restaurant info
          const restaurantResult = await getRestaurantService({
            restaurantId: ingredientData.restaurantId,
          });
          if (restaurantResult.status === HTTP_CODES_ENUM.OK) {
            // Handle direct object or nested data
            const restaurantData = restaurantResult.data;
            setRestaurant(restaurantData);
          }
        } else {
          // Handle error - ingredient not found
          enqueueSnackbar(t("ingredientNotFound"), { variant: "error" });
          router.push("/admin-panel/ingredients");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
        router.push("/admin-panel/ingredients");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [
    id,
    getIngredientService,
    getRestaurantService,
    setLoading,
    router,
    t,
    enqueueSnackbar,
  ]);

  const handleSubmit = async (formData: UpdateIngredientDto) => {
    setIsSubmitting(true);
    setLoading(true);
    try {
      const { status } = await updateIngredientService(formData, { id });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t("updateSuccess"), { variant: "success" });
        router.push("/admin-panel/ingredients");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        // Handle validation errors
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
    <RouteGuard roles={[RoleEnum.ADMIN, RoleEnum.USER]}>
      <Container size="xs">
        <Paper p="md" withBorder>
          {ingredient && restaurant && (
            <IngredientForm
              restaurantId={ingredient.restaurantId}
              restaurantName={restaurant.name}
              initialData={ingredient}
              onSubmit={handleSubmit}
              isEdit={true}
              isLoading={isSubmitting}
            />
          )}
        </Paper>
      </Container>
    </RouteGuard>
  );
}

export default EditIngredient;
