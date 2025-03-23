"use client";
import { useState, useEffect, useCallback } from "react";
import { TextInput, ActionIcon } from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import { useDebouncedValue } from "@mantine/hooks";

interface SearchBarProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchBar({
  initialValue = "",
  onSearch,
  placeholder,
  disabled = false,
}: SearchBarProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  const [searchValue, setSearchValue] = useState(initialValue);
  const [debouncedSearchValue] = useDebouncedValue(searchValue, 300);

  // Use the provided translation or default
  const searchPlaceholder = placeholder || t("search.placeholder");

  // Update parent component when debounced value changes
  useEffect(() => {
    onSearch(debouncedSearchValue);
  }, [debouncedSearchValue, onSearch]);

  // Update local state if initialValue prop changes
  useEffect(() => {
    setSearchValue(initialValue);
  }, [initialValue]);

  // Handle clearing the search
  const handleClearSearch = useCallback(() => {
    setSearchValue("");
    onSearch("");
  }, [onSearch]);

  return (
    <TextInput
      value={searchValue}
      onChange={(event) => setSearchValue(event.currentTarget.value)}
      placeholder={searchPlaceholder}
      leftSection={<IconSearch size={16} />}
      rightSection={
        searchValue ? (
          <ActionIcon
            onClick={handleClearSearch}
            variant="subtle"
            radius="xl"
            size="sm"
          >
            <IconX size={16} />
          </ActionIcon>
        ) : null
      }
      disabled={disabled}
      aria-label={t("search.ariaLabel")}
      data-testid="ingredient-search-input"
    />
  );
}
