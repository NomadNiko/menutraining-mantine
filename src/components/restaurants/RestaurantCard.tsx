import { Card, Text, Group, Stack, Button } from "@mantine/core";
import { Restaurant } from "@/services/api/types/restaurant";
import { IconEdit, IconTrash, IconUsers } from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onDelete: (id: string, name: string) => void;
}

export function RestaurantCard({ restaurant, onDelete }: RestaurantCardProps) {
  const { t } = useTranslation("admin-panel-restaurants");

  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Stack gap="xs">
        <Text size="lg" fw={500}>
          {restaurant.name}
        </Text>

        <Group gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            {t("table.email")}:
          </Text>
          <Text size="sm">{restaurant.email || "-"}</Text>
        </Group>

        <Group gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            {t("table.phone")}:
          </Text>
          <Text size="sm">{restaurant.phone || "-"}</Text>
        </Group>

        {restaurant.address && (
          <Group gap="xs">
            <Text size="sm" fw={500} c="dimmed">
              {t("form.address")}:
            </Text>
            <Text size="sm">{restaurant.address}</Text>
          </Group>
        )}
      </Stack>

      <Group justify="flex-end" mt="md">
        <Button
          component={Link}
          href={`/admin-panel/restaurants/edit/${restaurant.restaurantId}`}
          size="compact-xs"
          variant="light"
          leftSection={<IconEdit size={14} />}
        >
          {t("actions.edit")}
        </Button>
        <Button
          component={Link}
          href={`/admin-panel/restaurants/${restaurant.restaurantId}/users`}
          size="compact-xs"
          variant="light"
          leftSection={<IconUsers size={14} />}
        >
          {t("actions.users")}
        </Button>
        <Button
          size="compact-xs"
          variant="light"
          color="red"
          leftSection={<IconTrash size={14} />}
          onClick={() => onDelete(restaurant.restaurantId, restaurant.name)}
        >
          {t("actions.delete")}
        </Button>
      </Group>
    </Card>
  );
}
