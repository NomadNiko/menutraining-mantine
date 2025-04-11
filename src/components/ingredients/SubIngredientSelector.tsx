"use client";
import { useEffect, useState } from "react";
import {
  Autocomplete,
  Chip,
  Group,
  Text,
  Stack,
  Box,
  Loader,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
interface SubIngredientOption {
  value: string;
  label: string;
  ingredientId: string;
}
interface SubIngredientSelectorProps {
  restaurantId: string;
  selectedIngredients: string[];
  onChange: (ingredients: string[]) => void;
  excludeIngredientId?: string; // To exclude current ingredient when editing
  disabled?: boolean;
}
export function SubIngredientSelector({
  restaurantId,
  selectedIngredients,
  onChange,
  excludeIngredientId,
  disabled = false,
}: SubIngredientSelectorProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOptions, setSearchOptions] = useState<SubIngredientOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SubIngredientOption[]>(
    []
  );
  const getIngredientsService = useGetIngredientsService();
  // Load selected ingredients details
  useEffect(() => {
    const loadSelectedIngredients = async () => {
      if (selectedIngredients.length === 0) {
        setSelectedOptions([]);
        return;
      }
      setIsSearching(true);
      try {
        // We'll fetch all ingredients for this restaurant and filter
        const { status, data } = await getIngredientsService(undefined, {
          restaurantId,
          limit: 100, // Assuming reasonable number of ingredients
        });
        if (status === HTTP_CODES_ENUM.OK) {
          // Handle data as array directly or in data.data
          const allIngredients = Array.isArray(data) ? data : data?.data || [];
          const filteredOptions = allIngredients
            .filter((ing) => selectedIngredients.includes(ing.ingredientId))
            .map((ing) => ({
              value: ing.ingredientId,
              label: ing.ingredientName,
              ingredientId: ing.ingredientId,
            }));
          setSelectedOptions(filteredOptions);
        }
      } catch (error) {
        console.error("Error loading selected ingredients:", error);
      } finally {
        setIsSearching(false);
      }
    };
    loadSelectedIngredients();
  }, [restaurantId, selectedIngredients, getIngredientsService]);
  // Search ingredients as user types
  useEffect(() => {
    const searchIngredients = async () => {
      if (!searchQuery || searchQuery.length < 2 || !restaurantId) return;
      setIsSearching(true);
      try {
        const { status, data } = await getIngredientsService(undefined, {
          restaurantId,
          name: searchQuery,
          limit: 10,
        });
        if (status === HTTP_CODES_ENUM.OK) {
          // Handle data as array directly or in data.data
          const ingredientsData = Array.isArray(data) ? data : data?.data || [];
          // Filter out already selected ingredients and the current ingredient
          const filteredIngredients = ingredientsData.filter(
            (ing) =>
              !selectedIngredients.includes(ing.ingredientId) &&
              ing.ingredientId !== excludeIngredientId
          );
          const options = filteredIngredients.map((ing) => ({
            value: ing.ingredientId,
            label: ing.ingredientName,
            ingredientId: ing.ingredientId,
          }));
          setSearchOptions(options);
        }
      } catch (error) {
        console.error("Error searching ingredients:", error);
      } finally {
        setIsSearching(false);
      }
    };
    searchIngredients();
  }, [
    searchQuery,
    restaurantId,
    excludeIngredientId,
    selectedIngredients,
    getIngredientsService,
  ]);
  const handleSelect = (value: string) => {
    const selectedOption = searchOptions.find(
      (option) => option.value === value
    );
    if (
      selectedOption &&
      !selectedIngredients.includes(selectedOption.ingredientId)
    ) {
      onChange([...selectedIngredients, selectedOption.ingredientId]);
      setSearchQuery(""); // Clear search query after selection
    }
  };
  const handleRemove = (ingredientId: string) => {
    onChange(selectedIngredients.filter((id) => id !== ingredientId));
  };
  return (
    <Stack>
      <Autocomplete
        label={t("form.searchSubIngredients")}
        placeholder={t("form.searchSubIngredients")}
        value={searchQuery}
        onChange={setSearchQuery}
        data={searchOptions}
        disabled={disabled}
        rightSection={
          isSearching ? <Loader size="xs" /> : <IconSearch size={14} />
        }
        onOptionSubmit={(value) => {
          handleSelect(value);
          setSearchQuery(""); // Explicitly clear search query here
        }}
      />
      {selectedOptions.length > 0 && (
        <Box>
          <Text size="sm" fw={500} mb="xs">
            {t("form.selectedSubIngredients")}
          </Text>
          <Group>
            {selectedOptions.map((option) => (
              <Chip
                key={option.ingredientId}
                checked={false}
                disabled={disabled}
                onClick={() => handleRemove(option.ingredientId)}
              >
                {option.label}
              </Chip>
            ))}
          </Group>
        </Box>
      )}
    </Stack>
  );
}
