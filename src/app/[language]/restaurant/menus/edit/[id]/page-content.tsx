// src/app/[language]/restaurant/menus/edit/[id]/page-content.tsx
"use client";
import { useEffect, useState } from "react";
import { Container, Paper } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetMenuService,
  useUpdateMenuService,
} from "@/services/api/services/menus";
import { MenuForm } from "@/components/menus/MenuForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Menu, UpdateMenuDto } from "@/services/api/types/menu";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useResponsive } from "@/services/responsive/use-responsive";

function EditMenu() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useTranslation("restaurant-menus");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const { isMobile, isTablet } = useResponsive();
  const containerSize = isMobile || isTablet ? "xs" : "sm";

  const [menu, setMenu] = useState<Menu | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const getMenuService = useGetMenuService();
  const updateMenuService = useUpdateMenuService();

  // Load menu data
  useEffect(() => {
    if (!selectedRestaurant) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { status, data } = await getMenuService({ menuId: id });

        if (status === HTTP_CODES_ENUM.OK) {
          setMenu(data);

          // Verify this menu belongs to the selected restaurant
          if (data.restaurantId === selectedRestaurant.restaurantId) {
            setIsAuthorized(true);
          } else {
            // Not authorized - menu belongs to a different restaurant
            enqueueSnackbar(t("unauthorized"), { variant: "error" });
            router.push("/restaurant/menus");
          }
        } else {
          enqueueSnackbar(t("menuNotFound"), { variant: "error" });
          router.push("/restaurant/menus");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
        router.push("/restaurant/menus");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    id,
    selectedRestaurant,
    getMenuService,
    setLoading,
    router,
    t,
    enqueueSnackbar,
  ]);

  const handleSubmit = async (formData: UpdateMenuDto) => {
    if (!selectedRestaurant || !isAuthorized) return;

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Ensure restaurant ID is set to the selected restaurant
      const dataWithRestaurant = {
        ...formData,
        restaurantId: selectedRestaurant.restaurantId,
      };

      const { status } = await updateMenuService(dataWithRestaurant, {
        menuId: id,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t("updateSuccess"), { variant: "success" });
        router.push("/restaurant/menus");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        enqueueSnackbar(t("updateError"), { variant: "error" });
      }
    } catch (error) {
      console.error("Error updating menu:", error);
      enqueueSnackbar(t("updateError"), { variant: "error" });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <Container size={containerSize}>
      <Paper p="md" withBorder>
        {menu && isAuthorized && selectedRestaurant && (
          <MenuForm
            restaurantId={selectedRestaurant.restaurantId}
            restaurantName={selectedRestaurant.name}
            initialData={menu}
            onSubmit={handleSubmit}
            isEdit={true}
            isLoading={isSubmitting}
          />
        )}
      </Paper>
    </Container>
  );
}

export default EditMenu;
