// src/components/menu-items/MenuItemForm.tsx
"use client";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  TextInput,
  Textarea,
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
import { IngredientSelector } from "./IngredientSelector";
import {
  CreateMenuItemDto,
  MenuItem,
  UpdateMenuItemDto,
} from "@/services/api/types/menu-item";
import FormFoodImageInput from "@/components/form/food-image-input/food-image-input";
import { FileEntity } from "@/services/api/types/file-entity";
import { usePathname } from "next/navigation";

interface MenuItemFormProps {
  restaurantId: string;
  restaurantName: string;
  initialData?: Partial<MenuItem>;
  onSubmit: (data: CreateMenuItemDto | UpdateMenuItemDto) => Promise<void>;
  isEdit?: boolean;
  isLoading?: boolean;
}

type MenuItemFormData = {
  menuItemName: string;
  menuItemDescription?: string;
  photo?: FileEntity | null;
};

export function MenuItemForm({
  restaurantId,
  restaurantName,
  initialData = {},
  onSubmit,
  isEdit = false,
  isLoading = false,
}: MenuItemFormProps) {
  const { t } = useTranslation("admin-panel-menu-items");
  const [menuItemIngredients, setMenuItemIngredients] = useState<string[]>(
    initialData.menuItemIngredients || []
  );
  const [currentImageUrl] = useState<string | null>(
    initialData.menuItemUrl || null
  );
  const pathname = usePathname();

  // Determine if we're in the restaurant or admin panel context
  const isRestaurantRoute = pathname.includes("/restaurant/");

  // Get the correct cancel URL based on the current context
  const getCancelUrl = () => {
    return isRestaurantRoute
      ? "/restaurant/menu-items"
      : "/admin-panel/menu-items";
  };

  // Validation schema
  const validationSchema = yup.object().shape({
    menuItemName: yup.string().required(t("form.validation.nameRequired")),
    menuItemDescription: yup.string(),
  });

  const methods = useForm<MenuItemFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      menuItemName: initialData.menuItemName || "",
      menuItemDescription: initialData.menuItemDescription || "",
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

  const submitHandler = async (formData: MenuItemFormData) => {
    // Require at least one ingredient
    if (menuItemIngredients.length === 0) {
      return; // Could show an error message here
    }

    // Combine form data with ingredients
    const submitData = {
      menuItemName: formData.menuItemName,
      menuItemDescription: formData.menuItemDescription,
      menuItemIngredients,
      restaurantId,
      // Use uploaded photo path if available, otherwise keep existing URL
      menuItemUrl: formData.photo?.path || currentImageUrl,
    };

    await onSubmit(submitData as CreateMenuItemDto | UpdateMenuItemDto);
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
            name="menuItemName"
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label={t("form.name")}
                required
                error={errors.menuItemName?.message}
                disabled={isLoading}
              />
            )}
          />

          <Controller
            name="menuItemDescription"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                label={t("form.description")}
                error={errors.menuItemDescription?.message}
                disabled={isLoading}
                minRows={3}
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
                width={200}
                height={150}
                fit="contain"
                radius="md"
              />
            </Box>
          )}

          {/* Image upload component */}
          <FormFoodImageInput<MenuItemFormData>
            name="photo"
            testId="menu-item-image"
          />

          {/* Ingredients selector */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {t("form.ingredients")}
            </Text>
            <IngredientSelector
              restaurantId={restaurantId}
              selectedIngredients={menuItemIngredients}
              onChange={setMenuItemIngredients}
              disabled={isLoading}
            />
            {menuItemIngredients.length === 0 && (
              <Text color="red" size="sm" mt="xs">
                {t("form.validation.ingredientsRequired")}
              </Text>
            )}
          </Box>

          <Group mt="xl">
            <Button
              type="submit"
              loading={isLoading}
              size="compact-sm"
              disabled={menuItemIngredients.length === 0}
            >
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
