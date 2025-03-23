"use client";
import { Group, Pagination, Select, Text } from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";
import { useResponsive } from "@/services/responsive/use-responsive";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  disabled = false,
}: PaginationControlsProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  const { isMobile } = useResponsive();

  // Handle page size change
  const handlePageSizeChange = (value: string | null) => {
    if (value) {
      const newPageSize = parseInt(value, 10);
      if (newPageSize !== pageSize) {
        onPageSizeChange(newPageSize);
      }
    }
  };

  // Create page size options for dropdown
  const pageSizeItems = pageSizeOptions.map((size) => ({
    value: size.toString(),
    label: t("pagination.itemsPerPage", { count: size }),
  }));

  return (
    <Group mt="md">
      {!isMobile ? (
        <Group>
          <Text size="sm">{t("pagination.show")}</Text>
          <Select
            value={pageSize.toString()}
            onChange={handlePageSizeChange}
            data={pageSizeItems}
            disabled={disabled}
            size="xs"
            style={{ width: 100 }}
          />
        </Group>
      ) : null}

      <div style={{ margin: "0 auto" }}>
        <Pagination
          value={currentPage}
          onChange={onPageChange}
          total={totalPages}
          disabled={disabled}
          withEdges={!isMobile}
          size={isMobile ? "sm" : "md"}
        />
      </div>

      {isMobile ? (
        <Group>
          <Text size="sm">{t("pagination.show")}</Text>
          <Select
            value={pageSize.toString()}
            onChange={handlePageSizeChange}
            data={pageSizeItems}
            disabled={disabled}
            size="xs"
            style={{ width: 100 }}
          />
        </Group>
      ) : null}
    </Group>
  );
}
