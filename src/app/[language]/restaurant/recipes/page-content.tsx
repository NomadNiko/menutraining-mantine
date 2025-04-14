// src/app/[language]/restaurant/recipes/page-content.tsx
"use client";
import { useState, useCallback, useEffect } from "react";
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
  Grid,
  RangeSlider,
  MultiSelect,
} from "@mantine/core";
import { useResponsive } from "@/services/responsive/use-responsive";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import { RecipeTable } from "@/components/recipes/RecipeTable";
import { RecipeCards } from "@/components/recipes/RecipeCards";
import { RecipeViewModal } from "@/components/recipes/RecipeViewModal";
import useGlobalLoading from "@/services/loading/use-global-loading";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import { useDeleteRecipeService } from "@/services/api/services/recipes";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useSearchParams, useRouter } from "next/navigation";
import { IconSearch, IconClock, IconFilter } from "@tabler/icons-react";
import { useRecipesWithClientSideSort } from "@/hooks/useRecipesWithClientSideSort";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { useGetEquipmentService } from "@/services/api/services/equipment";
import { Ingredient } from "@/services/api/types/ingredient";
import { Equipment } from "@/services/api/types/equipment";
import { RecipeDataPreloader } from "@/components/recipes/RecipeDataPreloader";

function RecipesPage() {
  const { t } = useTranslation("restaurant-recipes");
  const { isMobile } = useResponsive();
  const { setLoading } = useGlobalLoading();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();
  const deleteRecipeService = useDeleteRecipeService();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get URL parameters or use defaults
  const initialSearch = searchParams.get("search") || "";
  const initialIngredients = searchParams.get("ingredients")
    ? searchParams.get("ingredients")!.split(",")
    : [];
  const initialEquipment = searchParams.get("equipment")
    ? searchParams.get("equipment")!.split(",")
    : [];
  const initialMaxPrepTime = searchParams.get("maxPrepTime")
    ? parseInt(searchParams.get("maxPrepTime")!)
    : 60;
  const initialSortField = searchParams.get("sortField") || "recipeName";
  const initialSortDirection = (searchParams.get("sortDirection") || "asc") as
    | "asc"
    | "desc";

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedIngredients, setSelectedIngredients] =
    useState<string[]>(initialIngredients);
  const [selectedEquipment, setSelectedEquipment] =
    useState<string[]>(initialEquipment);
  const [maxPrepTime, setMaxPrepTime] = useState(initialMaxPrepTime);
  const [showFilters, setShowFilters] = useState(false);

  // State for the view modal
  const [viewRecipeId, setViewRecipeId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Data for filter dropdowns
  const [ingredientOptions, setIngredientOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [equipmentOptions, setEquipmentOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Services for ingredient and equipment data
  const getIngredientsService = useGetIngredientsService();
  const getEquipmentService = useGetEquipmentService();

  // Fetch recipe data with sorting and filtering
  const {
    recipes,
    isLoading,
    sortField,
    sortDirection,
    handleSort,
    hasMore,
    loadMore,
    refetch,
  } = useRecipesWithClientSideSort({
    restaurantId: selectedRestaurant?.restaurantId || "",
    searchQuery,
    ingredientIds:
      selectedIngredients.length > 0 ? selectedIngredients : undefined,
    equipmentIds: selectedEquipment.length > 0 ? selectedEquipment : undefined,
    maxPrepTime,
    sortField: initialSortField,
    sortDirection: initialSortDirection,
  });

  // Fetch ingredients and equipment for filters
  const loadFilterOptions = useCallback(async () => {
    if (!selectedRestaurant) return;

    try {
      // Load ingredients
      const { status: ingStatus, data: ingData } = await getIngredientsService(
        undefined,
        { restaurantId: selectedRestaurant.restaurantId, limit: 100 }
      );

      if (ingStatus === HTTP_CODES_ENUM.OK) {
        const ingredients = Array.isArray(ingData)
          ? ingData
          : ingData?.data || [];
        setIngredientOptions(
          ingredients.map((ing: Ingredient) => ({
            value: ing.ingredientId,
            label: ing.ingredientName,
          }))
        );
      }

      // Load equipment
      const { status: eqStatus, data: eqData } = await getEquipmentService(
        undefined,
        { page: 1, limit: 100 }
      );

      if (eqStatus === HTTP_CODES_ENUM.OK) {
        const equipment = Array.isArray(eqData) ? eqData : eqData?.data || [];
        setEquipmentOptions(
          equipment.map((eq: Equipment) => ({
            value: eq.equipmentId,
            label: eq.equipmentName,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  }, [selectedRestaurant, getIngredientsService, getEquipmentService]);

  // Load filter options on component mount
  useState(() => {
    if (selectedRestaurant) {
      loadFilterOptions();
    }
  });

  // Update URL when filters change
  useEffect(() => {
    if (!selectedRestaurant) return;

    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedIngredients.length > 0)
      params.set("ingredients", selectedIngredients.join(","));
    if (selectedEquipment.length > 0)
      params.set("equipment", selectedEquipment.join(","));
    params.set("maxPrepTime", maxPrepTime.toString());
    params.set("sortField", sortField);
    params.set("sortDirection", sortDirection);

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [
    searchQuery,
    selectedIngredients,
    selectedEquipment,
    maxPrepTime,
    sortField,
    sortDirection,
    selectedRestaurant,
    router,
  ]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.currentTarget.value);
    },
    []
  );

  // Handle view recipe
  const handleViewRecipe = useCallback((id: string) => {
    setViewRecipeId(id);
    setViewModalOpen(true);
  }, []);

  // Handle close view modal
  const handleCloseViewModal = useCallback(() => {
    setViewModalOpen(false);
    setViewRecipeId(null);
  }, []);

  // Handle delete
  const handleDeleteRecipe = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirmDialog({
        title: t("deleteConfirmTitle"),
        message: t("deleteConfirmMessage", { name }),
      });

      if (confirmed) {
        setLoading(true);
        try {
          const { status } = await deleteRecipeService({ id });
          if (status === HTTP_CODES_ENUM.NO_CONTENT) {
            enqueueSnackbar(t("deleteSuccess"), { variant: "success" });
            refetch();
          }
        } catch (error) {
          console.error("Error deleting recipe:", error);
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
      deleteRecipeService,
      enqueueSnackbar,
      refetch,
    ]
  );

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

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
      <RecipeDataPreloader recipes={recipes} />

      <Group justify="space-between" mb="xl">
        <Title order={2}>
          {t("title")}: {selectedRestaurant.name}
        </Title>
        <Button
          component={Link}
          href="/restaurant/recipes/create"
          color="green"
          size="compact-sm"
        >
          {t("create")}
        </Button>
      </Group>

      <Stack gap="md">
        {/* Search bar */}
        <Group>
          <TextInput
            placeholder={t("search.placeholder")}
            value={searchQuery}
            onChange={handleSearchChange}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
          <Button
            variant="light"
            leftSection={<IconFilter size={16} />}
            onClick={toggleFilters}
          >
            {t("filter")}
          </Button>
        </Group>

        {/* Expanded filters */}
        {showFilters && (
          <Paper p="md" withBorder>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack>
                  <Text fw={500}>{t("filters.ingredients")}</Text>
                  <MultiSelect
                    data={ingredientOptions}
                    value={selectedIngredients}
                    onChange={setSelectedIngredients}
                    placeholder={t("filters.selectIngredients")}
                    searchable
                    clearable
                  />
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack>
                  <Text fw={500}>{t("filters.equipment")}</Text>
                  <MultiSelect
                    data={equipmentOptions}
                    value={selectedEquipment}
                    onChange={setSelectedEquipment}
                    placeholder={t("filters.selectEquipment")}
                    searchable
                    clearable
                  />
                </Stack>
              </Grid.Col>

              <Grid.Col span={12}>
                <Stack>
                  <Group justify="space-between">
                    <Text fw={500}>{t("filters.maxPrepTime")}</Text>
                    <Text>
                      {maxPrepTime} {t("minutes")}
                    </Text>
                  </Group>
                  <Group align="center">
                    <IconClock size={16} />
                    <RangeSlider
                      value={[0, maxPrepTime]}
                      onChange={(value) => setMaxPrepTime(value[1])}
                      min={0}
                      max={180}
                      step={5}
                      style={{ flex: 1 }}
                      minRange={5}
                      label={(value) => `${value} ${t("minutes")}`}
                    />
                  </Group>
                </Stack>
              </Grid.Col>

              <Grid.Col span={12}>
                <Group justify="flex-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedIngredients([]);
                      setSelectedEquipment([]);
                      setMaxPrepTime(60);
                      setSearchQuery("");
                    }}
                  >
                    {t("filters.reset")}
                  </Button>
                </Group>
              </Grid.Col>
            </Grid>
          </Paper>
        )}

        {/* Results info */}
        <Group>
          <Text size="sm">
            {isLoading
              ? t("loading")
              : t("showingResults", { count: recipes.length })}
          </Text>
        </Group>

        {/* Recipes Table/Cards */}
        <Paper p="md" withBorder>
          {isLoading && recipes.length === 0 ? (
            <Center p="xl">
              <Loader />
            </Center>
          ) : isMobile ? (
            <RecipeCards
              recipes={recipes}
              onDelete={handleDeleteRecipe}
              onView={handleViewRecipe}
              loading={isLoading}
            />
          ) : (
            <RecipeTable
              recipes={recipes}
              onDelete={handleDeleteRecipe}
              onView={handleViewRecipe}
              loading={isLoading}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}

          {hasMore && (
            <Group justify="center" mt="md">
              <Button onClick={loadMore} disabled={isLoading}>
                {t("loadMore")}
              </Button>
            </Group>
          )}
        </Paper>
      </Stack>

      {/* Recipe View Modal */}
      <RecipeViewModal
        recipeId={viewRecipeId}
        restaurantName={selectedRestaurant.name}
        opened={viewModalOpen}
        onClose={handleCloseViewModal}
      />
    </Container>
  );
}

export default RecipesPage;
