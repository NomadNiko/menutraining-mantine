// src/components/recipes/RecipeViewModal.tsx
import { useEffect, useState } from "react";
import {
  Modal,
  Group,
  Title,
  Text,
  Loader,
  Stack,
  Badge,
  Stepper,
  Card,
  Image,
  Divider,
  Box,
  Grid,
  Button,
} from "@mantine/core";
import { useTranslation } from "@/services/i18n/client";
import { useGetRecipeService } from "@/services/api/services/recipes";
import { useGetIngredientService } from "@/services/api/services/ingredients";
import { useGetEquipmentItemService } from "@/services/api/services/equipment";
import {
  Recipe,
  RecipeStepItem,
  StepIngredientItem,
} from "@/services/api/types/recipe";
import { Ingredient } from "@/services/api/types/ingredient";
import { Equipment } from "@/services/api/types/equipment";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useResponsive } from "@/services/responsive/use-responsive";
import { useRecipeCache } from "./RecipeDataPreloader";
import { IconClock, IconToolsKitchen3, IconUsers } from "@tabler/icons-react";

interface RecipeViewModalProps {
  recipeId: string | null;
  restaurantName: string;
  opened: boolean;
  onClose: () => void;
}

interface EnhancedStep extends RecipeStepItem {
  equipment: Equipment[];
  ingredients: Array<StepIngredientItem & { ingredient: Ingredient }>;
}

interface EnhancedRecipe extends Recipe {
  enhancedSteps: EnhancedStep[];
}

export function RecipeViewModal({
  recipeId,
  restaurantName,
  opened,
  onClose,
}: RecipeViewModalProps) {
  const { t } = useTranslation("restaurant-recipes");
  const { isMobile } = useResponsive();
  const [recipe, setRecipe] = useState<EnhancedRecipe | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get our preloaded cache
  const cache = useRecipeCache();
  const getRecipeService = useGetRecipeService();
  const getIngredientService = useGetIngredientService();
  const getEquipmentService = useGetEquipmentItemService();

  useEffect(() => {
    if (!recipeId || !opened) {
      return;
    }

    const fetchRecipeData = async () => {
      setLoading(true);
      setError(null);
      setActiveStep(0);

      try {
        // Check if recipe is already in cache
        const cachedRecipe = cache.recipes[recipeId];
        let recipeData: Recipe;

        if (cachedRecipe) {
          recipeData = cachedRecipe;
        } else {
          // Fetch from API if not in cache
          const { status, data } = await getRecipeService({ id: recipeId });
          if (status !== HTTP_CODES_ENUM.OK) {
            throw new Error(t("errors.recipeNotFound"));
          }
          recipeData = data;
          // Store in cache for future use
          cache.recipes[recipeId] = recipeData;
        }

        // Now enhance the recipe with ingredient and equipment details
        const enhancedSteps = await Promise.all(
          recipeData.recipeSteps.map(async (step) => {
            // Enhance with equipment details
            const equipment: Equipment[] = [];
            if (step.stepEquipment && step.stepEquipment.length > 0) {
              for (const eqId of step.stepEquipment) {
                let equipmentItem: Equipment | undefined =
                  cache.equipment[eqId];
                if (!equipmentItem) {
                  try {
                    const response = await getEquipmentService({ id: eqId });
                    if (response.status === HTTP_CODES_ENUM.OK) {
                      equipmentItem = response.data;
                      cache.equipment[eqId] = equipmentItem;
                    }
                  } catch (error) {
                    console.error(`Error fetching equipment ${eqId}:`, error);
                  }
                }
                if (equipmentItem) {
                  equipment.push(equipmentItem);
                }
              }
            }

            // Enhance with ingredient details
            const enhancedIngredients: Array<
              StepIngredientItem & { ingredient: Ingredient }
            > = [];
            if (
              step.stepIngredientItems &&
              step.stepIngredientItems.length > 0
            ) {
              for (const item of step.stepIngredientItems) {
                let ingredient: Ingredient | undefined =
                  cache.ingredients[item.ingredientId];
                if (!ingredient) {
                  try {
                    const response = await getIngredientService({
                      id: item.ingredientId,
                    });
                    if (response.status === HTTP_CODES_ENUM.OK) {
                      ingredient = response.data;
                      cache.ingredients[item.ingredientId] = ingredient;
                    }
                  } catch (error) {
                    console.error(
                      `Error fetching ingredient ${item.ingredientId}:`,
                      error
                    );
                  }
                }
                if (ingredient) {
                  enhancedIngredients.push({
                    ...item,
                    ingredient,
                  });
                }
              }
            }

            return {
              ...step,
              equipment,
              ingredients: enhancedIngredients,
            };
          })
        );

        // Sort steps by order
        enhancedSteps.sort((a, b) => a.order - b.order);

        setRecipe({
          ...recipeData,
          enhancedSteps,
        });
      } catch (error) {
        console.error("Error fetching recipe:", error);
        setError(t("errors.loadingFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeData();
  }, [
    recipeId,
    opened,
    getRecipeService,
    getIngredientService,
    getEquipmentService,
    t,
    cache,
  ]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("viewRecipe.title")}
      size={isMobile ? "full" : "xl"}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      {loading ? (
        <Group justify="center" p="xl">
          <Loader size="lg" />
        </Group>
      ) : error ? (
        <Text color="red" ta="center" p="md">
          {error}
        </Text>
      ) : recipe ? (
        <Stack gap="md">
          <Box>
            <Text size="sm" c="dimmed">
              {t("viewRecipe.restaurant")}
            </Text>
            <Title order={3}>{restaurantName}</Title>
          </Box>

          <Box>
            <Title order={4}>{recipe.recipeName}</Title>
            {recipe.recipeDescription && (
              <Text mt="xs">{recipe.recipeDescription}</Text>
            )}
            <Group gap="md" mt="md">
              <Badge leftSection={<IconUsers size={14} />} color="grape">
                {t("viewRecipe.servings")}: {recipe.recipeServings}
              </Badge>
              <Badge leftSection={<IconClock size={14} />} color="blue">
                {t("viewRecipe.prepTime")}: {recipe.recipePrepTime}{" "}
                {t("minutes")}
              </Badge>
              <Badge leftSection={<IconClock size={14} />} color="green">
                {t("viewRecipe.totalTime")}: {recipe.recipeTotalTime}{" "}
                {t("minutes")}
              </Badge>
            </Group>
            {recipe.recipeImageUrl && (
              <Image
                src={recipe.recipeImageUrl}
                alt={recipe.recipeName}
                mt="md"
                radius="md"
                height={200}
              />
            )}
          </Box>

          <Divider label={t("viewRecipe.steps")} labelPosition="center" />

          <Stepper
            active={activeStep}
            onStepClick={setActiveStep}
            orientation={isMobile ? "vertical" : "horizontal"}
            allowNextStepsSelect={false}
          >
            {recipe.enhancedSteps.map((step, index) => (
              <Stepper.Step
                key={index}
                label={`${t("viewRecipe.step")} ${index + 1}`}
                description={
                  step.stepText.length > 20
                    ? `${step.stepText.substring(0, 20)}...`
                    : step.stepText
                }
              >
                <Card withBorder p="md" radius="md">
                  <Stack gap="md">
                    <Text>{step.stepText}</Text>

                    {step.stepImageUrl && (
                      <Image
                        src={step.stepImageUrl}
                        alt={`Step ${index + 1}`}
                        radius="md"
                        height={150}
                      />
                    )}

                    {step.equipment.length > 0 && (
                      <Box>
                        <Text fw={500}>{t("viewRecipe.equipment")}:</Text>
                        <Group mt="xs">
                          {step.equipment.map((eq) => (
                            <Badge
                              key={eq.id}
                              leftSection={<IconToolsKitchen3 size={14} />}
                            >
                              {eq.equipmentName}
                            </Badge>
                          ))}
                        </Group>
                      </Box>
                    )}

                    {step.ingredients && step.ingredients.length > 0 && (
                      <Box>
                        <Text fw={500}>{t("viewRecipe.ingredients")}:</Text>
                        <Grid mt="xs">
                          {step.ingredients.map((ing, idx) => (
                            <Grid.Col key={idx} span={{ base: 12, sm: 6 }}>
                              <Group>
                                <Text>
                                  {ing.ingredientUnits}{" "}
                                  {ing.ingredientMeasure || ""}{" "}
                                  {ing.ingredient?.ingredientName ||
                                    "Unknown Ingredient"}
                                </Text>
                              </Group>
                            </Grid.Col>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </Stack>
                </Card>

                <Group justify="center" mt="xl">
                  <Button
                    variant="light"
                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                    disabled={activeStep === 0}
                  >
                    {t("viewRecipe.previousStep")}
                  </Button>
                  <Button
                    onClick={() =>
                      setActiveStep(
                        Math.min(
                          recipe.enhancedSteps.length - 1,
                          activeStep + 1
                        )
                      )
                    }
                    disabled={activeStep === recipe.enhancedSteps.length - 1}
                  >
                    {t("viewRecipe.nextStep")}
                  </Button>
                </Group>
              </Stepper.Step>
            ))}
          </Stepper>
        </Stack>
      ) : (
        <Text ta="center" c="dimmed">
          {t("viewRecipe.selectRecipe")}
        </Text>
      )}
    </Modal>
  );
}
