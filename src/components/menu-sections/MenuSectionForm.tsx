// src/components/menu-sections/MenuSectionForm.tsx
"use client";
import {
  useForm,
  Controller,
  useFieldArray,
  FormProvider,
} from "react-hook-form";
import {
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Title,
  Text,
  Grid,
  ActionIcon,
  Box,
  NumberInput,
  Card,
} from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { IconGripVertical, IconTrash, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import {
  CreateMenuSectionDto,
  MenuSection,
  CreateSectionItemDto,
} from "@/services/api/types/menu-section";
import { MenuItem } from "@/services/api/types/menu-item";
import { useGetMenuItemService } from "@/services/api/services/menu-items";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
} from "@hello-pangea/dnd";
import { MenuItemSearchSelect } from "./MenuItemSearchSelect";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import { FileEntity } from "@/services/api/types/file-entity";

// Define the form data type including the image upload field
type MenuSectionFormData = {
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    description?: string;
    price: number;
    photo?: FileEntity | null;
    order?: number;
  }>;
};

interface MenuSectionFormProps {
  restaurantId: string;
  restaurantName: string;
  initialData?: Partial<MenuSection>;
  onSubmit: (data: CreateMenuSectionDto) => Promise<void>;
  isEdit?: boolean;
  isLoading?: boolean;
}

export function MenuSectionForm({
  restaurantId,
  restaurantName,
  initialData = {},
  onSubmit,
  isEdit = false,
  isLoading = false,
}: MenuSectionFormProps) {
  const { t } = useTranslation("restaurant-menu-sections");
  const [menuItemsMap, setMenuItemsMap] = useState<Record<string, MenuItem>>(
    {}
  );
  const getMenuItemService = useGetMenuItemService();

  // Initialize form WITHOUT a yup schema to avoid type conflicts
  const methods = useForm<MenuSectionFormData>({
    defaultValues: {
      title: initialData.title || "",
      description: initialData.description || "",
      startTime: initialData.startTime || "",
      endTime: initialData.endTime || "",
      items:
        initialData.items?.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          description: item.description || "",
          price: item.price,
          photo: null,
          order: item.order || 0,
        })) || [],
    },
  });

  // Extract needed methods and properties
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = methods;

  // Use field array for managing the dynamic items list
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  // Fetch menu item details when selected
  const handleMenuItemSelect = async (menuItemId: string, index: number) => {
    try {
      // Check if we already have this menu item in our map
      if (!menuItemsMap[menuItemId]) {
        const { status, data } = await getMenuItemService({ id: menuItemId });
        if (status === HTTP_CODES_ENUM.OK && data) {
          setMenuItemsMap((prev) => ({
            ...prev,
            [menuItemId]: data,
          }));
          // Set default values for the item
          setValue(`items.${index}.name`, data.menuItemName);
          setValue(
            `items.${index}.description`,
            data.menuItemDescription || ""
          );
          // Set a default price (you might want to adjust this)
          setValue(`items.${index}.price`, 0);
        }
      } else {
        // Use cached data
        const menuItem = menuItemsMap[menuItemId];
        setValue(`items.${index}.name`, menuItem.menuItemName);
        setValue(
          `items.${index}.description`,
          menuItem.menuItemDescription || ""
        );
        setValue(`items.${index}.price`, 0);
      }
    } catch (error) {
      console.error("Error fetching menu item details:", error);
    }
  };

  // Handle drag and drop reordering
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  const onFormSubmit = async (formData: MenuSectionFormData) => {
    // Ensure order is set for each item based on its position in the array
    const itemsWithOrder: CreateSectionItemDto[] = formData.items.map(
      (item, index) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.photo?.path,
        order: index, // Set order based on position
      })
    );

    const submitData: CreateMenuSectionDto = {
      title: formData.title,
      description: formData.description,
      startTime: formData.startTime,
      endTime: formData.endTime,
      items: itemsWithOrder,
      restaurantId,
    };

    await onSubmit(submitData);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Stack gap="md">
          <Title order={4}>
            {isEdit ? t("editTitle") : t("createTitle")}{" "}
            {t("forRestaurant", { restaurantName })}
          </Title>
          <Controller
            name="title"
            control={control}
            rules={{ required: t("form.validation.titleRequired") }}
            render={({ field }) => (
              <TextInput
                {...field}
                label={t("form.title")}
                required
                error={errors.title?.message}
                disabled={isLoading}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                label={t("form.description")}
                error={errors.description?.message}
                disabled={isLoading}
              />
            )}
          />
          <Grid>
            <Grid.Col span={6}>
              <Controller
                name="startTime"
                control={control}
                rules={{
                  pattern: {
                    value: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    message: t("form.validation.timeFormat"),
                  },
                }}
                render={({ field }) => (
                  <TimeInput
                    {...field}
                    label={t("form.startTime")}
                    error={errors.startTime?.message}
                    disabled={isLoading}
                    placeholder="HH:MM"
                  />
                )}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Controller
                name="endTime"
                control={control}
                rules={{
                  pattern: {
                    value: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    message: t("form.validation.timeFormat"),
                  },
                }}
                render={({ field }) => (
                  <TimeInput
                    {...field}
                    label={t("form.endTime")}
                    error={errors.endTime?.message}
                    disabled={isLoading}
                    placeholder="HH:MM"
                  />
                )}
              />
            </Grid.Col>
          </Grid>
          <Box>
            <Text fw={500} mb="md">
              {t("form.items")}
            </Text>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="items">
                {(provided: DroppableProvided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {fields.length === 0 && (
                      <Text c="dimmed" ta="center" mb="md">
                        {t("form.noItems")}
                      </Text>
                    )}
                    {fields.map((field, index) => (
                      <Draggable
                        key={field.id}
                        draggableId={field.id}
                        index={index}
                      >
                        {(provided: DraggableProvided) => (
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
                                    {t("form.item")} #{index + 1}
                                  </Text>
                                </Group>
                                <ActionIcon
                                  color="red"
                                  onClick={() => remove(index)}
                                  disabled={isLoading}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Card.Section>
                            <Stack p="md" gap="md">
                              <Controller
                                name={`items.${index}.menuItemId`}
                                control={control}
                                rules={{
                                  required: t(
                                    "form.validation.menuItemRequired"
                                  ),
                                }}
                                render={({ field }) => (
                                  <MenuItemSearchSelect
                                    restaurantId={restaurantId}
                                    value={field.value}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      if (value) {
                                        handleMenuItemSelect(value, index);
                                      }
                                    }}
                                    error={
                                      errors.items?.[index]?.menuItemId?.message
                                    }
                                    disabled={isLoading}
                                  />
                                )}
                              />
                              <Controller
                                name={`items.${index}.name`}
                                control={control}
                                rules={{
                                  required: t("form.validation.nameRequired"),
                                }}
                                render={({ field }) => (
                                  <TextInput
                                    {...field}
                                    label={t("form.itemName")}
                                    required
                                    error={errors.items?.[index]?.name?.message}
                                    disabled={isLoading}
                                  />
                                )}
                              />
                              <Controller
                                name={`items.${index}.description`}
                                control={control}
                                render={({ field }) => (
                                  <Textarea
                                    {...field}
                                    label={t("form.itemDescription")}
                                    error={
                                      errors.items?.[index]?.description
                                        ?.message
                                    }
                                    disabled={isLoading}
                                  />
                                )}
                              />
                              <Controller
                                name={`items.${index}.price`}
                                control={control}
                                rules={{
                                  required: t("form.validation.priceRequired"),
                                  min: {
                                    value: 0,
                                    message: t("form.validation.pricePositive"),
                                  },
                                }}
                                render={({ field }) => (
                                  <NumberInput
                                    {...field}
                                    label={t("form.itemPrice")}
                                    required
                                    min={0}
                                    decimalScale={2}
                                    fixedDecimalScale
                                    error={
                                      errors.items?.[index]?.price?.message
                                    }
                                    disabled={isLoading}
                                  />
                                )}
                              />
                              <FormAvatarInput<MenuSectionFormData>
                                name={`items.${index}.photo`}
                                testId={`section-item-image-${index}`}
                              />
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
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() =>
                append({
                  menuItemId: "",
                  name: "",
                  description: "",
                  price: 0,
                  photo: null,
                })
              }
              mt="md"
              variant="outline"
              disabled={isLoading}
            >
              {t("form.addItem")}
            </Button>
          </Box>
          <Group mt="xl">
            <Button
              type="submit"
              loading={isLoading}
              disabled={fields.length === 0}
            >
              {isEdit ? t("form.update") : t("form.submit")}
            </Button>
            <Button
              variant="light"
              color="red"
              component={Link}
              href="/restaurant/menu-sections"
              disabled={isLoading}
            >
              {t("form.cancel")}
            </Button>
          </Group>
        </Stack>
      </form>
    </FormProvider>
  );
}
