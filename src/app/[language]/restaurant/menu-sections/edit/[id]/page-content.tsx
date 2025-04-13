// src/app/[language]/restaurant/menu-sections/edit/[id]/page-content.tsx
"use client";
import { useEffect, useState } from "react";
import { Container, Paper } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetMenuSectionService,
  useUpdateMenuSectionService,
} from "@/services/api/services/menu-sections";
import { MenuSectionForm } from "@/components/menu-sections/MenuSectionForm";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  MenuSection,
  UpdateMenuSectionDto,
} from "@/services/api/types/menu-section";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useResponsive } from "@/services/responsive/use-responsive";

function EditMenuSection() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useTranslation("restaurant-menu-sections");
  const router = useRouter();
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const { isMobile, isTablet } = useResponsive();
  const containerSize = isMobile || isTablet ? "xs" : "sm";

  const [menuSection, setMenuSection] = useState<MenuSection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const getMenuSectionService = useGetMenuSectionService();
  const updateMenuSectionService = useUpdateMenuSectionService();

  // Load menu section data
  useEffect(() => {
    if (!selectedRestaurant) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { status, data } = await getMenuSectionService({ id });

        if (status === HTTP_CODES_ENUM.OK) {
          setMenuSection(data);

          // Verify this menu section belongs to the selected restaurant
          if (data.restaurantId === selectedRestaurant.restaurantId) {
            setIsAuthorized(true);
          } else {
            // Not authorized - menu section belongs to a different restaurant
            enqueueSnackbar(t("unauthorized"), { variant: "error" });
            router.push("/restaurant/menu-sections");
          }
        } else {
          enqueueSnackbar(t("menuSectionNotFound"), { variant: "error" });
          router.push("/restaurant/menu-sections");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
        router.push("/restaurant/menu-sections");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    id,
    selectedRestaurant,
    getMenuSectionService,
    setLoading,
    router,
    t,
    enqueueSnackbar,
  ]);

  const handleSubmit = async (formData: UpdateMenuSectionDto) => {
    if (!selectedRestaurant || !isAuthorized) return;

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Ensure restaurant ID is set to the selected restaurant
      const dataWithRestaurant = {
        ...formData,
        restaurantId: selectedRestaurant.restaurantId,
      };

      const { status } = await updateMenuSectionService(dataWithRestaurant, {
        id,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t("updateSuccess"), { variant: "success" });
        router.push("/restaurant/menu-sections");
      } else if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        enqueueSnackbar(t("updateError"), { variant: "error" });
      }
    } catch (error) {
      console.error("Error updating menu section:", error);
      enqueueSnackbar(t("updateError"), { variant: "error" });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <Container size={containerSize}>
      <Paper p="md" withBorder>
        {menuSection && isAuthorized && selectedRestaurant && (
          <MenuSectionForm
            restaurantId={selectedRestaurant.restaurantId}
            restaurantName={selectedRestaurant.name}
            initialData={menuSection}
            onSubmit={handleSubmit}
            isEdit={true}
            isLoading={isSubmitting}
          />
        )}
      </Paper>
    </Container>
  );
}

export default EditMenuSection;
