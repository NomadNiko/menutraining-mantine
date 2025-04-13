// src/app/[language]/restaurant/menus/create/page-content.tsx
"use client";
import { Container, Paper } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import { useCreateMenuService } from "@/services/api/services/menus";
import { MenuForm } from "@/components/menus/MenuForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { CreateMenuDto } from "@/services/api/types/menu";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useState } from "react";
import { useResponsive } from "@/services/responsive/use-responsive";

function CreateMenu() {
  const { t } = useTranslation("restaurant-menus");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMenuService = useCreateMenuService();
  const { isMobile, isTablet } = useResponsive();

  // Determine container size based on screen size
  const containerSize = isMobile || isTablet ? "xs" : "sm";

  // Fixed the signature to match what MenuForm expects
  const handleSubmit = async (
    formData: CreateMenuDto | Partial<CreateMenuDto>
  ) => {
    if (!selectedRestaurant) {
      enqueueSnackbar(t("noRestaurantSelected"), { variant: "error" });
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Ensure restaurant ID is set to the selected restaurant and all required fields are present
      const dataWithRestaurant = {
        ...formData,
        restaurantId: selectedRestaurant.restaurantId,
      };

      // Cast to CreateMenuDto after ensuring it has all required fields
      const { status } = await createMenuService(
        dataWithRestaurant as CreateMenuDto
      );

      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(t("createSuccess"), { variant: "success" });
        router.push("/restaurant/menus");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        enqueueSnackbar(t("createError"), { variant: "error" });
      }
    } catch (error) {
      console.error("Error creating menu:", error);
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
        <MenuForm
          restaurantId={selectedRestaurant.restaurantId}
          restaurantName={selectedRestaurant.name}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Paper>
    </Container>
  );
}

export default CreateMenu;
