"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Accordion,
  Container,
  Title,
  Paper,
  Button,
  Text,
  Group,
  Loader,
  Center,
} from "@mantine/core";
import { useGetRestaurantsService } from "@/services/api/services/restaurants";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { useGetAllergiesService } from "@/services/api/services/allergies";
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
import { RoleEnum } from "@/services/api/types/role";
import RouteGuard from "@/services/auth/route-guard";
import { Restaurant } from "@/services/api/types/restaurant";
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";

function IngredientsPage() {
  const { t } = useTranslation("admin-panel-ingredients");
  const { isMobile } = useResponsive();
  const { setLoading } = useGlobalLoading();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [ingredientsByRestaurant, setIngredientsByRestaurant] = useState<{
    [key: string]: Ingredient[];
  }>({});
  const [allergiesMap, setAllergiesMap] = useState<{ [key: string]: string }>(
    {}
  );
  const [subIngredientNames, setSubIngredientNames] = useState<{
    [key: string]: string;
  }>({});
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingData, setLoadingData] = useState<{ [key: string]: boolean }>(
    {}
  );
  const getRestaurantsService = useGetRestaurantsService();
  const getIngredientsService = useGetIngredientsService();
  const getAllergiesService = useGetAllergiesService();
  const deleteIngredientService = useDeleteIngredientService();

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoadingRestaurants(true);
      setLoading(true);
      try {
        const { status, data } = await getRestaurantsService(undefined, {
          page: 1,
          limit: 100, // Assuming reasonable number of restaurants
        });
        if (status === HTTP_CODES_ENUM.OK) {
          // Check if data is an array directly or within the data.data structure
          const restaurantsArray = Array.isArray(data)
            ? data
            : data?.data || [];
          setRestaurants(restaurantsArray);

          // Initialize loading state for each restaurant
          const loadingState: { [key: string]: boolean } = {};
          restaurantsArray.forEach((restaurant: Restaurant) => {
            loadingState[restaurant.restaurantId] = false;
          });
          setLoadingData(loadingState);
        }

        // Load allergies
        const allergiesResult = await getAllergiesService(undefined, {
          page: 1,
          limit: 100, // Assuming reasonable number of allergies
        });
        if (allergiesResult.status === HTTP_CODES_ENUM.OK) {
          // Handle allergies data similarly
          const allergiesArray = Array.isArray(allergiesResult.data)
            ? allergiesResult.data
            : allergiesResult.data?.data || [];

          const allergiesMap: { [key: string]: string } = {};
          allergiesArray.forEach((allergy: Allergy) => {
            allergiesMap[allergy.allergyId] = allergy.allergyName;
          });
          setAllergiesMap(allergiesMap);
        }
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
      } finally {
        setLoadingRestaurants(false);
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [
    getRestaurantsService,
    getAllergiesService,
    setLoading,
    t,
    enqueueSnackbar,
  ]);

  // Function to load ingredients for a specific restaurant
  const loadIngredientsForRestaurant = useCallback(
    async (restaurantId: string) => {
      setLoadingData((prev) => ({ ...prev, [restaurantId]: true }));
      try {
        const { status, data } = await getIngredientsService(undefined, {
          restaurantId,
          page: 1,
          limit: 100, // Assuming reasonable number of ingredients per restaurant
        });
        if (status === HTTP_CODES_ENUM.OK) {
          // Handle data as direct array or nested structure
          const ingredientsArray = Array.isArray(data)
            ? data
            : data?.data || [];

          // Update ingredients for this restaurant
          setIngredientsByRestaurant((prev) => ({
            ...prev,
            [restaurantId]: ingredientsArray,
          }));

          // Build a map of ingredient IDs to names for sub-ingredient display
          const namesMap: { [key: string]: string } = {};
          ingredientsArray.forEach((ingredient: Ingredient) => {
            namesMap[ingredient.ingredientId] = ingredient.ingredientName;
          });
          setSubIngredientNames((prev) => ({
            ...prev,
            ...namesMap,
          }));
        }
      } catch (error) {
        console.error(
          `Error fetching ingredients for restaurant ${restaurantId}:`,
          error
        );
      } finally {
        setLoadingData((prev) => ({ ...prev, [restaurantId]: false }));
      }
    },
    [getIngredientsService]
  );

  // Load ingredients when an accordion item is opened
  const handleAccordionChange = (value: string | null) => {
    if (value && !ingredientsByRestaurant[value]) {
      loadIngredientsForRestaurant(value);
    }
  };

  // Delete ingredient handler
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
          // Update the ingredients list by removing the deleted item
          setIngredientsByRestaurant((prev) => {
            const updated = { ...prev };
            // Find which restaurant this ingredient belongs to
            for (const restaurantId in updated) {
              updated[restaurantId] = updated[restaurantId].filter(
                (ingredient) => ingredient.id !== id
              );
            }
            return updated;
          });
          enqueueSnackbar(t("deleteSuccess"), { variant: "success" });
        }
      } catch (error) {
        console.error("Error deleting ingredient:", error);
        enqueueSnackbar(t("deleteError"), { variant: "error" });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <RouteGuard roles={[RoleEnum.ADMIN, RoleEnum.USER]}>
      <Container size={isMobile ? "100%" : "lg"}>
        <Title order={2} mb="xl">
          {t("title")}
        </Title>
        {loadingRestaurants ? (
          <Center p="xl">
            <Loader size="md" />
          </Center>
        ) : restaurants.length === 0 ? (
          <Paper p="xl" withBorder>
            <Text ta="center">{t("noRestaurants")}</Text>
          </Paper>
        ) : (
          <Accordion onChange={handleAccordionChange} variant="separated">
            {restaurants.map((restaurant) => (
              <Accordion.Item
                key={restaurant.restaurantId}
                value={restaurant.restaurantId}
              >
                <Accordion.Control>
                  <Group justify="space-between">
                    <Title order={4}>{restaurant.name}</Title>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Group justify="flex-end" mb="md">
                    <Button
                      component={Link}
                      href={`/admin-panel/ingredients/create/${restaurant.restaurantId}`}
                      size="compact-sm"
                      color="green"
                    >
                      {t("create")}
                    </Button>
                  </Group>
                  <Paper p="md" withBorder>
                    {loadingData[restaurant.restaurantId] ? (
                      <Center p="md">
                        <Loader size="sm" />
                      </Center>
                    ) : isMobile ? (
                      <IngredientCards
                        ingredients={
                          ingredientsByRestaurant[restaurant.restaurantId] || []
                        }
                        allergies={allergiesMap}
                        subIngredientNames={subIngredientNames}
                        onDelete={handleDeleteIngredient}
                      />
                    ) : (
                      <IngredientTable
                        ingredients={
                          ingredientsByRestaurant[restaurant.restaurantId] || []
                        }
                        allergies={allergiesMap}
                        subIngredientNames={subIngredientNames}
                        onDelete={handleDeleteIngredient}
                      />
                    )}
                  </Paper>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Container>
    </RouteGuard>
  );
}

export default IngredientsPage;
