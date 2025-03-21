// src/components/ingredients/AllergySelector.tsx
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
import { useGetAllergiesService } from "@/services/api/services/allergies";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { Allergy } from "@/services/api/types/allergy";

interface AllergyOption {
  value: string;
  label: string;
  allergyId: string;
}

interface AllergySelectorProps {
  selectedAllergies: string[];
  onChange: (allergies: string[]) => void;
  disabled?: boolean;
}

export function AllergySelector({
  selectedAllergies,
  onChange,
  disabled = false,
}: AllergySelectorProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOptions, setSearchOptions] = useState<AllergyOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<AllergyOption[]>([]);
  const getAllergiesService = useGetAllergiesService();

  // Load selected allergies details
  useEffect(() => {
    const loadSelectedAllergies = async () => {
      if (selectedAllergies.length === 0) {
        setSelectedOptions([]);
        return;
      }
      setIsSearching(true);
      try {
        // We'll fetch all allergies and filter
        const { status, data } = await getAllergiesService(undefined, {
          page: 1,
          limit: 100, // Assuming reasonable number of allergies
        });
        if (status === HTTP_CODES_ENUM.OK) {
          const allAllergies = Array.isArray(data) ? data : data?.data || [];
          const filteredOptions = allAllergies
            .filter((allergy: Allergy) =>
              selectedAllergies.includes(allergy.allergyId)
            )
            .map((allergy: Allergy) => ({
              value: allergy.allergyId,
              label: allergy.allergyName,
              allergyId: allergy.allergyId,
            }));
          setSelectedOptions(filteredOptions);
        }
      } catch (error) {
        console.error("Error loading selected allergies:", error);
      } finally {
        setIsSearching(false);
      }
    };
    loadSelectedAllergies();
  }, [selectedAllergies, getAllergiesService]);

  // Search allergies as user types
  useEffect(() => {
    const searchAllergies = async () => {
      if (!searchQuery || searchQuery.length < 2) return;
      setIsSearching(true);
      try {
        const { status, data } = await getAllergiesService(undefined, {
          page: 1,
          limit: 10,
          name: searchQuery,
        });
        if (status === HTTP_CODES_ENUM.OK) {
          const allergiesData = Array.isArray(data) ? data : data?.data || [];
          // Filter out already selected allergies
          const filteredAllergies = allergiesData.filter(
            (allergy: Allergy) => !selectedAllergies.includes(allergy.allergyId)
          );
          const options = filteredAllergies.map((allergy: Allergy) => ({
            value: allergy.allergyId,
            label: allergy.allergyName,
            allergyId: allergy.allergyId,
          }));
          setSearchOptions(options);
        }
      } catch (error) {
        console.error("Error searching allergies:", error);
      } finally {
        setIsSearching(false);
      }
    };
    searchAllergies();
  }, [searchQuery, selectedAllergies, getAllergiesService]);

  // Handle selection of an allergy from the dropdown
  const handleSelect = (value: string) => {
    const selectedOption = searchOptions.find(
      (option) => option.value === value
    );
    if (
      selectedOption &&
      !selectedAllergies.includes(selectedOption.allergyId)
    ) {
      onChange([...selectedAllergies, selectedOption.allergyId]);
      setSearchQuery("");
    }
  };

  const handleRemove = (allergyId: string) => {
    onChange(selectedAllergies.filter((id) => id !== allergyId));
  };

  return (
    <Stack>
      <Autocomplete
        label={t("form.searchAllergies")}
        placeholder={t("form.searchAllergiesPlaceholder")}
        value={searchQuery}
        onChange={setSearchQuery}
        data={searchOptions}
        disabled={disabled}
        rightSection={
          isSearching ? <Loader size="xs" /> : <IconSearch size={14} />
        }
        onOptionSubmit={(value) => {
          handleSelect(value);
        }}
      />
      {selectedOptions.length > 0 && (
        <Box>
          <Text size="sm" fw={500} mb="xs">
            {t("form.selectedAllergies")}
          </Text>
          <Group>
            {selectedOptions.map((option) => (
              <Chip
                key={option.allergyId}
                checked={false}
                disabled={disabled}
                onClick={() => handleRemove(option.allergyId)}
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
