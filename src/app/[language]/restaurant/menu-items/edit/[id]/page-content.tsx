// src/app/[language]/restaurant/menu-items/edit/[id]/page-content.tsx
"use client";
import { useEffect, useState } from "react";
import { Container, Paper } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetMenuItemService,
  useUpdateMenuItemService,
} from "@/services/api/services/menu-items";
import { MenuItemForm } from "@/components/menu-items/MenuItemForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { MenuItem, UpdateMenuItemDto } from "@/services/api/types/menu-item";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useResponsive } from "@/services/responsive/use-responsive";
import { useRestaurantDataCache } from "@/services/restaurant/restaurant-data-cache";

function EditMenuItem() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useTranslation("admin-panel-menu-items");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { refreshData } = useRestaurantDataCache();
  const { selectedRestaurant } = useSelectedRestaurant();
  const { isMobile, isTablet } = useResponsive();

  // Determine container size based on screen size
  const containerSize = isMobile || isTablet ? "xs" : "sm";

  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const getMenuItemService = useGetMenuItemService();
  const updateMenuItemService = useUpdateMenuItemService();

  // Load menu item data
  useEffect(() => {
    if (!selectedRestaurant) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { status, data } = await getMenuItemService({ menuItemId: id });

        if (status === HTTP_CODES_ENUM.OK) {
          const menuItemData = data;
          setMenuItem(menuItemData);

          // Verify this menu item belongs to the selected restaurant
          if (menuItemData.restaurantId === selectedRestaurant.restaurantId) {
            setIsAuthorized(true);
          } else {
            // Not authorized - menu item belongs to a different restaurant
            enqueueSnackbar(t("unauthorized"), { variant: "error" });
            router.push("/restaurant/menu-items");
          }
        } else {
          enqueueSnackbar(t("menuItemNotFound"), { variant: "error" });
          router.push("/restaurant/menu-items");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
        router.push("/restaurant/menu-items");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    id,
    selectedRestaurant,
    getMenuItemService,
    setLoading,
    router,
    t,
    enqueueSnackbar,
  ]);

  const handleSubmit = async (formData: UpdateMenuItemDto) => {
    if (!selectedRestaurant || !isAuthorized) return;

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Ensure restaurant ID is set to the selected restaurant
      const dataWithRestaurant = {
        ...formData,
        restaurantId: selectedRestaurant.restaurantId,
      };

      const { status } = await updateMenuItemService(dataWithRestaurant, {
        menuItemId: id,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t("updateSuccess"), { variant: "success" });
        // Refresh the cache before navigating
        await refreshData();
        router.push("/restaurant/menu-items");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        enqueueSnackbar(t("updateError"), { variant: "error" });
      }
    } catch (error) {
      console.error("Error updating menu item:", error);
      enqueueSnackbar(t("updateError"), { variant: "error" });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <Container size={containerSize}>
      <Paper p="md" withBorder>
        {menuItem && isAuthorized && selectedRestaurant && (
          <MenuItemForm
            restaurantId={selectedRestaurant.restaurantId}
            restaurantName={selectedRestaurant.name}
            initialData={menuItem}
            onSubmit={handleSubmit}
            isEdit={true}
            isLoading={isSubmitting}
          />
        )}
      </Paper>
    </Container>
  );
}

export default EditMenuItem;
