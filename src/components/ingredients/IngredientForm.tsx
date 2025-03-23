"use client";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  TextInput,
  Button,
  Group,
  Stack,
  Title,
  Box,
  Image,
  Text,
} from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import { SubIngredientSelector } from "./SubIngredientSelector";
import { AllergyCheckboxGroup } from "./AllergyCheckboxGroup"; // Import the new component
import { CategoryCheckboxGroup } from "./CategoryCheckboxGroup";
import {
  CreateIngredientDto,
  Ingredient,
  UpdateIngredientDto,
} from "@/services/api/types/ingredient";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import { FileEntity } from "@/services/api/types/file-entity";
import { usePathname } from "next/navigation";

interface IngredientFormProps {
  restaurantId: string;
  restaurantName: string;
  initialData?: Partial<Ingredient>;
  onSubmit: (data: CreateIngredientDto | UpdateIngredientDto) => Promise<void>;
  isEdit?: boolean;
  isLoading?: boolean;
}

type IngredientFormData = {
  ingredientName: string;
  photo?: FileEntity | null;
};

export function IngredientForm({
  restaurantId,
  restaurantName,
  initialData = {},
  onSubmit,
  isEdit = false,
  isLoading = false,
}: IngredientFormProps) {
  const { t } = useTranslation("admin-panel-ingredients");
  const [subIngredients, setSubIngredients] = useState<string[]>(
    initialData.subIngredients || []
  );
  const [ingredientAllergies, setIngredientAllergies] = useState<string[]>(
    initialData.ingredientAllergies || []
  );
  const [categories, setCategories] = useState<string[]>(
    initialData.categories || []
  );
  const [currentImageUrl] = useState<string | null>(
    initialData.ingredientImageUrl || null
  );
  const pathname = usePathname();

  // Determine if we're in the restaurant or admin panel context
  const isRestaurantRoute = pathname.includes("/restaurant/");

  // Get the correct cancel URL based on the current context
  const getCancelUrl = () => {
    return isRestaurantRoute
      ? "/restaurant/ingredients"
      : "/admin-panel/ingredients";
  };

  // Only validate the ingredientName field
  const validationSchema = yup.object().shape({
    ingredientName: yup.string().required(t("form.validation.nameRequired")),
  });

  const methods = useForm<IngredientFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      ingredientName: initialData.ingredientName || "",
      photo: null,
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = methods;

  const photo = watch("photo");

  const submitHandler = async (formData: IngredientFormData) => {
    // Enforce at least one category
    if (categories.length === 0) {
      // Set a default category if none selected
      setCategories(["Basic"]);
    }

    // Combine form data with subIngredients, allergies, and categories
    const submitData = {
      ingredientName: formData.ingredientName,
      ingredientAllergies,
      subIngredients,
      categories: categories.length > 0 ? categories : ["Basic"], // Ensure at least one category
      restaurantId,
      // Use uploaded photo path if available, otherwise keep existing URL
      ingredientImageUrl: formData.photo?.path || currentImageUrl,
    };

    await onSubmit(submitData as CreateIngredientDto | UpdateIngredientDto);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(submitHandler)}>
        <Stack gap="md">
          <Title order={4}>
            {isEdit ? t("editTitle") : t("createTitle")}{" "}
            {t("forRestaurant", { restaurantName })}
          </Title>
          <Controller
            name="ingredientName"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label={t("form.name")}
                required
                error={errors.ingredientName?.message}
                disabled={isLoading}
              />
            )}
          />
          {/* Display current image if it exists and no new photo is selected */}
          {currentImageUrl && !photo && (
            <Box>
              <Text size="sm" fw={500} mb="xs">
                {t("form.currentImage")}
              </Text>
              <Image
                src={currentImageUrl}
                alt={t("form.imageAlt")}
                width={100}
                height={100}
                fit="contain"
                radius="md"
              />
            </Box>
          )}
          {/* Image upload component */}
          <FormAvatarInput<IngredientFormData>
            name="photo"
            testId="ingredient-image"
          />
          {/* Categories selector */}
          <Box>
            <CategoryCheckboxGroup
              selectedCategories={categories}
              onChange={setCategories}
              disabled={isLoading}
            />
            {categories.length === 0 && (
              <Text color="red" size="sm" mt="xs">
                {t("form.validation.categoryRequired")}
              </Text>
            )}
          </Box>
          {/* Allergies selector - now using checkboxes */}
          <Box>
            <AllergyCheckboxGroup
              selectedAllergies={ingredientAllergies}
              onChange={setIngredientAllergies}
              disabled={isLoading}
            />
          </Box>
          {/* Sub-ingredients selector */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {t("form.subIngredients")}
            </Text>
            <SubIngredientSelector
              restaurantId={restaurantId}
              selectedIngredients={subIngredients}
              onChange={setSubIngredients}
              excludeIngredientId={
                isEdit ? initialData.ingredientId : undefined
              }
              disabled={isLoading}
            />
          </Box>
          <Group mt="xl">
            <Button type="submit" loading={isLoading} size="compact-sm">
              {isEdit ? t("form.update") : t("form.submit")}
            </Button>
            <Button
              variant="light"
              color="red"
              component={Link}
              href={getCancelUrl()}
              disabled={isLoading}
              size="compact-sm"
            >
              {t("form.cancel")}
            </Button>
          </Group>
        </Stack>
      </form>
    </FormProvider>
  );
}
