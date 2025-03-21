import { Card, Text, Group, Stack, Button, Image, Box } from "@mantine/core";
import { Allergy } from "@/services/api/types/allergy";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";

interface AllergyCardProps {
  allergy: Allergy;
  onDelete: (id: string, name: string) => void;
}

export function AllergyCard({ allergy, onDelete }: AllergyCardProps) {
  const { t } = useTranslation("admin-panel-allergies");

  return (
    <Card shadow="sm" p="md" radius="md" withBorder mb="sm">
      <Stack gap="xs">
        <Text size="lg" fw={500}>
          {allergy.allergyName}
        </Text>

        {allergy.allergyLogoUrl && (
          <Box>
            <Image
              src={allergy.allergyLogoUrl}
              alt={allergy.allergyName}
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
          href={`/admin-panel/allergies/edit/${allergy.id}`}
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
          onClick={() => onDelete(allergy.id, allergy.allergyName)}
        >
          {t("actions.delete")}
        </Button>
      </Group>
    </Card>
  );
}
