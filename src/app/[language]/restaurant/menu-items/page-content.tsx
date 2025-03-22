"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Title,
  Paper,
  Button,
  Text,
  Group,
  Loader,
  Center,
} from "@mantine/core";
import { useGetMenuItemsService } from "@/services/api/services/menu-items";
import { useResponsive } from "@/services/responsive/use-responsive";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import MenuItemTable from "@/components/menu-items/MenuItemTable";
import { MenuItemCards } from "@/components/menu-items/MenuItemCards";
import useGlobalLoading from "@/services/loading/use-global-loading";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import { useDeleteMenuItemService } from "@/services/api/services/menu-items";
import { MenuItem } from "@/services/api/types/menu-item";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";

function RestaurantMenuItemsPage() {
  const { t } = useTranslation("admin-panel-menu-items");
  const { isMobile } = useResponsive();
  const { setLoading } = useGlobalLoading();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const getMenuItemsService = useGetMenuItemsService();
  const deleteMenuItemService = useDeleteMenuItemService();

  // Fetch menu items for the selected restaurant
  const fetchMenuItems = useCallback(async () => {
    if (!selectedRestaurant) return;

    setLocalLoading(true);
    setLoading(true);
    try {
      const { status, data } = await getMenuItemsService(undefined, {
        restaurantId: selectedRestaurant.restaurantId,
        page,
        limit: 10,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        const menuItemsArray = Array.isArray(data) ? data : data?.data || [];
        setMenuItems((prevMenuItems) =>
          page === 1 ? menuItemsArray : [...prevMenuItems, ...menuItemsArray]
        );
        setHasMore(menuItemsArray.length === 10);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      enqueueSnackbar(t("fetchError"), { variant: "error" });
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [
    selectedRestaurant,
    page,
    getMenuItemsService,
    setLoading,
    t,
    enqueueSnackbar,
  ]);

  // Load data when restaurant changes or page changes
  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuItems();
    }
  }, [fetchMenuItems, selectedRestaurant]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  // Handle menu item deletion
  const handleDeleteMenuItem = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: t("deleteConfirmTitle"),
      message: t("deleteConfirmMessage", { name }),
    });

    if (confirmed) {
      setLoading(true);
      try {
        const { status } = await deleteMenuItemService({ id });
        if (status === HTTP_CODES_ENUM.NO_CONTENT) {
          setMenuItems((prevMenuItems) =>
            prevMenuItems.filter((menuItem) => menuItem.id !== id)
          );
          enqueueSnackbar(t("deleteSuccess"), { variant: "success" });
        }
      } catch (error) {
        console.error("Error deleting menu item:", error);
        enqueueSnackbar(t("deleteError"), { variant: "error" });
      } finally {
        setLoading(false);
      }
    }
  };

  if (!selectedRestaurant) {
    return (
      <Center p="xl">
        <Text>No restaurant selected</Text>
      </Center>
    );
  }

  return (
    <Container size={isMobile ? "100%" : "lg"}>
      <Group justify="space-between" mb="xl">
        <Title order={2}>
          {t("title")}: {selectedRestaurant.name}
        </Title>
        <Button
          component={Link}
          href="/restaurant/menu-items/create"
          color="green"
          size="compact-sm"
        >
          {t("create")}
        </Button>
      </Group>

      <Paper p="md" withBorder>
        {loading && menuItems.length === 0 ? (
          <Center p="xl">
            <Loader size="md" />
          </Center>
        ) : isMobile ? (
          <MenuItemCards
            menuItems={menuItems}
            onDelete={handleDeleteMenuItem}
            handleLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={loading}
          />
        ) : (
          <>
            <MenuItemTable
              menuItems={menuItems}
              onDelete={handleDeleteMenuItem}
            />
            {hasMore && (
              <Group justify="center" mt="md">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  size="compact-sm"
                >
                  {t("loadMore")}
                </Button>
              </Group>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}

export default RestaurantMenuItemsPage;
