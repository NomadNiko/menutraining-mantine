// src/app/[language]/restaurant/menu-sections/page-content.tsx
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
import { MenuSectionTable } from "@/components/menu-sections/MenuSectionTable";
import { MenuSectionCards } from "@/components/menu-sections/MenuSectionCards";
import { MenuSectionViewModal } from "@/components/menu-sections/MenuSectionViewModal";
import useGlobalLoading from "@/services/loading/use-global-loading";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import {
  useDeleteMenuSectionService,
  useGetMenuSectionsService,
} from "@/services/api/services/menu-sections";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useSearchParams, useRouter } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";
import { MenuSection } from "@/services/api/types/menu-section";
import { useEffect } from "react";
import { MenuSectionDataPreloader } from "@/components/menu-sections/MenuSectionDataPreloader";

function MenuSectionsPage() {
  const { t } = useTranslation("restaurant-menu-sections");
  const { isMobile } = useResponsive();
  const { setLoading } = useGlobalLoading();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const deleteMenuSectionService = useDeleteMenuSectionService();
  const getMenuSectionsService = useGetMenuSectionsService();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get URL parameters or use defaults
  const initialSearch = searchParams.get("search") || "";
  const initialSortField = searchParams.get("sortField") || "title";
  const initialSortDirection = (searchParams.get("sortDirection") || "asc") as
    | "asc"
    | "desc";

  // State for filtering and sorting
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [loading, setLocalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortField, setSortField] = useState(initialSortField);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);

  // State for the view modal
  const [viewSectionId, setViewSectionId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch menu sections
  const fetchMenuSections = useCallback(async () => {
    if (!selectedRestaurant) return;
    setLocalLoading(true);
    setLoading(true);
    try {
      const { status, data } = await getMenuSectionsService(undefined, {
        restaurantId: selectedRestaurant.restaurantId,
        title: searchQuery || undefined,
        limit: 100,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        const sectionsData = Array.isArray(data) ? data : data?.data || [];
        setMenuSections(sectionsData);
      }
    } catch (error) {
      console.error("Error fetching menu sections:", error);
      setMenuSections([]);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [getMenuSectionsService, selectedRestaurant, searchQuery, setLoading]);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuSections();
    }
  }, [fetchMenuSections, selectedRestaurant]);

  // Update URL when filters change
  useEffect(() => {
    if (!selectedRestaurant) return;
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    params.set("sortField", sortField);
    params.set("sortDirection", sortDirection);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchQuery, sortField, sortDirection, selectedRestaurant, router]);

  // Sort menu sections
  const sortedMenuSections = useMemo(() => {
    if (!menuSections.length) return [];
    return [...menuSections].sort((a, b) => {
      let aValue: string | number | undefined = a[
        sortField as keyof MenuSection
      ] as string | number;
      let bValue: string | number | undefined = b[
        sortField as keyof MenuSection
      ] as string | number;

      // Handle special sort cases
      if (sortField === "items") {
        aValue = a.items?.length || 0;
        bValue = b.items?.length || 0;
      }

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numeric comparison
      const numA = Number(aValue || 0);
      const numB = Number(bValue || 0);
      return sortDirection === "asc" ? numA - numB : numB - numA;
    });
  }, [menuSections, sortField, sortDirection]);

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

  // Handle view section
  const handleViewSection = useCallback((id: string) => {
    setViewSectionId(id);
    setViewModalOpen(true);
  }, []);

  // Handle close view modal
  const handleCloseViewModal = useCallback(() => {
    setViewModalOpen(false);
    setViewSectionId(null);
  }, []);

  // Handle delete
  const handleDeleteMenuSection = useCallback(
    async (id: string, title: string) => {
      const confirmed = await confirmDialog({
        title: t("deleteConfirmTitle"),
        message: t("deleteConfirmMessage", { title }),
      });
      if (confirmed) {
        setLoading(true);
        try {
          const { status } = await deleteMenuSectionService({ id });
          if (status === HTTP_CODES_ENUM.NO_CONTENT) {
            enqueueSnackbar(t("deleteSuccess"), { variant: "success" });
            fetchMenuSections();
          }
        } catch (error) {
          console.error("Error deleting menu section:", error);
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
      deleteMenuSectionService,
      enqueueSnackbar,
      fetchMenuSections,
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
      <MenuSectionDataPreloader menuSections={menuSections} />

      <Group justify="space-between" mb="xl">
        <Title order={2}>
          {t("title")}: {selectedRestaurant.name}
        </Title>
        <Button
          component={Link}
          href="/restaurant/menu-sections/create"
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
              : t("showingResults", { count: sortedMenuSections.length })}
          </Text>
        </Group>

        {/* Menu Sections Table/Cards */}
        <Paper p="md" withBorder>
          {loading && menuSections.length === 0 ? (
            <Center p="xl">
              <Loader />
            </Center>
          ) : isMobile ? (
            <MenuSectionCards
              menuSections={sortedMenuSections}
              onDelete={handleDeleteMenuSection}
              onView={handleViewSection}
              loading={loading}
            />
          ) : (
            <MenuSectionTable
              menuSections={sortedMenuSections}
              onDelete={handleDeleteMenuSection}
              onView={handleViewSection}
              loading={loading}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </Paper>
      </Stack>

      {/* Menu Section View Modal */}
      <MenuSectionViewModal
        sectionId={viewSectionId}
        restaurantName={selectedRestaurant.name}
        opened={viewModalOpen}
        onClose={handleCloseViewModal}
      />
    </Container>
  );
}

export default MenuSectionsPage;
