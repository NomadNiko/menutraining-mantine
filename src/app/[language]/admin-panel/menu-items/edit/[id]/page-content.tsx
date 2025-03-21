"use client";
import { useEffect, useState } from "react";
import { Container, Paper } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetMenuItemService,
  useUpdateMenuItemService,
} from "@/services/api/services/menu-items";
import { useGetRestaurantByCodeService } from "@/services/api/services/restaurants";
import { MenuItemForm } from "@/components/menu-items/MenuItemForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { RoleEnum } from "@/services/api/types/role";
import RouteGuard from "@/services/auth/route-guard";
import {
  MenuItem,
  UpdateMenuItemDto,
  CreateMenuItemDto,
} from "@/services/api/types/menu-item";
import { Restaurant } from "@/services/api/types/restaurant";

function EditMenuItem() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useTranslation("admin-panel-menu-items");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();

  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getMenuItemService = useGetMenuItemService();
  const updateMenuItemService = useUpdateMenuItemService();
  const getRestaurantService = useGetRestaurantByCodeService();

  // Load menu item and restaurant data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First get the menu item
        const { status, data } = await getMenuItemService({ id });
        if (status === HTTP_CODES_ENUM.OK) {
          const menuItemData = data;
          setMenuItem(menuItemData);

          // Then get the restaurant info
          const restaurantResult = await getRestaurantService({
            restaurantId: menuItemData.restaurantId,
          });

          if (restaurantResult.status === HTTP_CODES_ENUM.OK) {
            const restaurantData = restaurantResult.data;
            setRestaurant(restaurantData);
          }
        } else {
          // Handle error - menu item not found
          enqueueSnackbar(t("menuItemNotFound"), { variant: "error" });
          router.push("/admin-panel/menu-items");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
        router.push("/admin-panel/menu-items");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    id,
    getMenuItemService,
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
      const { status } = await updateMenuItemService(
        formData as UpdateMenuItemDto,
        { id }
      );
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t("updateSuccess"), { variant: "success" });
        router.push("/admin-panel/menu-items");
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
    <RouteGuard roles={[RoleEnum.ADMIN, RoleEnum.USER]}>
      <Container size="xs">
        <Paper p="md" withBorder>
          {menuItem && restaurant && (
            <MenuItemForm
              restaurantId={menuItem.restaurantId}
              restaurantName={restaurant.name}
              initialData={menuItem}
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

export default EditMenuItem;
