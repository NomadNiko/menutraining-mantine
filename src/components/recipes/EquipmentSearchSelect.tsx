// src/components/recipes/EquipmentSearchSelect.tsx
"use client";
import { useEffect, useState } from "react";
import { Select, Loader } from "@mantine/core";
import { useGetEquipmentService } from "@/services/api/services/equipment";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { Equipment } from "@/services/api/types/equipment";

interface EquipmentSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function EquipmentSearchSelect({
  value,
  onChange,
  error,
  disabled = false,
}: EquipmentSearchSelectProps) {
  const { t } = useTranslation("restaurant-recipes");
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const getEquipmentService = useGetEquipmentService();

  // Initial load of equipment
  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      try {
        const { status, data } = await getEquipmentService(undefined, {
          page: 1,
          limit: 50,
        });
        if (status === HTTP_CODES_ENUM.OK) {
          const equipmentData = Array.isArray(data) ? data : data?.data || [];
          setEquipment(equipmentData);
        }
      } catch (error) {
        console.error("Error fetching equipment:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [getEquipmentService]);

  // Search equipment
  const handleSearch = async (query: string) => {
    setSearchValue(query);
    if (query.length < 2) return;
    setLoading(true);
    try {
      const { status, data } = await getEquipmentService(undefined, {
        page: 1,
        limit: 20,
        name: query,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        const equipmentData = Array.isArray(data) ? data : data?.data || [];
        setEquipment(equipmentData);
      }
    } catch (error) {
      console.error("Error searching equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format data for the Select component
  const selectData = equipment.map((item) => ({
    value: item.id,
    label: item.equipmentName,
  }));

  return (
    <Select
      label={t("form.equipment")}
      placeholder={t("form.searchEquipment")}
      data={selectData}
      value={value}
      onChange={(value: string | null) => {
        if (value !== null) {
          onChange(value);
        }
      }}
      searchable
      clearable
      onSearchChange={handleSearch}
      searchValue={searchValue}
      rightSection={loading ? <Loader size="xs" /> : null}
      error={error}
      disabled={disabled}
    />
  );
}
