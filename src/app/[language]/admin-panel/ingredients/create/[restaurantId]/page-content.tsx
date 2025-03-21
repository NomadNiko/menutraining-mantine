"use client";
import { useEffect, useState } from "react";
import { Container, Paper } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import { useGetRestaurantByCodeService } from "@/services/api/services/restaurants";
import { useCreateIngredientService } from "@/services/api/services/ingredients";
import { IngredientForm } from "@/components/ingredients/IngredientForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { RoleEnum } from "@/services/api/types/role";
import RouteGuard from "@/services/auth/route-guard";
import { Restaurant } from "@/services/api/types/restaurant";
import {
  CreateIngredientDto,
  UpdateIngredientDto,
} from "@/services/api/types/ingredient";

function CreateIngredient() {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;
  const { t } = useTranslation("admin-panel-ingredients");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getRestaurantService = useGetRestaurantByCodeService();
  const createIngredientService = useCreateIngredientService();

  // Load restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true);
      try {
        const { status, data } = await getRestaurantService({ restaurantId });
        if (status === HTTP_CODES_ENUM.OK) {
          // Handle data as either direct object or within data property
          const restaurantData = data && typeof data === "object" ? data : null;
          setRestaurant(restaurantData);
        } else {
          // Handle error - restaurant not found or no access
          enqueueSnackbar(t("restaurantNotFound"), { variant: "error" });
          router.push("/admin-panel/ingredients");
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
        router.push("/admin-panel/ingredients");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [
    restaurantId,
    getRestaurantService,
    setLoading,
    router,
    t,
    enqueueSnackbar,
  ]);

  const handleSubmit = async (
    formData: CreateIngredientDto | UpdateIngredientDto
  ) => {
    setIsSubmitting(true);
    setLoading(true);
    try {
      const { status } = await createIngredientService(
        formData as CreateIngredientDto
      );
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(t("createSuccess"), { variant: "success" });
        router.push("/admin-panel/ingredients");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        // Handle validation errors
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

  return (
    <RouteGuard roles={[RoleEnum.ADMIN, RoleEnum.USER]}>
      <Container size="xs">
        <Paper p="md" withBorder>
          {restaurant && (
            <IngredientForm
              restaurantId={restaurantId}
              restaurantName={restaurant.name}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          )}
        </Paper>
      </Container>
    </RouteGuard>
  );
}

export default CreateIngredient;
