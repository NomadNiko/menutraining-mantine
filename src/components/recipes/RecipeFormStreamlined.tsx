// src/components/recipes/RecipeFormStreamlined.tsx
"use client";
import { useState, useEffect, useRef } from "react";
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
  Paper,
  Badge,
  Alert,
  Image,
} from "@mantine/core";
import {
  IconGripVertical,
  IconTrash,
  IconPlus,
  IconEdit,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconUpload,
} from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import {
  Recipe,
  CreateRecipeDto,
  UpdateRecipeDto,
  CreateRecipeStepItemDto,
} from "@/services/api/types/recipe";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { RecipeStep, RecipeStepForm } from "./RecipeStepForm";
import { Ingredient } from "@/services/api/types/ingredient";
import { useGetIngredientsService } from "@/services/api/services/ingredients";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useForm, FormProvider } from "react-hook-form";
import { FileEntity } from "@/services/api/types/file-entity";
import { useUpdateRecipeService } from "@/services/api/services/recipes";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";

type RecipeFormData = {
  recipeName: string;
  recipeDescription?: string;
  recipeImageUrl?: FileEntity | null;
  recipeServings: number;
  recipePrepTime: number;
  recipeTotalTime: number;
};

interface RecipeFormStreamlinedProps {
  restaurantId: string;
  restaurantName: string;
  recipe?: Recipe;
  onRecipeCreated?: (recipe: Recipe) => void;
  onRecipeUpdated?: (recipe: Recipe) => void;
  isNewRecipe: boolean;
}

export function RecipeFormStreamlined({
  restaurantId,
  restaurantName,
  recipe,
  onRecipeCreated,
  onRecipeUpdated,
  isNewRecipe,
}: RecipeFormStreamlinedProps) {
  const { t } = useTranslation("restaurant-recipes");
  const { enqueueSnackbar } = useSnackbar();
  const updateRecipeService = useUpdateRecipeService();

  // Initialize form with React Hook Form
  const methods = useForm<RecipeFormData>({
    defaultValues: {
      recipeName: recipe?.recipeName || "",
      recipeDescription: recipe?.recipeDescription || "",
      recipeImageUrl: null,
      recipeServings: recipe?.recipeServings || 1,
      recipePrepTime: recipe?.recipePrepTime || 0,
      recipeTotalTime: recipe?.recipeTotalTime || 0,
    },
  });

  // Form state
  const [recipeName, setRecipeName] = useState(recipe?.recipeName || "");
  const [recipeDescription, setRecipeDescription] = useState(
    recipe?.recipeDescription || ""
  );
  const [recipeServings, setRecipeServings] = useState(
    recipe?.recipeServings || 1
  );
  const [recipePrepTime, setRecipePrepTime] = useState(
    recipe?.recipePrepTime || 0
  );
  const [recipeTotalTime, setRecipeTotalTime] = useState(
    recipe?.recipeTotalTime || 0
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Image state
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    recipe?.recipeImageUrl || null
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

  // Track previous values for blur comparison
  const prevValues = useRef({
    recipeName: recipe?.recipeName || "",
    recipeDescription: recipe?.recipeDescription || "",
    recipeServings: recipe?.recipeServings || 1,
    recipePrepTime: recipe?.recipePrepTime || 0,
    recipeTotalTime: recipe?.recipeTotalTime || 0,
  });

  // Load initial steps if provided
  useEffect(() => {
    if (recipe?.recipeSteps?.length) {
      const initialSteps: RecipeStep[] = recipe.recipeSteps.map((step) => ({
        stepText: step.stepText,
        stepEquipment: step.stepEquipment || [],
        stepIngredientItems: step.stepIngredientItems || [],
        stepImageUrl: null,
      }));
      // Sort by order if available
      initialSteps.sort((a, b) => {
        const orderA =
          recipe.recipeSteps?.find((s) => s.stepText === a.stepText)?.order ||
          0;
        const orderB =
          recipe.recipeSteps?.find((s) => s.stepText === b.stepText)?.order ||
          0;
        return orderA - orderB;
      });
      setSteps(initialSteps);
    }
  }, [recipe]);

  // Load ingredients data for name lookup
  useEffect(() => {
    const fetchIngredients = async () => {
      if (!restaurantId) return;
      try {
        const { status, data } = await getIngredientsService(undefined, {
          restaurantId,
          limit: 300,
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

  // Save function
  const saveRecipe = async (showNotification = true) => {
    if (!recipe || isSaving) return;

    // Basic validation
    if (!recipeName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
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

      // Create the update data object
      const updateData: UpdateRecipeDto = {
        recipeName,
        recipeDescription: recipeDescription || undefined,
        recipeServings,
        recipePrepTime,
        recipeTotalTime,
        recipeSteps: stepsWithOrder,
        recipeImageUrl: currentImageUrl,
      };

      const { status, data } = await updateRecipeService(updateData, {
        recipeId: recipe.recipeId,
      });

      if (status === HTTP_CODES_ENUM.OK && data) {
        setLastSaved(new Date());
        // Update previous values
        prevValues.current = {
          recipeName,
          recipeDescription,
          recipeServings,
          recipePrepTime,
          recipeTotalTime,
        };
        if (onRecipeUpdated) {
          onRecipeUpdated(data);
        }
        if (showNotification) {
          enqueueSnackbar(t("saveSuccess"), { variant: "success" });
        }
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      enqueueSnackbar(t("saveError"), { variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle field blur - save if value changed
  const handleFieldBlur = (field: keyof typeof prevValues.current) => {
    if (!recipe) return;

    const currentValue = {
      recipeName,
      recipeDescription,
      recipeServings,
      recipePrepTime,
      recipeTotalTime,
    }[field];

    if (currentValue !== prevValues.current[field]) {
      saveRecipe(false); // Save without notification
    }
  };

  // Add a new step
  const handleAddStep = async (step: RecipeStep) => {
    const newSteps = [...steps, step];
    setSteps(newSteps);
    setIsAddingStep(false);

    // Save immediately if recipe exists
    if (recipe) {
      await saveRecipe();
    }
  };

  // Update an existing step
  const handleUpdateStep = async (step: RecipeStep) => {
    if (editingStepIndex !== null) {
      const newSteps = [...steps];
      newSteps[editingStepIndex] = step;
      setSteps(newSteps);
      setEditingStepIndex(null);

      // Save immediately if recipe exists
      if (recipe) {
        await saveRecipe();
      }
    }
  };

  // Remove a step
  const handleRemoveStep = async (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);

    // Save immediately if recipe exists
    if (recipe) {
      await saveRecipe();
    }
  };

  // Start editing a step
  const handleEditStep = (index: number) => {
    setEditingStepIndex(index);
  };

  // Handle drag and drop reordering
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const reorderedSteps = Array.from(steps);
    const [reorderedItem] = reorderedSteps.splice(result.source.index, 1);
    reorderedSteps.splice(result.destination.index, 0, reorderedItem);
    setSteps(reorderedSteps);

    // Save immediately if recipe exists
    if (recipe) {
      await saveRecipe();
    }
  };

  // Handle image upload
  const handleImageUpload = (imageUrl: string) => {
    setTempImageUrl(imageUrl);
  };

  // Accept new image
  const acceptNewImage = async () => {
    if (tempImageUrl) {
      setCurrentImageUrl(tempImageUrl);
      setTempImageUrl(null);

      // Save immediately if recipe exists
      if (recipe) {
        await saveRecipe();
      }
    }
  };

  // Revert image
  const revertImage = () => {
    setTempImageUrl(null);
  };

  // Find ingredient name by ID
  const getIngredientName = (id: string): string => {
    const ingredient = ingredientsList.find((item) => item.ingredientId === id);
    return ingredient?.ingredientName || id;
  };

  // Validate basic info
  const validateBasicInfo = (): boolean => {
    if (!recipeName.trim()) {
      setNameError(t("form.validation.nameRequired"));
      return false;
    }
    setNameError("");
    return true;
  };

  return (
    <FormProvider {...methods}>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Title order={4}>
            {isNewRecipe ? t("createTitle") : t("editTitle")}{" "}
            {t("forRestaurant", { restaurantName })}
          </Title>
          {recipe && (
            <Group gap="xs">
              {isSaving && (
                <Badge color="blue" variant="light">
                  {t("saving")}
                </Badge>
              )}
              {!isSaving && lastSaved && (
                <Badge
                  color="green"
                  variant="light"
                  leftSection={<IconCheck size={14} />}
                >
                  {t("saved")}
                </Badge>
              )}
            </Group>
          )}
        </Group>

        {isNewRecipe && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            color="blue"
            variant="light"
          >
            {t("streamlinedInstructions")}
          </Alert>
        )}

        {/* Basic Recipe Info Section */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Text fw={500} size="lg">
              {t("basicInfo")}
            </Text>
            <TextInput
              label={t("form.name")}
              value={recipeName}
              onChange={(e) => setRecipeName(e.currentTarget.value)}
              onBlur={() => handleFieldBlur("recipeName")}
              required
              error={nameError}
              disabled={isSaving}
            />
            <Textarea
              label={t("form.description")}
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.currentTarget.value)}
              onBlur={() => handleFieldBlur("recipeDescription")}
              disabled={isSaving}
            />
            <Box>
              <Text mb="xs">{t("form.recipeImage")}</Text>
              {currentImageUrl && !tempImageUrl && (
                <Box mb="md">
                  <Image
                    src={currentImageUrl}
                    alt="Current recipe image"
                    height={200}
                    fit="contain"
                  />
                </Box>
              )}
              {tempImageUrl && (
                <Box mb="md">
                  <Text size="sm" mb="xs">
                    {t("form.newImagePreview")}
                  </Text>
                  <Image
                    src={tempImageUrl}
                    alt="New recipe image"
                    height={200}
                    fit="contain"
                  />
                  <Group mt="xs">
                    <Button
                      size="xs"
                      leftSection={<IconCheck size={16} />}
                      onClick={acceptNewImage}
                      disabled={isSaving}
                    >
                      {t("form.acceptNewUpload")}
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      color="red"
                      leftSection={<IconX size={16} />}
                      onClick={revertImage}
                      disabled={isSaving}
                    >
                      {t("form.revert")}
                    </Button>
                  </Group>
                </Box>
              )}
              <Button
                leftSection={<IconUpload size={16} />}
                variant="light"
                component="label"
                disabled={isSaving || !!tempImageUrl}
              >
                {t("form.uploadImage")}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleImageUpload(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </Button>
            </Box>
            <Group grow>
              <NumberInput
                label={t("form.servings")}
                value={recipeServings}
                onChange={(value) => setRecipeServings(Number(value))}
                onBlur={() => handleFieldBlur("recipeServings")}
                min={1}
                required
                disabled={isSaving}
              />
              <NumberInput
                label={t("form.prepTime")}
                value={recipePrepTime}
                onChange={(value) => setRecipePrepTime(Number(value))}
                onBlur={() => handleFieldBlur("recipePrepTime")}
                min={0}
                required
                disabled={isSaving}
                suffix=" min"
              />
              <NumberInput
                label={t("form.totalTime")}
                value={recipeTotalTime}
                onChange={(value) => setRecipeTotalTime(Number(value))}
                onBlur={() => handleFieldBlur("recipeTotalTime")}
                min={0}
                required
                disabled={isSaving}
                suffix=" min"
              />
            </Group>
          </Stack>
        </Paper>

        {/* Steps Section - Only show after recipe is created */}
        {recipe && (
          <Paper p="md" withBorder>
            <Box>
              <Group justify="space-between" mb="md">
                <Text fw={500} size="lg">
                  {t("form.steps")}
                </Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setIsAddingStep(true)}
                  disabled={
                    isSaving || isAddingStep || editingStepIndex !== null
                  }
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
                            isDragDisabled={isSaving}
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
                                          isSaving ||
                                          editingStepIndex !== null ||
                                          isAddingStep
                                        }
                                      >
                                        <IconEdit size={16} />
                                      </ActionIcon>
                                      <ActionIcon
                                        color="red"
                                        onClick={() => handleRemoveStep(index)}
                                        disabled={isSaving}
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
                                      {step.stepIngredientItems.map(
                                        (ing, idx) => (
                                          <Text key={idx} size="sm">
                                            {ing.ingredientUnits}{" "}
                                            {ing.ingredientMeasure}{" "}
                                            {getIngredientName(
                                              ing.ingredientId
                                            )}
                                            {idx <
                                            step.stepIngredientItems.length - 1
                                              ? ", "
                                              : ""}
                                          </Text>
                                        )
                                      )}
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
          </Paper>
        )}

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
            isLoading={isSaving}
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
              isLoading={isSaving}
            />
          )}
        </Modal>

        {/* Submit/Cancel Buttons - Only for new recipes */}
        {isNewRecipe && (
          <Group mt="xl">
            <Button
              type="submit"
              onClick={() => {
                if (validateBasicInfo() && onRecipeCreated) {
                  // Create recipe with basic info only
                  const recipeData: CreateRecipeDto = {
                    recipeName,
                    recipeDescription: recipeDescription || undefined,
                    recipeImageUrl: currentImageUrl,
                    recipeServings,
                    recipePrepTime,
                    recipeTotalTime,
                    recipeSteps: [], // Start with no steps
                    restaurantId,
                  };
                  onRecipeCreated(recipeData as Recipe);
                }
              }}
              loading={isSaving}
              disabled={!recipeName.trim()}
            >
              {t("form.createAndContinue")}
            </Button>
            <Button
              variant="light"
              color="red"
              component={Link}
              href="/restaurant/recipes"
              disabled={isSaving}
            >
              {t("form.cancel")}
            </Button>
          </Group>
        )}

        {/* Done button for existing recipes */}
        {recipe && (
          <Group mt="xl">
            <Button
              component={Link}
              href="/restaurant/recipes"
              disabled={isSaving}
            >
              {t("form.done")}
            </Button>
          </Group>
        )}
      </Stack>
    </FormProvider>
  );
}
