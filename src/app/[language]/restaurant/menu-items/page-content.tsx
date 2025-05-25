// src/app/[language]/restaurant/menu-items/page-content.tsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container,
  Title,
  Paper,
  Button,
  Text,
  Group,
  Stack,
  Center,
} from "@mantine/core";
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
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { SearchBar } from "@/components/menu-items/SearchBar";
import { FilterPanel } from "@/components/menu-items/FilterPanel";
import { LoadMoreButton } from "@/components/menu-items/LoadMoreButton";
import { ResultsInfo } from "@/components/menu-items/ResultsInfo";
import { useSearchParams, useRouter } from "next/navigation";
import { useCachedMenuItemsWithFilter } from "@/hooks/useCachedMenuItemsWithFilter";

function RestaurantMenuItemsPage() {
  const { t } = useTranslation("admin-panel-menu-items");
  const { isMobile } = useResponsive();
  const { setLoading } = useGlobalLoading();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const deleteMenuItemService = useDeleteMenuItemService();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get URL parameters or use defaults
  const initialSearch = searchParams.get("search") || "";
  const initialAllergies = searchParams.get("allergies")?.split(",") || [];
  const initialIngredients = searchParams.get("ingredients")?.split(",") || [];
  const initialSortField = searchParams.get("sortField") || "menuItemName";
  const initialSortDirection = (searchParams.get("sortDirection") || "asc") as
    | "asc"
    | "desc";
  const initialAllergyExcludeMode =
    searchParams.get("allergyExcludeMode") !== "false"; // Default to true if not explicitly set to false

  // State for filtering and searching
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedAllergies, setSelectedAllergies] =
    useState<string[]>(initialAllergies);
  const [selectedIngredients, setSelectedIngredients] =
    useState<string[]>(initialIngredients);
  const [allergyExcludeMode, setAllergyExcludeMode] = useState<boolean>(
    initialAllergyExcludeMode
  );

  // Memoize query parameters to avoid unnecessary hook re-executions
  const queryParams = useMemo(
    () => ({
      restaurantId: selectedRestaurant?.restaurantId || "",
      searchQuery,
      allergyIds: selectedAllergies,
      ingredientIds: selectedIngredients,
      allergyExcludeMode,
      sortField: initialSortField,
      sortDirection: initialSortDirection,
    }),
    [
      selectedRestaurant?.restaurantId,
      searchQuery,
      selectedAllergies,
      selectedIngredients,
      allergyExcludeMode,
      initialSortField,
      initialSortDirection,
    ]
  );

  // Use the cached data with filtering
  const {
    menuItems,
    allergiesMap,
    isLoading,
    isError,
    totalCount,
    refetch,
    sortField,
    sortDirection,
    handleSort,
    hasMore,
    loadMore,
  } = useCachedMenuItemsWithFilter(queryParams);

  // Update URL when filters change - debounced to reduce state updates
  useEffect(() => {
    if (!selectedRestaurant) return;

    const updateUrlParams = () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedAllergies.length > 0)
        params.set("allergies", selectedAllergies.join(","));
      if (selectedIngredients.length > 0)
        params.set("ingredients", selectedIngredients.join(","));
      params.set("allergyExcludeMode", allergyExcludeMode.toString());
      params.set("sortField", sortField);
      params.set("sortDirection", sortDirection);

      // Use router.replace to update URL without full page reload
      router.replace(`?${params.toString()}`, { scroll: false });
    };

    // Use a timeout to debounce the URL updates
    const timeoutId = setTimeout(updateUrlParams, 300);
    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    selectedAllergies,
    selectedIngredients,
    allergyExcludeMode,
    sortField,
    sortDirection,
    selectedRestaurant,
    router,
  ]);

  // Handle search with debouncing
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback(
    (
      allergies: string[],
      ingredients: string[],
      newAllergyExcludeMode: boolean
    ) => {
      setSelectedAllergies(allergies);
      setSelectedIngredients(ingredients);
      setAllergyExcludeMode(newAllergyExcludeMode);
    },
    []
  );

  // Handle filter reset
  const handleFilterReset = useCallback(() => {
    setSelectedAllergies([]);
    setSelectedIngredients([]);
    setAllergyExcludeMode(true); // Default to exclude mode
  }, []);

  // Handle menu item deletion
  const handleDeleteMenuItem = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirmDialog({
        title: t("deleteConfirmTitle"),
        message: t("deleteConfirmMessage", { name }),
      });

      if (confirmed) {
        setLoading(true);
        try {
          const { status } = await deleteMenuItemService({ id });
          if (status === HTTP_CODES_ENUM.NO_CONTENT) {
            enqueueSnackbar(t("deleteSuccess"), { variant: "success" });
            refetch(); // Refresh the data after delete
          }
        } catch (error) {
          console.error("Error deleting menu item:", error);
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
      deleteMenuItemService,
      enqueueSnackbar,
      refetch,
    ]
  );

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

      <Stack gap="md">
        {/* Search and Filters */}
        <Group align="flex-start" grow>
          <SearchBar
            initialValue={searchQuery}
            onSearch={handleSearch}
            placeholder={t("search.placeholder")}
            disabled={isLoading}
          />
        </Group>

        <FilterPanel
          allergies={allergiesMap}
          selectedAllergies={selectedAllergies}
          selectedIngredients={selectedIngredients}
          allergyExcludeMode={allergyExcludeMode}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          disabled={isLoading}
        />

        {/* Results Information */}
        <ResultsInfo
          totalCount={totalCount}
          displayedCount={menuItems.length}
          searchQuery={searchQuery}
          selectedAllergies={selectedAllergies}
          allergiesMap={allergiesMap}
          selectedIngredients={selectedIngredients}
          allergyExcludeMode={allergyExcludeMode}
          isLoading={isLoading}
        />

        {/* Menu Items Table/Cards */}
        <Paper p="md" withBorder>
          {isError ? (
            <Center p="xl">
              <Text color="red">{t("errorLoading")}</Text>
            </Center>
          ) : isMobile ? (
            <MenuItemCards
              menuItems={menuItems}
              allergiesMap={allergiesMap}
              onDelete={handleDeleteMenuItem}
              loading={isLoading}
            />
          ) : (
            <MenuItemTable
              menuItems={menuItems}
              allergiesMap={allergiesMap}
              onDelete={handleDeleteMenuItem}
              loading={isLoading}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </Paper>

        {/* Load More Button */}
        <LoadMoreButton
          onClick={loadMore}
          hasMore={hasMore}
          isLoading={isLoading}
        />
      </Stack>
    </Container>
  );
}

export default RestaurantMenuItemsPage;
