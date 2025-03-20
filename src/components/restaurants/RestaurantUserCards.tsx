import { Stack, Center, Text } from "@mantine/core";
import { User } from "@/services/api/types/user";
import { RestaurantUserCard } from "./RestaurantUserCard";
import { useTranslation } from "@/services/i18n/client";

interface RestaurantUserCardsProps {
  users: User[];
  onRemove: (userId: string, userName: string) => void;
  disabled?: boolean;
}

export function RestaurantUserCards({
  users,
  onRemove,
  disabled = false,
}: RestaurantUserCardsProps) {
  const { t } = useTranslation("admin-panel-restaurants");

  if (users.length === 0) {
    return (
      <Center p="xl">
        <Text>{t("users.noUsers")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {users.map((user) => (
        <RestaurantUserCard
          key={user.id}
          user={user}
          onRemove={onRemove}
          disabled={disabled}
        />
      ))}
    </Stack>
  );
}
