// src/app/[language]/admin-panel/menu-items/page-content.tsx
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
import { useGetMenuItemsService } from "@/services/api/services/menu-items";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { useGetAllergiesService } from "@/services/api/services/allergies";
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
import { RoleEnum } from "@/services/api/types/role";
import RouteGuard from "@/services/auth/route-guard";
import { Restaurant } from "@/services/api/types/restaurant";
import { MenuItem } from "@/services/api/types/menu-item";
import { Allergy } from "@/services/api/types/allergy";
import { Ingredient } from "@/services/api/types/ingredient";
import removeDuplicatesFromArrayObjects from "@/services/helpers/remove-duplicates-from-array-of-objects";

function MenuItemsPage() {
  const { t } = useTranslation("admin-panel-menu-items");
  const { isMobile } = useResponsive();
  const { setLoading } = useGlobalLoading();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItemsByRestaurant, setMenuItemsByRestaurant] = useState<{
    [key: string]: MenuItem[];
  }>({});
  const [ingredientsMap, setIngredientsMap] = useState<{
    [key: string]: string;
  }>({});
  const [allergiesMap, setAllergiesMap] = useState<{ [key: string]: string }>(
    {}
  );
  const [ingredientDetails, setIngredientDetails] = useState<{
    [key: string]: Ingredient;
  }>({});
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingData, setLoadingData] = useState<{ [key: string]: boolean }>(
    {}
  );

  const getRestaurantsService = useGetRestaurantsService();
  const getMenuItemsService = useGetMenuItemsService();
  const getIngredientsService = useGetIngredientsService();
  const getAllergiesService = useGetAllergiesService();
  const deleteMenuItemService = useDeleteMenuItemService();

  // Fetch restaurants, ingredients, and allergies
  useEffect(() => {
    const fetchData = async () => {
      setLoadingRestaurants(true);
      setLoading(true);
      try {
        // Fetch restaurants
        const { status, data } = await getRestaurantsService(undefined, {
          page: 1,
          limit: 100,
        });

        if (status === HTTP_CODES_ENUM.OK) {
          const restaurantsArray = Array.isArray(data)
            ? data
            : data?.data || [];
          setRestaurants(restaurantsArray);

          const loadingState: { [key: string]: boolean } = {};
          restaurantsArray.forEach((restaurant: Restaurant) => {
            loadingState[restaurant.restaurantId] = false;
          });
          setLoadingData(loadingState);
        }

        // Fetch ingredients to map IDs to ingredients details
        const ingredientsResult = await getIngredientsService(undefined, {
          page: 1,
          limit: 500, // Increased limit to get more ingredients
        });

        if (ingredientsResult.status === HTTP_CODES_ENUM.OK) {
          const ingredientsArray = Array.isArray(ingredientsResult.data)
            ? ingredientsResult.data
            : ingredientsResult.data?.data || [];

          const ingredientsMap: { [key: string]: string } = {};
          const ingredientDetailsMap: { [key: string]: Ingredient } = {};

          ingredientsArray.forEach((ingredient: Ingredient) => {
            ingredientsMap[ingredient.ingredientId] = ingredient.ingredientName;
            ingredientDetailsMap[ingredient.ingredientId] = ingredient;
          });

          setIngredientsMap(ingredientsMap);
          setIngredientDetails(ingredientDetailsMap);
        }

        // Fetch allergies to map IDs to names
        const allergiesResult = await getAllergiesService(undefined, {
          page: 1,
          limit: 100,
        });

        if (allergiesResult.status === HTTP_CODES_ENUM.OK) {
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
        console.error("Error fetching data:", error);
        enqueueSnackbar(t("fetchError"), { variant: "error" });
      } finally {
        setLoadingRestaurants(false);
        setLoading(false);
      }
    };

    fetchData();
  }, [
    getRestaurantsService,
    getIngredientsService,
    getAllergiesService,
    setLoading,
    t,
    enqueueSnackbar,
  ]);

  // Load menu items for a specific restaurant
  const loadMenuItemsForRestaurant = useCallback(
    async (restaurantId: string) => {
      setLoadingData((prev) => ({ ...prev, [restaurantId]: true }));

      try {
        const { status, data } = await getMenuItemsService(undefined, {
          restaurantId,
          page: 1,
          limit: 100,
        });

        if (status === HTTP_CODES_ENUM.OK) {
          const menuItemsArray = Array.isArray(data) ? data : data?.data || [];
          setMenuItemsByRestaurant((prev) => ({
            ...prev,
            [restaurantId]: menuItemsArray,
          }));
        }
      } catch (error) {
        console.error(
          `Error fetching menu items for restaurant ${restaurantId}:`,
          error
        );
      } finally {
        setLoadingData((prev) => ({ ...prev, [restaurantId]: false }));
      }
    },
    [getMenuItemsService]
  );

  // Helper function to get all allergies for a menu item
  const getMenuItemAllergies = useCallback(
    (menuItem: MenuItem) => {
      // Get unique allergies from all ingredients in this menu item
      const allergies: { id: string; name: string }[] = [];

      menuItem.menuItemIngredients.forEach((ingredientId) => {
        const ingredient = ingredientDetails[ingredientId];
        if (ingredient && ingredient.ingredientAllergies) {
          ingredient.ingredientAllergies.forEach((allergyId) => {
            if (allergiesMap[allergyId]) {
              allergies.push({
                id: allergyId,
                name: allergiesMap[allergyId],
              });
            }
          });
        }
      });

      // Remove duplicates
      return removeDuplicatesFromArrayObjects(allergies, "id");
    },
    [ingredientDetails, allergiesMap]
  );

  // Load menu items when an accordion item is opened
  const handleAccordionChange = (value: string | null) => {
    if (value && !menuItemsByRestaurant[value]) {
      loadMenuItemsForRestaurant(value);
    }
  };

  // Delete menu item handler
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
          setMenuItemsByRestaurant((prev) => {
            const updated = { ...prev };
            for (const restaurantId in updated) {
              updated[restaurantId] = updated[restaurantId].filter(
                (menuItem) => menuItem.id !== id
              );
            }
            return updated;
          });
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
                      href={`/admin-panel/menu-items/create/${restaurant.restaurantId}`}
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
                      <MenuItemCards
                        menuItems={
                          menuItemsByRestaurant[restaurant.restaurantId] || []
                        }
                        ingredients={ingredientsMap}
                        getMenuItemAllergies={getMenuItemAllergies}
                        onDelete={handleDeleteMenuItem}
                      />
                    ) : (
                      <MenuItemTable
                        menuItems={
                          menuItemsByRestaurant[restaurant.restaurantId] || []
                        }
                        ingredients={ingredientsMap}
                        getMenuItemAllergies={getMenuItemAllergies}
                        onDelete={handleDeleteMenuItem}
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

export default MenuItemsPage;
