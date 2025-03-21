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

interface IngredientOption {
  value: string;
  label: string;
  ingredientId: string;
}

interface IngredientSelectorProps {
  restaurantId: string;
  selectedIngredients: string[];
  onChange: (ingredients: string[]) => void;
  disabled?: boolean;
}

export function IngredientSelector({
  restaurantId,
  selectedIngredients,
  onChange,
  disabled = false,
}: IngredientSelectorProps) {
  const { t } = useTranslation("admin-panel-menu-items");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOptions, setSearchOptions] = useState<IngredientOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<IngredientOption[]>(
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
        const { status, data } = await getIngredientsService(undefined, {
          restaurantId,
          limit: 100,
        });
        if (status === HTTP_CODES_ENUM.OK) {
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
          const ingredientsData = Array.isArray(data) ? data : data?.data || [];
          const filteredIngredients = ingredientsData.filter(
            (ing) => !selectedIngredients.includes(ing.ingredientId)
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
  }, [searchQuery, restaurantId, selectedIngredients, getIngredientsService]);

  const handleSelect = (value: string) => {
    const selectedOption = searchOptions.find(
      (option) => option.value === value
    );
    if (
      selectedOption &&
      !selectedIngredients.includes(selectedOption.ingredientId)
    ) {
      onChange([...selectedIngredients, selectedOption.ingredientId]);
      setSearchQuery("");
    }
  };

  const handleRemove = (ingredientId: string) => {
    onChange(selectedIngredients.filter((id) => id !== ingredientId));
  };

  return (
    <Stack>
      <Autocomplete
        label={t("form.searchIngredients")}
        placeholder={t("form.searchIngredientsPlaceholder")}
        value={searchQuery}
        onChange={setSearchQuery}
        data={searchOptions}
        disabled={disabled}
        rightSection={
          isSearching ? <Loader size="xs" /> : <IconSearch size={14} />
        }
        onOptionSubmit={handleSelect}
      />

      {selectedOptions.length > 0 && (
        <Box>
          <Text size="sm" fw={500} mb="xs">
            {t("form.selectedIngredients")}
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
