"use client";
import { useEffect, useState } from "react";
import { Checkbox, Group, Stack, Text, SimpleGrid } from "@mantine/core";
import { useGetAllergiesService } from "@/services/api/services/allergies";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { Allergy } from "@/services/api/types/allergy";

interface AllergyCheckboxGroupProps {
  selectedAllergies: string[];
  onChange: (allergies: string[]) => void;
  disabled?: boolean;
}

export function AllergyCheckboxGroup({
  selectedAllergies,
  onChange,
  disabled = false,
}: AllergyCheckboxGroupProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const getAllergiesService = useGetAllergiesService();

  // Load all allergies on component mount
  useEffect(() => {
    const loadAllergies = async () => {
      setIsLoading(true);
      try {
        const { status, data } = await getAllergiesService(undefined, {
          page: 1,
          limit: 100, // Assuming a reasonable number of allergies
        });
        if (status === HTTP_CODES_ENUM.OK) {
          const allergiesData = Array.isArray(data) ? data : data?.data || [];
          setAllergies(allergiesData);
        }
      } catch (error) {
        console.error("Error loading allergies:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllergies();
  }, [getAllergiesService]);

  const handleAllergyChange = (allergyId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedAllergies, allergyId]);
    } else {
      onChange(selectedAllergies.filter((id) => id !== allergyId));
    }
  };

  return (
    <Stack>
      <Text size="sm" fw={500}>
        {t("form.allergies")}
      </Text>
      {isLoading ? (
        <Text size="sm">{t("loading")}</Text>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
          {allergies.map((allergy) => (
            <Group key={allergy.allergyId} wrap="nowrap">
              <Checkbox
                label={allergy.allergyName}
                checked={selectedAllergies.includes(allergy.allergyId)}
                onChange={(event) =>
                  handleAllergyChange(
                    allergy.allergyId,
                    event.currentTarget.checked
                  )
                }
                disabled={disabled}
              />
            </Group>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
