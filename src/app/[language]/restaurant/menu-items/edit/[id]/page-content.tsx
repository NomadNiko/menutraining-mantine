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
import {
  MenuItem,
  UpdateMenuItemDto,
  CreateMenuItemDto,
} from "@/services/api/types/menu-item";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";

function EditMenuItem() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useTranslation("admin-panel-menu-items");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();

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
        const { status, data } = await getMenuItemService({ id });
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

  const handleSubmit = async (
    formData: CreateMenuItemDto | UpdateMenuItemDto
  ) => {
    if (!selectedRestaurant || !isAuthorized) return;

    setIsSubmitting(true);
    setLoading(true);
    try {
      // Ensure restaurant ID is set to the selected restaurant
      const dataWithRestaurant = {
        ...formData,
        restaurantId: selectedRestaurant.restaurantId,
      } as UpdateMenuItemDto;

      const { status } = await updateMenuItemService(dataWithRestaurant, {
        id,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t("updateSuccess"), { variant: "success" });
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
    <Container size="xs">
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
