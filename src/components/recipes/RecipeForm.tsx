// src/components/recipes/RecipeForm.tsx
"use client";
import { useState, useEffect } from "react";
import {
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Title,
  Text,
  NumberInput,
  Box,
  Card,
  ActionIcon,
  Modal,
} from "@mantine/core";
import {
  IconGripVertical,
  IconTrash,
  IconPlus,
  IconEdit,
} from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import {
  Recipe,
  CreateRecipeDto,
  CreateRecipeStepItemDto,
} from "@/services/api/types/recipe";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import { RecipeStep, RecipeStepForm } from "./RecipeStepForm";
import { Ingredient } from "@/services/api/types/ingredient";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

interface RecipeFormProps {
  restaurantId: string;
  restaurantName: string;
  initialData?: Partial<Recipe>;
  onSubmit: (data: CreateRecipeDto) => Promise<void>;
  isEdit?: boolean;
  isLoading?: boolean;
}

export function RecipeForm({
  restaurantId,
  restaurantName,
  initialData = {},
  onSubmit,
  isEdit = false,
  isLoading = false,
}: RecipeFormProps) {
  const { t } = useTranslation("restaurant-recipes");

  // Form state
  const [recipeName, setRecipeName] = useState(initialData.recipeName || "");
  const [recipeDescription, setRecipeDescription] = useState(
    initialData.recipeDescription || ""
  );
  // Removed recipeImage state since it's not being used
  const [recipeServings, setRecipeServings] = useState(
    initialData.recipeServings || 1
  );
  const [recipePrepTime, setRecipePrepTime] = useState(
    initialData.recipePrepTime || 0
  );
  const [recipeTotalTime, setRecipeTotalTime] = useState(
    initialData.recipeTotalTime || 0
  );

  // Steps state
  const [steps, setSteps] = useState<RecipeStep[]>([]);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  // Ingredients list for name lookup
  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([]);

  // Service hooks
  const getIngredientsService = useGetIngredientsService();

  // Form validation
  const [nameError, setNameError] = useState("");

  // Load initial steps if provided
  useEffect(() => {
    if (initialData.recipeSteps?.length) {
      const initialSteps: RecipeStep[] = initialData.recipeSteps.map(
        (step) => ({
          stepText: step.stepText,
          stepEquipment: step.stepEquipment || [],
          stepIngredientItems: step.stepIngredientItems || [],
          stepImageUrl: null, // We don't have initial image in the provided data
        })
      );

      // Sort by order if available
      initialSteps.sort((a, b) => {
        const orderA =
          initialData.recipeSteps?.find((s) => s.stepText === a.stepText)
            ?.order || 0;
        const orderB =
          initialData.recipeSteps?.find((s) => s.stepText === b.stepText)
            ?.order || 0;
        return orderA - orderB;
      });

      setSteps(initialSteps);
    }
  }, [initialData.recipeSteps]);

  // Load ingredients data for name lookup
  useEffect(() => {
    const fetchIngredients = async () => {
      if (!restaurantId) return;
      try {
        const { status, data } = await getIngredientsService(undefined, {
          restaurantId,
          limit: 100,
          page: 1,
        });
        if (status === HTTP_CODES_ENUM.OK) {
          const ingredientsData = Array.isArray(data) ? data : data?.data || [];
          setIngredientsList(ingredientsData);
        }
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      }
    };

    fetchIngredients();
  }, [getIngredientsService, restaurantId]);

  // Add a new step
  const handleAddStep = (step: RecipeStep) => {
    setSteps([...steps, step]);
    setIsAddingStep(false);
  };

  // Update an existing step
  const handleUpdateStep = (step: RecipeStep) => {
    if (editingStepIndex !== null) {
      const newSteps = [...steps];
      newSteps[editingStepIndex] = step;
      setSteps(newSteps);
      setEditingStepIndex(null);
    }
  };

  // Remove a step
  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Start editing a step
  const handleEditStep = (index: number) => {
    setEditingStepIndex(index);
  };

  // Handle drag and drop reordering
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedSteps = Array.from(steps);
    const [reorderedItem] = reorderedSteps.splice(result.source.index, 1);
    reorderedSteps.splice(result.destination.index, 0, reorderedItem);

    setSteps(reorderedSteps);
  };

  // Find ingredient name by ID
  const getIngredientName = (id: string): string => {
    const ingredient = ingredientsList.find((item) => item.ingredientId === id);
    return ingredient?.ingredientName || id;
  };

  // Final form submission
  const handleSubmit = async () => {
    // Basic validation
    if (!recipeName.trim()) {
      setNameError(t("form.validation.nameRequired"));
      return;
    } else {
      setNameError("");
    }

    if (steps.length === 0) {
      return; // No submission without steps
    }

    // Prepare steps with proper order
    const stepsWithOrder: CreateRecipeStepItemDto[] = steps.map(
      (step, index) => ({
        stepText: step.stepText,
        stepEquipment: step.stepEquipment,
        stepIngredientItems: step.stepIngredientItems,
        stepImageUrl: step.stepImageUrl?.path || null,
        order: index,
      })
    );

    // Create the final data object
    const recipeData: CreateRecipeDto = {
      recipeName,
      recipeDescription: recipeDescription || undefined,
      recipeImageUrl: null, // Set to null as we're not tracking the image state
      recipeServings,
      recipePrepTime,
      recipeTotalTime,
      recipeSteps: stepsWithOrder,
      restaurantId,
    };

    await onSubmit(recipeData);
  };

  return (
    <Stack gap="md">
      <Title order={4}>
        {isEdit ? t("editTitle") : t("createTitle")}{" "}
        {t("forRestaurant", { restaurantName })}
      </Title>

      {/* Basic Recipe Info Section */}
      <TextInput
        label={t("form.name")}
        value={recipeName}
        onChange={(e) => setRecipeName(e.currentTarget.value)}
        required
        error={nameError}
        disabled={isLoading}
      />

      <Textarea
        label={t("form.description")}
        value={recipeDescription}
        onChange={(e) => setRecipeDescription(e.currentTarget.value)}
        disabled={isLoading}
      />

      <Box>
        <Text mb="xs">{t("form.recipeImage")}</Text>
        <FormAvatarInput name="recipeImageUrl" testId="recipe-image" />
      </Box>

      <Group grow>
        <NumberInput
          label={t("form.servings")}
          value={recipeServings}
          onChange={(value) => setRecipeServings(Number(value))}
          min={1}
          required
          disabled={isLoading}
        />

        <NumberInput
          label={t("form.prepTime")}
          value={recipePrepTime}
          onChange={(value) => setRecipePrepTime(Number(value))}
          min={0}
          required
          disabled={isLoading}
          suffix=" min"
        />

        <NumberInput
          label={t("form.totalTime")}
          value={recipeTotalTime}
          onChange={(value) => setRecipeTotalTime(Number(value))}
          min={0}
          required
          disabled={isLoading}
          suffix=" min"
        />
      </Group>

      {/* Steps Section */}
      <Box>
        <Group justify="space-between" mb="md">
          <Text fw={500}>{t("form.steps")}</Text>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsAddingStep(true)}
            disabled={isLoading || isAddingStep || editingStepIndex !== null}
            variant="light"
          >
            {t("form.addStep")}
          </Button>
        </Group>

        {/* Steps List */}
        {steps.length === 0 ? (
          <Text c="dimmed" ta="center" mb="md">
            {t("form.noSteps")}
          </Text>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="steps">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {steps.map((step, index) => (
                    <Draggable
                      key={`step-${index}`}
                      draggableId={`step-${index}`}
                      index={index}
                      isDragDisabled={isLoading}
                    >
                      {(provided) => (
                        <Card
                          withBorder
                          mb="md"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <Card.Section p="xs" bg="gray.1">
                            <Group justify="space-between">
                              <Group>
                                <div {...provided.dragHandleProps}>
                                  <IconGripVertical size={18} />
                                </div>
                                <Text fw={500}>
                                  {t("form.step")} #{index + 1}
                                </Text>
                              </Group>
                              <Group gap="xs">
                                <ActionIcon
                                  color="blue"
                                  onClick={() => handleEditStep(index)}
                                  disabled={
                                    isLoading ||
                                    editingStepIndex !== null ||
                                    isAddingStep
                                  }
                                >
                                  <IconEdit size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  color="red"
                                  onClick={() => handleRemoveStep(index)}
                                  disabled={isLoading}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Group>
                          </Card.Section>

                          <Stack p="md" gap="sm">
                            <Text>{step.stepText}</Text>

                            {step.stepEquipment.length > 0 && (
                              <Group>
                                <Text fw={500} size="sm">
                                  {t("form.equipment")}:
                                </Text>
                                <Text size="sm">
                                  {step.stepEquipment.length}{" "}
                                  {t("form.equipmentItems")}
                                </Text>
                              </Group>
                            )}

                            {step.stepIngredientItems.length > 0 && (
                              <Group>
                                <Text fw={500} size="sm">
                                  {t("form.ingredients")}:
                                </Text>
                                {step.stepIngredientItems.map((ing, idx) => (
                                  <Text key={idx} size="sm">
                                    {ing.ingredientUnits}{" "}
                                    {ing.ingredientMeasure}{" "}
                                    {getIngredientName(ing.ingredientId)}
                                    {idx < step.stepIngredientItems.length - 1
                                      ? ", "
                                      : ""}
                                  </Text>
                                ))}
                              </Group>
                            )}
                          </Stack>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Box>

      {/* Add Step Modal */}
      <Modal
        opened={isAddingStep}
        onClose={() => setIsAddingStep(false)}
        title={t("form.addStep")}
        size="lg"
      >
        <RecipeStepForm
          restaurantId={restaurantId}
          onSave={handleAddStep}
          onCancel={() => setIsAddingStep(false)}
          isLoading={isLoading}
        />
      </Modal>

      {/* Edit Step Modal */}
      <Modal
        opened={editingStepIndex !== null}
        onClose={() => setEditingStepIndex(null)}
        title={t("form.editStep")}
        size="lg"
      >
        {editingStepIndex !== null && (
          <RecipeStepForm
            restaurantId={restaurantId}
            initialStep={steps[editingStepIndex]}
            onSave={handleUpdateStep}
            onCancel={() => setEditingStepIndex(null)}
            isEdit={true}
            isLoading={isLoading}
          />
        )}
      </Modal>

      {/* Submit/Cancel Buttons */}
      <Group mt="xl">
        <Button
          type="submit"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={steps.length === 0 || !recipeName.trim()}
        >
          {isEdit ? t("form.update") : t("form.submit")}
        </Button>
        <Button
          variant="light"
          color="red"
          component={Link}
          href="/restaurant/recipes"
          disabled={isLoading}
        >
          {t("form.cancel")}
        </Button>
      </Group>
    </Stack>
  );
}
