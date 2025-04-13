// src/components/menu-sections/MenuSectionCard.tsx
"use client";
import { Card, Text, Group, Stack, Button, Badge } from "@mantine/core";
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
          <Badge color="blue">
            {t("items")}: {menuSection.items?.length || 0}
          </Badge>
        </Group>
      </Stack>
      <Group justify="flex-end" mt="md">
        {onView && (
          <Button
            size="compact-xs"
            variant="light"
            color="blue"
            leftSection={<IconEye size={14} />}
            onClick={() => onView(menuSection.id)}
          >
            {t("actions.view")}
          </Button>
        )}
        <Button
          component={Link}
          href={`/restaurant/menu-sections/edit/${menuSection.id}`}
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
          onClick={() => onDelete(menuSection.id, menuSection.title)}
        >
          {t("actions.delete")}
        </Button>
      </Group>
    </Card>
  );
}
