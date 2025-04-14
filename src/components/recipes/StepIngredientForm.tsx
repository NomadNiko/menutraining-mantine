// src/components/recipes/StepIngredientForm.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Group,
  Button,
  Paper,
  Text,
  TextInput,
  NumberInput,
  Loader,
  Stack,
  ActionIcon,
  Select,
  Badge,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import { Ingredient } from "@/services/api/types/ingredient";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useFormContext } from "react-hook-form";

export interface StepIngredientItem {
  ingredientId: string;
  ingredientMeasure?: string;
  ingredientUnits: number;
}

interface StepIngredientFormProps {
  restaurantId: string;
  ingredients: StepIngredientItem[];
  onAddIngredient: (ingredient: StepIngredientItem) => void;
  onRemoveIngredient: (index: number) => void;
  isLoading?: boolean;
}

export function StepIngredientForm({
  restaurantId,
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
  isLoading = false,
}: StepIngredientFormProps) {
  const { t } = useTranslation("restaurant-recipes");
  const formContext = useFormContext(); // Access the form context

  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const getIngredientsService = useGetIngredientsService();

  // Form state for the new ingredient
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [ingredientMeasure, setIngredientMeasure] = useState("");
  const [ingredientUnits, setIngredientUnits] = useState(1);

  // Load ingredients for the restaurant
  useEffect(() => {
    const fetchIngredients = async () => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        const { status, data } = await getIngredientsService(undefined, {
          restaurantId,
          limit: 100,
          page: 1,
        });
        if (status === HTTP_CODES_ENUM.OK) {
          const ingredientsData = Array.isArray(data) ? data : data?.data || [];
          setIngredientsList(ingredientsData);
        }
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
  }, [restaurantId, getIngredientsService]);

  // Search ingredients
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!restaurantId || query.length < 2) return;
    setLoading(true);
    try {
      const { status, data } = await getIngredientsService(undefined, {
        restaurantId,
        name: query,
        limit: 20,
        page: 1,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        const ingredientsData = Array.isArray(data) ? data : data?.data || [];
        setIngredientsList(ingredientsData);
      }
    } catch (error) {
      console.error("Error searching ingredients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format data for the Select component
  const ingredientOptions = ingredientsList.map((item) => ({
    value: item.ingredientId,
    label: item.ingredientName,
  }));

  // Add ingredient to the list
  const handleAddIngredient = () => {
    if (!selectedIngredientId) return;
    const newIngredient: StepIngredientItem = {
      ingredientId: selectedIngredientId,
      ingredientMeasure: ingredientMeasure,
      ingredientUnits: ingredientUnits,
    };
    onAddIngredient(newIngredient);
    // Reset form
    setSelectedIngredientId("");
    setIngredientMeasure("");
    setIngredientUnits(1);
  };

  // Find the ingredient name by ID
  const getIngredientName = (id: string): string => {
    const ingredient = ingredientsList.find((item) => item.ingredientId === id);
    return ingredient?.ingredientName || id;
  };

  return (
    <Paper p="md" withBorder>
      <Text fw={500} mb="md">
        {t("form.ingredients")}
      </Text>
      {/* List of added ingredients */}
      {ingredients.length > 0 && (
        <Stack mb="xl">
          <Text size="sm" fw={500}>
            {t("form.addedIngredients")}:
          </Text>
          {ingredients.map((item, index) => (
            <Group key={index} justify="space-between">
              <Badge size="lg" radius="sm">
                {item.ingredientUnits} {item.ingredientMeasure}{" "}
                {getIngredientName(item.ingredientId)}
              </Badge>
              <ActionIcon
                color="red"
                onClick={() => onRemoveIngredient(index)}
                disabled={isLoading}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      )}
      {/* Form to add new ingredients */}
      <Stack>
        <Text size="sm" fw={500}>
          {t("form.addNewIngredient")}:
        </Text>
        <Group align="flex-end">
          <Select
            label={t("form.ingredientName")}
            placeholder={t("form.searchIngredients")}
            data={ingredientOptions}
            searchable
            clearable
            value={selectedIngredientId}
            onChange={(value) => setSelectedIngredientId(value || "")}
            onSearchChange={handleSearch}
            searchValue={searchQuery}
            rightSection={loading ? <Loader size="xs" /> : null}
            style={{ flex: 2 }}
            disabled={isLoading}
          />
          <TextInput
            label={t("form.measureType")}
            placeholder={t("form.measurePlaceholder")}
            value={ingredientMeasure}
            onChange={(e) => setIngredientMeasure(e.target.value)}
            style={{ flex: 1 }}
            disabled={isLoading}
          />
          <NumberInput
            label={t("form.quantity")}
            value={ingredientUnits}
            onChange={(value) => setIngredientUnits(Number(value))}
            min={0.01}
            step={0.1}
            style={{ flex: 1 }}
            disabled={isLoading}
          />
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAddIngredient}
          disabled={isLoading || !selectedIngredientId}
          variant="light"
        >
          {t("form.addIngredient")}
        </Button>
      </Stack>
    </Paper>
  );
}
