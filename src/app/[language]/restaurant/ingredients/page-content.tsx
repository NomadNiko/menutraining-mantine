"use client";
import { useState, useEffect } from "react";
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
// Import components
import { SearchBar } from "@/components/ingredients/SearchBar";
import { FilterPanel } from "@/components/ingredients/FilterPanel";
import { PaginationControls } from "@/components/ingredients/PaginationControls";
import { ResultsInfo } from "@/components/ingredients/ResultsInfo";
import { useSearchParams, useRouter } from "next/navigation";
import { useIngredientsWithClientSideSort } from "@/hooks/useIngredientsWithClientSideSort";

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
  const initialPage = Number(searchParams.get("page") || "1");
  const initialPageSize = Number(searchParams.get("limit") || "10");
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

  // State for filtering, pagination, and sorting
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
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

  // Use the new client-side sorting hook
  const {
    ingredients,
    allergiesMap,
    subIngredientNames,
    isLoading,
    isError,
    totalCount,
    totalPages,
    refetch,
    sortField,
    sortDirection,
    handleSort,
  } = useIngredientsWithClientSideSort({
    restaurantId: selectedRestaurant?.restaurantId || "",
    page,
    pageSize,
    searchQuery,
    allergyIds: selectedAllergies,
    allergyExcludeMode,
    categoryIds: selectedCategories,
    categoryExcludeMode,
    hasSubIngredients,
    sortField: initialSortField,
    sortDirection: initialSortDirection,
  });

  // Update URL when filters change
  useEffect(() => {
    if (!selectedRestaurant) return;

    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", pageSize.toString());
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
  }, [
    page,
    pageSize,
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  };

  // Handle filter change
  const handleFilterChange = (
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
    setPage(1); // Reset to first page when filtering
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setSelectedAllergies([]);
    setHasSubIngredients(null);
    setAllergyExcludeMode(true); // Default to exclude mode
    setSelectedCategories([]);
    setCategoryExcludeMode(true); // Default to exclude mode
    setPage(1); // Reset to first page when clearing filters
  };

  // Handle ingredient deletion
  const handleDeleteIngredient = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: t("deleteConfirmTitle"),
      message: t("deleteConfirmMessage", { name }),
    });

    if (confirmed) {
      setLoading(true);
      try {
        const { status } = await deleteIngredientService({ id });
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
          href="/restaurant/ingredients/create"
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
          currentPage={page}
          pageSize={pageSize}
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
              subIngredientNames={subIngredientNames}
              onDelete={handleDeleteIngredient}
              loading={isLoading}
            />
          ) : (
            <IngredientTable
              ingredients={ingredients}
              allergies={allergiesMap}
              subIngredientNames={subIngredientNames}
              onDelete={handleDeleteIngredient}
              loading={isLoading}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </Paper>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          disabled={isLoading || totalCount === 0}
        />
      </Stack>
    </Container>
  );
}

export default RestaurantIngredientsPage;
