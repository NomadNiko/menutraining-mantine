// src/app/[language]/restaurant/recipes/view/[id]/page-content.tsx
"use client";
import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Stack,
  Badge,
  Card,
  Image,
  Box,
  Grid,
  Group,
  Button,
  Paper,
  List,
  Loader,
  Center,
  Alert,
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
import { useRecipeCache } from "@/components/recipes/RecipeDataPreloader";
import {
  IconClock,
  IconToolsKitchen,
  IconUsers,
  IconChevronLeft,
  IconPrinter,
  IconChefHat,
} from "@tabler/icons-react";
import Link from "@/components/link";
import { useRouter } from "next/navigation";
import { normalizeRecipe } from "@/utils/recipe-normalizer";

interface RecipeViewPageContentProps {
  recipeId: string;
}

interface EnhancedStep extends RecipeStepItem {
  equipment: Equipment[];
  ingredients: Array<StepIngredientItem & { ingredient: Ingredient }>;
}

interface EnhancedRecipe extends Recipe {
  enhancedSteps: EnhancedStep[];
}

export function RecipeViewPageContent({
  recipeId,
}: RecipeViewPageContentProps) {
  const { t } = useTranslation("restaurant-recipes");
  const router = useRouter();
  const [recipe, setRecipe] = useState<EnhancedRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cache = useRecipeCache();
  const getRecipeService = useGetRecipeService();
  const getIngredientService = useGetIngredientService();
  const getEquipmentService = useGetEquipmentItemService();

  useEffect(() => {
    const fetchRecipeData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if recipe is already in cache
        const cachedRecipe = cache.recipes[recipeId];
        let recipeData: Recipe;

        if (cachedRecipe) {
          recipeData = normalizeRecipe(cachedRecipe);
        } else {
          // Fetch from API if not in cache
          const { status, data } = await getRecipeService({ recipeId });
          if (status !== HTTP_CODES_ENUM.OK) {
            throw new Error(t("errors.recipeNotFound"));
          }
          recipeData = normalizeRecipe(data);
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
                    const response = await getEquipmentService({
                      equipmentId: eqId,
                    });
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
                      ingredientId: item.ingredientId,
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
    getRecipeService,
    getIngredientService,
    getEquipmentService,
    t,
    cache,
  ]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Center h="50vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container mt="xl">
        <Alert color="red" title={t("errors.error")}>
          {error}
        </Alert>
        <Button mt="md" onClick={() => router.back()}>
          {t("common.goBack")}
        </Button>
      </Container>
    );
  }

  if (!recipe) {
    return null;
  }

  // Collect all ingredients across all steps
  const allIngredients = recipe.enhancedSteps.reduce<
    Array<{ ingredient: Ingredient; units: number; measure?: string }>
  >((acc, step) => {
    step.ingredients.forEach((item) => {
      const existing = acc.find(
        (i) => i.ingredient.ingredientId === item.ingredient.ingredientId
      );
      if (existing) {
        existing.units += item.ingredientUnits;
      } else {
        acc.push({
          ingredient: item.ingredient,
          units: item.ingredientUnits,
          measure: item.ingredientMeasure,
        });
      }
    });
    return acc;
  }, []);

  return (
    <Container size="lg" py="xl" className="print-content">
      {/* Breadcrumbs */}
      <Group gap="xs" mb="md" className="no-print">
        <Button
          component={Link}
          href="/restaurant/recipes"
          variant="subtle"
          size="compact-sm"
          leftSection={<IconChevronLeft size={16} />}
        >
          {t("navigation.recipes")}
        </Button>
        <Text c="dimmed">/</Text>
        <Text fw={500}>{recipe.recipeName}</Text>
      </Group>

      {/* Header */}
      <Paper shadow="sm" p="lg" radius="md" mb="xl">
        <Group justify="space-between" align="flex-start" mb="md">
          <Box style={{ flex: 1 }}>
            <Title order={1} size="h1" mb="sm">
              {recipe.recipeName}
            </Title>
            {recipe.recipeDescription && (
              <Text size="xl" c="dimmed" mb="md">
                {recipe.recipeDescription}
              </Text>
            )}
            <Group gap="lg">
              <Badge
                leftSection={<IconUsers size={16} />}
                color="grape"
                size="xl"
                radius="sm"
              >
                {t("viewRecipe.servings")}: {recipe.recipeServings}
              </Badge>
              <Badge
                leftSection={<IconClock size={16} />}
                color="blue"
                size="xl"
                radius="sm"
              >
                {t("viewRecipe.prepTime")}: {recipe.recipePrepTime}{" "}
                {t("minutes")}
              </Badge>
              <Badge
                leftSection={<IconClock size={16} />}
                color="green"
                size="xl"
                radius="sm"
              >
                {t("viewRecipe.totalTime")}: {recipe.recipeTotalTime}{" "}
                {t("minutes")}
              </Badge>
            </Group>
          </Box>
          {recipe.recipeImageUrl && (
            <Image
              src={recipe.recipeImageUrl}
              alt={recipe.recipeName}
              radius="md"
              h={200}
              w={300}
              fit="cover"
            />
          )}
        </Group>

        <Group mt="md" className="no-print">
          <Button
            leftSection={<IconChevronLeft size={16} />}
            variant="light"
            onClick={() => router.back()}
          >
            {t("common.back")}
          </Button>
          <Button
            leftSection={<IconPrinter size={16} />}
            variant="light"
            onClick={handlePrint}
          >
            {t("common.print")}
          </Button>
        </Group>
      </Paper>

      {/* Ingredients Section */}
      <Paper
        shadow="sm"
        p="lg"
        radius="md"
        mb="xl"
        className="print-avoid-break"
      >
        <Title order={2} mb="md" size="h2">
          <Group gap="xs">
            <IconChefHat size={24} />
            {t("viewRecipe.ingredients")}
          </Group>
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <List spacing="md" size="lg">
              {allIngredients.map((item, idx) => (
                <List.Item key={idx}>
                  <Text size="lg">
                    <strong>{item.units}</strong> {item.measure || ""}{" "}
                    {item.ingredient.ingredientName}
                  </Text>
                </List.Item>
              ))}
            </List>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Recipe Steps Section */}
      <Paper shadow="sm" p="lg" radius="md">
        <Title order={2} mb="lg" size="h2">
          <Group gap="xs">
            <IconToolsKitchen size={24} />
            {t("viewRecipe.instructions")}
          </Group>
        </Title>
        <Stack gap="xl">
          {recipe.enhancedSteps.map((step, index) => (
            <Card
              key={index}
              withBorder
              p="xl"
              radius="md"
              className="print-avoid-break"
            >
              <Group justify="space-between" align="flex-start" mb="md">
                <Box style={{ flex: 1 }}>
                  <Title order={3} mb="md" c="blue">
                    {t("viewRecipe.step")} {index + 1}
                  </Title>
                  <Text size="xl" lh={1.8}>
                    {step.stepText}
                  </Text>
                </Box>
                {step.stepImageUrl && (
                  <Image
                    src={step.stepImageUrl}
                    alt={`Step ${index + 1}`}
                    radius="md"
                    h={180}
                    w={250}
                    fit="cover"
                  />
                )}
              </Group>

              <Grid mt="lg">
                {step.equipment.length > 0 && (
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text fw={700} size="lg" mb="sm" c="dimmed">
                      {t("viewRecipe.equipmentNeeded")}:
                    </Text>
                    <Group>
                      {step.equipment.map((eq) => (
                        <Badge
                          key={eq.id}
                          leftSection={<IconToolsKitchen size={16} />}
                          size="xl"
                          variant="light"
                          color="orange"
                        >
                          {eq.equipmentName}
                        </Badge>
                      ))}
                    </Group>
                  </Grid.Col>
                )}

                {step.ingredients.length > 0 && (
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text fw={700} size="lg" mb="sm" c="dimmed">
                      {t("viewRecipe.ingredientsForStep")}:
                    </Text>
                    <List spacing="sm" size="lg">
                      {step.ingredients.map((ing, idx) => (
                        <List.Item key={idx}>
                          <Text size="lg">
                            <strong>{ing.ingredientUnits}</strong>{" "}
                            {ing.ingredientMeasure || ""}{" "}
                            {ing.ingredient?.ingredientName ||
                              t("viewRecipe.unknownIngredient")}
                          </Text>
                        </List.Item>
                      ))}
                    </List>
                  </Grid.Col>
                )}
              </Grid>
            </Card>
          ))}
        </Stack>
      </Paper>
    </Container>
  );
}
