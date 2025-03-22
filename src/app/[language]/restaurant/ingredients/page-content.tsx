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
import { Ingredient } from "@/services/api/types/ingredient";
import { Allergy } from "@/services/api/types/allergy";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";

function RestaurantIngredientsPage() {
  const { t } = useTranslation("admin-panel-ingredients");
  const { isMobile } = useResponsive();
  const { setLoading } = useGlobalLoading();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedRestaurant } = useSelectedRestaurant();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allergiesMap, setAllergiesMap] = useState<{ [key: string]: string }>(
    {}
  );
  const [subIngredientNames, setSubIngredientNames] = useState<{
    [key: string]: string;
  }>({});
  const [loading, setLocalLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const getIngredientsService = useGetIngredientsService();
  const getAllergiesService = useGetAllergiesService();
  const deleteIngredientService = useDeleteIngredientService();

  // Fetch ingredients for the selected restaurant
  const fetchIngredients = useCallback(async () => {
    if (!selectedRestaurant) return;

    setLocalLoading(true);
    setLoading(true);
    try {
      const { status, data } = await getIngredientsService(undefined, {
        restaurantId: selectedRestaurant.restaurantId,
        page,
        limit: 10,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        const ingredientsArray = Array.isArray(data) ? data : data?.data || [];
        setIngredients((prevIngredients) =>
          page === 1
            ? ingredientsArray
            : [...prevIngredients, ...ingredientsArray]
        );
        setHasMore(ingredientsArray.length === 10);

        // Build sub-ingredient names map
        const namesMap: { [key: string]: string } = {};
        ingredientsArray.forEach((ingredient: Ingredient) => {
          namesMap[ingredient.ingredientId] = ingredient.ingredientName;
        });
        setSubIngredientNames((prev) => ({
          ...prev,
          ...namesMap,
        }));
      }

      // Fetch allergies if this is the first page
      if (page === 1) {
        const allergiesResult = await getAllergiesService(undefined, {
          page: 1,
          limit: 100,
        });

        if (allergiesResult.status === HTTP_CODES_ENUM.OK) {
          const allergiesArray = Array.isArray(allergiesResult.data)
            ? allergiesResult.data
            : allergiesResult.data?.data || [];

          const allergyMap: { [key: string]: string } = {};
          allergiesArray.forEach((allergy: Allergy) => {
            allergyMap[allergy.allergyId] = allergy.allergyName;
          });
          setAllergiesMap(allergyMap);
        }
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      enqueueSnackbar(t("fetchError"), { variant: "error" });
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [
    selectedRestaurant,
    page,
    getIngredientsService,
    getAllergiesService,
    setLoading,
    t,
    enqueueSnackbar,
  ]);

  // Load data when restaurant changes or page changes
  useEffect(() => {
    if (selectedRestaurant) {
      fetchIngredients();
    }
  }, [fetchIngredients, selectedRestaurant]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
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
          setIngredients((prevIngredients) =>
            prevIngredients.filter((ingredient) => ingredient.id !== id)
          );
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

      <Paper p="md" withBorder>
        {loading && ingredients.length === 0 ? (
          <Center p="xl">
            <Loader size="md" />
          </Center>
        ) : isMobile ? (
          <IngredientCards
            ingredients={ingredients}
            allergies={allergiesMap}
            subIngredientNames={subIngredientNames}
            onDelete={handleDeleteIngredient}
            handleLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={loading}
          />
        ) : (
          <>
            <IngredientTable
              ingredients={ingredients}
              allergies={allergiesMap}
              subIngredientNames={subIngredientNames}
              onDelete={handleDeleteIngredient}
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

export default RestaurantIngredientsPage;
