import {
  Card,
  Text,
  Group,
  Stack,
  Box,
  Button,
  Avatar,
  useMantineColorScheme,
} from "@mantine/core";
import { User } from "@/services/api/types/user";
import { IconTrash } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";

interface RestaurantUserCardProps {
  user: User;
  onRemove: (userId: string, userName: string) => void;
  disabled?: boolean;
}

export function RestaurantUserCard({
  user,
  onRemove,
  disabled = false,
}: RestaurantUserCardProps) {
  const { t } = useTranslation("admin-panel-restaurants");
  const { colorScheme } = useMantineColorScheme();

  const shadowColor =
    colorScheme === "dark"
      ? "rgba(114, 180, 255, 0.4)"
      : "rgba(0, 100, 255, 0.4)";

  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Group align="flex-start" wrap="nowrap">
        <Box p="xs">
          <Avatar
            src={user?.photo?.path}
            alt={`${user?.firstName} ${user?.lastName}`}
            size="lg"
            radius="xl"
            style={{
              margin: "2px",
              boxShadow: `0 0 10px ${shadowColor}`,
            }}
          />
        </Box>
        <Stack gap="xs">
          <Text size="lg" fw={500}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text size="sm" c="dimmed">
            {user?.email}
          </Text>
        </Stack>
      </Group>
      <Group justify="flex-end" mt="md">
        <Button
          size="compact-xs"
          variant="light"
          color="red"
          onClick={() =>
            onRemove(user.id, `${user.firstName} ${user.lastName}`)
          }
          leftSection={<IconTrash size={14} />}
          disabled={disabled}
        >
          {t("users.removeButton")}
        </Button>
      </Group>
    </Card>
  );
}
