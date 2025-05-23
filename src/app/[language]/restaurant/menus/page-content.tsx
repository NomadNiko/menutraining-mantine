// src/app/[language]/restaurant/menus/page-content.tsx
"use client";
import { useState, useCallback, useMemo } from "react";
import {
  Container,
  Title,
  Paper,
  Button,
  Text,
  Group,
  Stack,
  Center,
  TextInput,
  Loader,
} from "@mantine/core";
import { useResponsive } from "@/services/responsive/use-responsive";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import { MenuTable } from "@/components/menus/MenuTable";
import { MenuCards } from "@/components/menus/MenuCards";
import { MenuViewModal } from "@/components/menus/MenuViewModal";
import useGlobalLoading from "@/services/loading/use-global-loading";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import {
  useDeleteMenuService,
  useGetMenusService,
} from "@/services/api/services/menus";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useSearchParams, useRouter } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";
import { useEffect } from "react";
import { Menu } from "@/services/api/types/menu";
import { MenuDataPreloader } from "@/components/menus/MenuDataPreloader";

function MenusPage() {
  const { t } = useTranslation("restaurant-menus");
  const { isMobile } = useResponsive();
  const { setLoading } = useGlobalLoading();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const deleteMenuService = useDeleteMenuService();
  const getMenusService = useGetMenusService();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get URL parameters or use defaults
  const initialSearch = searchParams.get("search") || "";
  const initialSortField = searchParams.get("sortField") || "name";
  const initialSortDirection = (searchParams.get("sortDirection") || "asc") as
    | "asc"
    | "desc";

  // State for filtering and sorting
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLocalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortField, setSortField] = useState(initialSortField);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);

  // State for the view modal
  const [viewMenuId, setViewMenuId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch menus
  const fetchMenus = useCallback(async () => {
    if (!selectedRestaurant) return;
    setLocalLoading(true);
    setLoading(true);
    try {
      const { status, data } = await getMenusService(undefined, {
        restaurantId: selectedRestaurant.restaurantId,
        name: searchQuery || undefined,
        limit: 300,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        // Handle both array and paginated responses
        const menusData = Array.isArray(data) ? data : data?.data || [];
        setMenus(menusData);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [getMenusService, selectedRestaurant, searchQuery, setLoading]);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenus();
    }
  }, [fetchMenus, selectedRestaurant]);

  // Update URL when filters change
  useEffect(() => {
    if (!selectedRestaurant) return;
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    params.set("sortField", sortField);
    params.set("sortDirection", sortDirection);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchQuery, sortField, sortDirection, selectedRestaurant, router]);

  // Sort menus
  const sortedMenus = useMemo(() => {
    if (!menus.length) return [];
    return [...menus].sort((a, b) => {
      // Use unknown type instead of any
      let aValue: unknown = a[sortField as keyof Menu];
      let bValue: unknown = b[sortField as keyof Menu];

      // Handle special sort cases
      if (sortField === "menuSections") {
        aValue = a.menuSections?.length || 0;
        bValue = b.menuSections?.length || 0;
      } else if (sortField === "activeDays") {
        aValue = a.activeDays?.length || 0;
        bValue = b.activeDays?.length || 0;
      }

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numeric comparison
      return sortDirection === "asc"
        ? Number(aValue || 0) - Number(bValue || 0)
        : Number(bValue || 0) - Number(aValue || 0);
    });
  }, [menus, sortField, sortDirection]);

  // Handle sort
  const handleSort = useCallback(
    (field: string) => {
      setSortField(field);
      setSortDirection((prevDirection) =>
        field === sortField && prevDirection === "asc" ? "desc" : "asc"
      );
    },
    [sortField]
  );

  // Handle search input change (debounced)
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.currentTarget.value);
    },
    []
  );

  // Handle view menu
  const handleViewMenu = useCallback((id: string) => {
    setViewMenuId(id);
    setViewModalOpen(true);
  }, []);

  // Handle close view modal
  const handleCloseViewModal = useCallback(() => {
    setViewModalOpen(false);
    setViewMenuId(null);
  }, []);

  // Handle delete
  const handleDeleteMenu = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirmDialog({
        title: t("deleteConfirmTitle"),
        message: t("deleteConfirmMessage", { name }),
      });
      if (confirmed) {
        setLoading(true);
        try {
          const { status } = await deleteMenuService({ id });
          if (status === HTTP_CODES_ENUM.NO_CONTENT) {
            enqueueSnackbar(t("deleteSuccess"), { variant: "success" });
            fetchMenus();
          }
        } catch (error) {
          console.error("Error deleting menu:", error);
          enqueueSnackbar(t("deleteError"), { variant: "error" });
        } finally {
          setLoading(false);
        }
      }
    },
    [
      confirmDialog,
      t,
      setLoading,
      deleteMenuService,
      enqueueSnackbar,
      fetchMenus,
    ]
  );

  if (!selectedRestaurant) {
    return (
      <Center p="xl">
        <Text>{t("noRestaurantSelected")}</Text>
      </Center>
    );
  }

  return (
    <Container size={isMobile ? "100%" : "lg"}>
      {/* Add the preloader component */}
      <MenuDataPreloader menus={menus} />

      <Group justify="space-between" mb="xl">
        <Title order={2}>
          {t("title")}: {selectedRestaurant.name}
        </Title>
        <Button
          component={Link}
          href="/restaurant/menus/create"
          color="green"
          size="compact-sm"
        >
          {t("create")}
        </Button>
      </Group>

      <Stack gap="md">
        {/* Search - removed the button */}
        <TextInput
          placeholder={t("search.placeholder")}
          value={searchQuery}
          onChange={handleSearchChange}
          leftSection={<IconSearch size={16} />}
        />

        {/* Results info */}
        <Group>
          <Text size="sm">
            {loading
              ? t("loading")
              : t("showingResults", { count: sortedMenus.length })}
          </Text>
        </Group>

        {/* Menus Table/Cards */}
        <Paper p="md" withBorder>
          {loading && menus.length === 0 ? (
            <Center p="xl">
              <Loader />
            </Center>
          ) : isMobile ? (
            <MenuCards
              menus={sortedMenus}
              onDelete={handleDeleteMenu}
              onView={handleViewMenu}
              loading={loading}
            />
          ) : (
            <MenuTable
              menus={sortedMenus}
              onDelete={handleDeleteMenu}
              onView={handleViewMenu}
              loading={loading}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </Paper>
      </Stack>

      {/* Menu View Modal */}
      <MenuViewModal
        menuId={viewMenuId}
        restaurantName={selectedRestaurant.name}
        opened={viewModalOpen}
        onClose={handleCloseViewModal}
      />
    </Container>
  );
}

export default MenusPage;
