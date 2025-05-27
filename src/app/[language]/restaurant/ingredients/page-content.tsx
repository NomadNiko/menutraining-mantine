// src/app/[language]/restaurant/ingredients/page-content.tsx
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
import IngredientTable from "@/components/ingredients/IngredientTable";
import { IngredientCards } from "@/components/ingredients/IngredientCards";
import useGlobalLoading from "@/services/loading/use-global-loading";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import { useDeleteIngredientService } from "@/services/api/services/ingredients";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import RouteGuard from "@/services/auth/route-guard";
import { RoleEnum } from "@/services/api/types/role";

// Import components
import { SearchBar } from "@/components/ingredients/SearchBar";
import { FilterPanel } from "@/components/ingredients/FilterPanel";
import { LoadMoreButton } from "@/components/ingredients/LoadMoreButton";
import { ResultsInfo } from "@/components/ingredients/ResultsInfo";
import { useSearchParams, useRouter } from "next/navigation";
import { useCachedIngredientsWithFilter } from "@/hooks/useCachedIngredientsWithFilter";
import { useRestaurantDataCache } from "@/services/restaurant/restaurant-data-cache";

function RestaurantIngredientsPage() {
  const { t } = useTranslation("admin-panel-ingredients");
  const { isMobile } = useResponsive();
  const { setLoading } = useGlobalLoading();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const deleteIngredientService = useDeleteIngredientService();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get URL parameters or use defaults
  const initialSearch = searchParams.get("search") || "";
  const initialAllergies = searchParams.get("allergies")?.split(",") || [];
  const initialHasSubIngredients = searchParams.get("hasSubIngredients")
    ? searchParams.get("hasSubIngredients") === "true"
    : null;
  const initialCategories = searchParams.get("categories")?.split(",") || [];
  const initialSortField = searchParams.get("sortField") || "ingredientName";
  const initialSortDirection = (searchParams.get("sortDirection") || "asc") as
    | "asc"
    | "desc";
  const initialAllergyExcludeMode =
    searchParams.get("allergyExcludeMode") !== "false"; // Default to true if not explicitly set to false
  const initialCategoryExcludeMode =
    searchParams.get("categoryExcludeMode") !== "false"; // Default to true if not explicitly set to false

  // State for filtering and searching
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedAllergies, setSelectedAllergies] =
    useState<string[]>(initialAllergies);
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories);
  const [hasSubIngredients, setHasSubIngredients] = useState<boolean | null>(
    initialHasSubIngredients
  );
  const [allergyExcludeMode, setAllergyExcludeMode] = useState<boolean>(
    initialAllergyExcludeMode
  );
  const [categoryExcludeMode, setCategoryExcludeMode] = useState<boolean>(
    initialCategoryExcludeMode
  );

  // Memoize query parameters to avoid unnecessary hook re-executions
  const queryParams = useMemo(
    () => ({
      restaurantId: selectedRestaurant?.restaurantId || "",
      searchQuery,
      allergyIds: selectedAllergies,
      allergyExcludeMode,
      categoryIds: selectedCategories,
      categoryExcludeMode,
      hasSubIngredients,
      sortField: initialSortField,
      sortDirection: initialSortDirection,
    }),
    [
      selectedRestaurant?.restaurantId,
      searchQuery,
      selectedAllergies,
      allergyExcludeMode,
      selectedCategories,
      categoryExcludeMode,
      hasSubIngredients,
      initialSortField,
      initialSortDirection,
    ]
  );

  // Use the cached data with client-side filtering and sorting
  const {
    ingredients,
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
  } = useCachedIngredientsWithFilter(queryParams);

  // Get cache status
  const {} = useRestaurantDataCache();

  // Update URL when filters change - debounced to reduce state updates
  useEffect(() => {
    if (!selectedRestaurant) return;
    const updateUrlParams = () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedAllergies.length > 0)
        params.set("allergies", selectedAllergies.join(","));
      if (selectedCategories.length > 0)
        params.set("categories", selectedCategories.join(","));
      if (hasSubIngredients !== null)
        params.set("hasSubIngredients", hasSubIngredients.toString());
      params.set("allergyExcludeMode", allergyExcludeMode.toString());
      params.set("categoryExcludeMode", categoryExcludeMode.toString());
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
    selectedCategories,
    hasSubIngredients,
    allergyExcludeMode,
    categoryExcludeMode,
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
      subIngredients: boolean | null,
      newAllergyExcludeMode: boolean,
      categories: string[],
      newCategoryExcludeMode: boolean
    ) => {
      setSelectedAllergies(allergies);
      setHasSubIngredients(subIngredients);
      setAllergyExcludeMode(newAllergyExcludeMode);
      setSelectedCategories(categories);
      setCategoryExcludeMode(newCategoryExcludeMode);
    },
    []
  );

  // Handle filter reset
  const handleFilterReset = useCallback(() => {
    setSelectedAllergies([]);
    setHasSubIngredients(null);
    setAllergyExcludeMode(true); // Default to exclude mode
    setSelectedCategories([]);
    setCategoryExcludeMode(true); // Default to exclude mode
  }, []);

  // Handle ingredient deletion
  const handleDeleteIngredient = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirmDialog({
        title: t("deleteConfirmTitle"),
        message: t("deleteConfirmMessage", { name }),
      });
      if (confirmed) {
        setLoading(true);
        try {
          const { status } = await deleteIngredientService({
            ingredientId: id,
          });
          if (status === HTTP_CODES_ENUM.NO_CONTENT) {
            enqueueSnackbar(t("deleteSuccess"), { variant: "success" });
            refetch(); // Refresh the data after delete
          }
        } catch (error) {
          console.error("Error deleting ingredient:", error);
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
      deleteIngredientService,
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
    <RouteGuard roles={[RoleEnum.ADMIN, RoleEnum.USER]}>
      <Container size={isMobile ? "100%" : "lg"}>
        <Group justify="space-between" mb="xl">
          <Title order={2}>
            {t("title")}: {selectedRestaurant.name}
          </Title>
          <Button
            component={Link}
            href="/restaurant/ingredients/create"
            color="green"
            size="compact-sm"
            data-testid="create-ingredient-button"
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
            hasSubIngredients={hasSubIngredients}
            allergyExcludeMode={allergyExcludeMode}
            selectedCategories={selectedCategories}
            categoryExcludeMode={categoryExcludeMode}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            disabled={isLoading}
          />
          {/* Results Information */}
          <ResultsInfo
            totalCount={totalCount}
            displayedCount={ingredients.length}
            searchQuery={searchQuery}
            selectedAllergies={selectedAllergies}
            allergiesMap={allergiesMap}
            hasSubIngredients={hasSubIngredients}
            allergyExcludeMode={allergyExcludeMode}
            selectedCategories={selectedCategories}
            categoryExcludeMode={categoryExcludeMode}
            isLoading={isLoading}
          />
          {/* Ingredients Table/Cards */}
          <Paper p="md" withBorder>
            {isError ? (
              <Center p="xl">
                <Text color="red">{t("errorLoading")}</Text>
              </Center>
            ) : isMobile ? (
              <IngredientCards
                ingredients={ingredients}
                allergies={allergiesMap}
                onDelete={handleDeleteIngredient}
                loading={isLoading}
              />
            ) : (
              <IngredientTable
                ingredients={ingredients}
                allergies={allergiesMap}
                onDelete={handleDeleteIngredient}
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
    </RouteGuard>
  );
}

export default RestaurantIngredientsPage;
