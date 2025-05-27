// src/components/menu-sections/MenuSectionCard.tsx
"use client";
import { Card, Text, Group, Stack, Button, Badge, Box } from "@mantine/core";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";
import { MenuSection } from "@/services/api/types/menu-section";

interface MenuSectionCardProps {
  menuSection: MenuSection;
  onDelete: (id: string, title: string) => void;
  onView?: (id: string) => void;
}

export function MenuSectionCard({
  menuSection,
  onDelete,
  onView,
}: MenuSectionCardProps) {
  const { t } = useTranslation("restaurant-menu-sections");

  // Helper function to generate item name list
  const getItemsDisplay = () => {
    if (!menuSection.items || menuSection.items.length === 0) {
      return (
        <Text size="sm" c="dimmed">
          {t("noItems")}
        </Text>
      );
    }
    // Show only first 3 item names with a "+X more" if there are more than 3
    const itemsToShow = menuSection.items.slice(0, 3);
    const hasMoreItems = menuSection.items.length > 3;
    return (
      <Group wrap="wrap" gap="xs">
        {itemsToShow.map((item, index) => (
          <Badge key={index} size="sm" color="blue">
            {item.name}
          </Badge>
        ))}
        {hasMoreItems && (
          <Badge size="sm" color="gray">
            +{menuSection.items.length - 3} {t("table.more")}
          </Badge>
        )}
      </Group>
    );
  };

  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Stack gap="xs">
        <Text size="lg" fw={500}>
          {menuSection.title}
        </Text>
        {menuSection.description && (
          <Text size="sm" lineClamp={3}>
            {menuSection.description}
          </Text>
        )}
        <Group gap="md">
          {menuSection.startTime && menuSection.endTime && (
            <Badge color="gray">
              {t("timeRange")}: {menuSection.startTime} - {menuSection.endTime}
            </Badge>
          )}
        </Group>
        <Box>
          <Text size="sm" fw={500} mb="xs">
            {t("items")}:
          </Text>
          {getItemsDisplay()}
        </Box>
      </Stack>
      <Group justify="flex-end" mt="md">
        {onView && (
          <Button
            size="compact-xs"
            variant="light"
            color="blue"
            leftSection={<IconEye size={14} />}
            onClick={() => onView(menuSection.menuSectionId)}
          >
            {t("actions.view")}
          </Button>
        )}
        <Button
          component={Link}
          href={`/restaurant/menu-sections/edit/${menuSection.menuSectionId}`}
          size="compact-xs"
          variant="light"
          leftSection={<IconEdit size={14} />}
        >
          {t("actions.edit")}
        </Button>
        <Button
          size="compact-xs"
          variant="light"
          color="red"
          leftSection={<IconTrash size={14} />}
          onClick={() => onDelete(menuSection.menuSectionId, menuSection.title)}
        >
          {t("actions.delete")}
        </Button>
      </Group>
    </Card>
  );
}
