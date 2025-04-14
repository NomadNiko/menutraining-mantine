// src/components/recipes/RecipeStepForm.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Card,
  Text,
  Textarea,
  Button,
  Group,
  Paper,
  Stack,
  Box,
  ActionIcon,
  Badge,
  Select,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import { StepIngredientForm, StepIngredientItem } from "./StepIngredientForm";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import { FileEntity } from "@/services/api/types/file-entity";
import { Equipment } from "@/services/api/types/equipment";
import { useGetEquipmentService } from "@/services/api/services/equipment";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useForm, FormProvider } from "react-hook-form";

export interface RecipeStep {
  stepText: string;
  stepEquipment: string[];
  stepIngredientItems: StepIngredientItem[];
  stepImageUrl?: FileEntity | null;
}

interface RecipeStepFormProps {
  restaurantId: string;
  initialStep?: RecipeStep;
  onSave: (step: RecipeStep) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  isLoading?: boolean;
}

export function RecipeStepForm({
  restaurantId,
  initialStep,
  onSave,
  onCancel,
  isEdit = false,
  isLoading = false,
}: RecipeStepFormProps) {
  const { t } = useTranslation("restaurant-recipes");

  // Initialize form with React Hook Form
  const methods = useForm<RecipeStep>({
    defaultValues: {
      stepText: initialStep?.stepText || "",
      stepEquipment: initialStep?.stepEquipment || [],
      stepIngredientItems: initialStep?.stepIngredientItems || [],
      stepImageUrl: initialStep?.stepImageUrl || null,
    },
  });

  // Initialize form state
  const [stepText, setStepText] = useState(initialStep?.stepText || "");
  const [stepEquipment, setStepEquipment] = useState<string[]>(
    initialStep?.stepEquipment || []
  );
  const [stepIngredients, setStepIngredients] = useState<StepIngredientItem[]>(
    initialStep?.stepIngredientItems || []
  );

  // Equipment data for selection
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const getEquipmentService = useGetEquipmentService();

  // Load equipment data
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { status, data } = await getEquipmentService(undefined, {
          page: 1,
          limit: 100,
        });
        if (status === HTTP_CODES_ENUM.OK) {
          const equipmentData = Array.isArray(data) ? data : data?.data || [];
          setEquipmentList(equipmentData);
        }
      } catch (error) {
        console.error("Error fetching equipment:", error);
      }
    };
    fetchEquipment();
  }, [getEquipmentService]);

  // Add equipment item
  const handleAddEquipment = () => {
    if (!selectedEquipmentId || stepEquipment.includes(selectedEquipmentId))
      return;
    setStepEquipment([...stepEquipment, selectedEquipmentId]);
    setSelectedEquipmentId("");
  };

  // Remove equipment item
  const handleRemoveEquipment = (index: number) => {
    setStepEquipment(stepEquipment.filter((_, i) => i !== index));
  };

  // Add ingredient item
  const handleAddIngredient = (ingredient: StepIngredientItem) => {
    setStepIngredients([...stepIngredients, ingredient]);
  };

  // Remove ingredient item
  const handleRemoveIngredient = (index: number) => {
    setStepIngredients(stepIngredients.filter((_, i) => i !== index));
  };

  // Form submission
  const handleSave = () => {
    if (!stepText.trim()) return;
    const step: RecipeStep = {
      stepText,
      stepEquipment,
      stepIngredientItems: stepIngredients,
      stepImageUrl: methods.getValues("stepImageUrl"), // Use the form value for the image
    };
    onSave(step);
  };

  // Get equipment name by ID
  const getEquipmentName = (id: string): string => {
    const equipment = equipmentList.find((item) => item.equipmentId === id);
    return equipment?.equipmentName || id;
  };

  // Format equipment options for select
  const equipmentOptions = equipmentList.map((item) => ({
    value: item.equipmentId,
    label: item.equipmentName,
  }));

  return (
    <FormProvider {...methods}>
      <Card withBorder p="lg">
        <Stack gap="md">
          <Text fw={500} size="lg">
            {isEdit ? t("form.editStep") : t("form.addStep")}
          </Text>
          <Textarea
            label={t("form.stepText")}
            value={stepText}
            onChange={(e) => setStepText(e.currentTarget.value)}
            minRows={3}
            required
            disabled={isLoading}
          />
          <Box>
            <Text mb="xs">{t("form.stepImage")}</Text>
            <FormAvatarInput name="stepImageUrl" testId="step-image" />
          </Box>
          {/* Equipment Section */}
          <Paper p="md" withBorder>
            <Text fw={500} mb="md">
              {t("form.equipment")}
            </Text>
            {/* List of added equipment */}
            {stepEquipment.length > 0 && (
              <Stack mb="xl">
                <Text size="sm" fw={500}>
                  {t("form.addedEquipment")}:
                </Text>
                {stepEquipment.map((equipmentId, index) => (
                  <Group key={index} justify="space-between">
                    <Badge size="lg" radius="sm">
                      {getEquipmentName(equipmentId)}
                    </Badge>
                    <ActionIcon
                      color="red"
                      onClick={() => handleRemoveEquipment(index)}
                      disabled={isLoading}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            )}
            {/* Add equipment form */}
            <Group align="flex-end">
              <Select
                label={t("form.equipmentName")}
                placeholder={t("form.searchEquipment")}
                data={equipmentOptions}
                searchable
                clearable
                value={selectedEquipmentId}
                onChange={(value) => setSelectedEquipmentId(value || "")}
                style={{ flex: 1 }}
                disabled={isLoading}
              />
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleAddEquipment}
                variant="light"
                disabled={isLoading || !selectedEquipmentId}
              >
                {t("form.addEquipment")}
              </Button>
            </Group>
          </Paper>
          {/* Ingredients Section */}
          <StepIngredientForm
            restaurantId={restaurantId}
            ingredients={stepIngredients}
            onAddIngredient={handleAddIngredient}
            onRemoveIngredient={handleRemoveIngredient}
            isLoading={isLoading}
          />
          {/* Submit/Cancel Buttons */}
          <Group mt="md">
            <Button
              onClick={handleSave}
              disabled={isLoading || !stepText.trim()}
            >
              {isEdit ? t("form.updateStep") : t("form.addStep")}
            </Button>
            {onCancel && (
              <Button
                variant="light"
                color="gray"
                onClick={onCancel}
                disabled={isLoading}
              >
                {t("form.cancel")}
              </Button>
            )}
          </Group>
        </Stack>
      </Card>
    </FormProvider>
  );
}
