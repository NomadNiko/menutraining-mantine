"use client";
import { useEffect, useState } from "react";
import { Container, Paper } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import { useGetRestaurantByCodeService } from "@/services/api/services/restaurants";
import { useCreateMenuItemService } from "@/services/api/services/menu-items";
import { MenuItemForm } from "@/components/menu-items/MenuItemForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { RoleEnum } from "@/services/api/types/role";
import RouteGuard from "@/services/auth/route-guard";
import { Restaurant } from "@/services/api/types/restaurant";
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from "@/services/api/types/menu-item";

function CreateMenuItem() {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;
  const { t } = useTranslation("admin-panel-menu-items");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRestaurantService = useGetRestaurantByCodeService();
  const createMenuItemService = useCreateMenuItemService();

  // Load restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true);
      try {
        const { status, data } = await getRestaurantService({ restaurantId });
        if (status === HTTP_CODES_ENUM.OK) {
          const restaurantData = data && typeof data === "object" ? data : null;
          setRestaurant(restaurantData);
        } else {
          enqueueSnackbar(t("restaurantNotFound"), { variant: "error" });
          router.push("/admin-panel/menu-items");
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
        router.push("/admin-panel/menu-items");
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
    formData: CreateMenuItemDto | UpdateMenuItemDto
  ) => {
    setIsSubmitting(true);
    setLoading(true);

    try {
      const { status } = await createMenuItemService(
        formData as CreateMenuItemDto
      );
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(t("createSuccess"), { variant: "success" });
        router.push("/admin-panel/menu-items");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        enqueueSnackbar(t("createError"), { variant: "error" });
      }
    } catch (error) {
      console.error("Error creating menu item:", error);
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
            <MenuItemForm
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

export default CreateMenuItem;
