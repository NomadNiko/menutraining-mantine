// src/components/equipment/EquipmentCard.tsx
import { Card, Text, Group, Stack, Button, Image, Box } from "@mantine/core";
import { Equipment } from "@/services/api/types/equipment";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";

interface EquipmentCardProps {
  equipment: Equipment;
  onDelete: (id: string, name: string) => void;
}

export function EquipmentCard({ equipment, onDelete }: EquipmentCardProps) {
  const { t } = useTranslation("admin-panel-equipment");

  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Stack gap="xs">
        <Text size="lg" fw={500}>
          {equipment.equipmentName}
        </Text>
        {equipment.equipmentImageUrl && (
          <Box>
            <Image
              src={equipment.equipmentImageUrl}
              alt={equipment.equipmentName}
              height={120}
              fit="contain"
              mb="sm"
            />
          </Box>
        )}
      </Stack>
      <Group justify="flex-end" mt="md">
        <Button
          component={Link}
          href={`/admin-panel/equipment/edit/${equipment.id}`}
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
          onClick={() => onDelete(equipment.id, equipment.equipmentName)}
        >
          {t("actions.delete")}
        </Button>
      </Group>
    </Card>
  );
}
