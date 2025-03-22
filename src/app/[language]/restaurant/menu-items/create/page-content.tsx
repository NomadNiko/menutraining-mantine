"use client";
import { Container, Paper } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import { useCreateMenuItemService } from "@/services/api/services/menu-items";
import { MenuItemForm } from "@/components/menu-items/MenuItemForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from "@/services/api/types/menu-item";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useState } from "react";

function CreateMenuItem() {
  const { t } = useTranslation("admin-panel-menu-items");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMenuItemService = useCreateMenuItemService();

  const handleSubmit = async (
    formData: CreateMenuItemDto | UpdateMenuItemDto
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
      } as CreateMenuItemDto;

      const { status } = await createMenuItemService(dataWithRestaurant);
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(t("createSuccess"), { variant: "success" });
        router.push("/restaurant/menu-items");
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

  if (!selectedRestaurant) {
    return null; // Will be handled by route guard
  }

  return (
    <Container size="xs">
      <Paper p="md" withBorder>
        <MenuItemForm
          restaurantId={selectedRestaurant.restaurantId}
          restaurantName={selectedRestaurant.name}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Paper>
    </Container>
  );
}

export default CreateMenuItem;
