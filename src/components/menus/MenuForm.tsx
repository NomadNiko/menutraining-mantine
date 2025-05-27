// src/components/menus/MenuForm.tsx
"use client";
import { useForm } from "react-hook-form";
import {
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Title,
  Text,
  MultiSelect,
  Box,
  Paper,
} from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/services/i18n/client";
import Link from "@/components/link";
import {
  DayOfWeek,
  Menu,
  CreateMenuDto,
  UpdateMenuDto,
} from "@/services/api/types/menu";
import { MenuSection } from "@/services/api/types/menu-section";
import { useGetMenuSectionsService } from "@/services/api/services/menu-sections";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
} from "@hello-pangea/dnd";
import { IconGripVertical } from "@tabler/icons-react";

// Define form data structure that matches what the API expects
type MenuFormData = {
  name: string;
  description?: string;
  activeDays: DayOfWeek[];
  menuSections: string[];
  startTime?: string;
  endTime?: string;
  restaurantId: string;
};

interface MenuFormProps {
  restaurantId: string;
  restaurantName: string;
  initialData?: Partial<Menu>;
  onSubmit: (data: CreateMenuDto | UpdateMenuDto) => Promise<void>;
  isEdit?: boolean;
  isLoading?: boolean;
}

export function MenuForm({
  restaurantId,
  restaurantName,
  initialData = {},
  onSubmit,
  isEdit = false,
  isLoading = false,
}: MenuFormProps) {
  const { t } = useTranslation("restaurant-menus");
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const getMenuSectionsService = useGetMenuSectionsService();

  // Get all days of the week for default selection
  const allDaysOfWeek = Object.values(DayOfWeek);

  // Form with direct validation rules instead of yup schema
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MenuFormData>({
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      // Set all days as default if no initial data, otherwise use initial data
      activeDays: initialData?.activeDays?.length
        ? initialData.activeDays
        : allDaysOfWeek,
      startTime: initialData?.startTime || "",
      endTime: initialData?.endTime || "",
      menuSections: initialData?.menuSections || [],
      restaurantId,
    },
  });

  // Watch menu sections value
  const selectedSectionIds = watch("menuSections");

  // Load all menu sections
  useEffect(() => {
    const fetchMenuSections = async () => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        const { status, data } = await getMenuSectionsService(undefined, {
          restaurantId,
          limit: 300,
        });
        if (status === HTTP_CODES_ENUM.OK) {
          const menuSectionsData = Array.isArray(data)
            ? data
            : data?.data || [];
          setMenuSections(menuSectionsData);
        }
      } catch (error) {
        console.error("Error fetching menu sections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuSections();
  }, [restaurantId, getMenuSectionsService]);

  // Get selected sections objects based on IDs
  const selectedSections = useMemo(() => {
    if (!selectedSectionIds || !menuSections.length) return [];

    return selectedSectionIds
      .map((id) => menuSections.find((section) => section.menuSectionId === id))
      .filter(Boolean) as MenuSection[];
  }, [selectedSectionIds, menuSections]);

  // Handle drag and drop
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(selectedSectionIds || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setValue("menuSections", items);
  };

  // Map day of week options
  const daysOfWeekOptions = Object.values(DayOfWeek).map((day) => ({
    value: day,
    label: t(`days.${day}`),
  }));

  // Map section options with the correct id field
  const sectionOptions = useMemo(() => {
    return menuSections.map((section) => ({
      value: section.menuSectionId,
      label: section.title,
    }));
  }, [menuSections]);

  const validateForm = (formData: MenuFormData) => {
    const errors: Record<string, string> = {};
    if (!formData.name) {
      errors.name = t("form.validation.nameRequired");
    }
    if (!formData.activeDays || formData.activeDays.length === 0) {
      errors.activeDays = t("form.validation.activeDaysRequired");
    }
    if (!formData.menuSections || formData.menuSections.length === 0) {
      errors.menuSections = t("form.validation.sectionsRequired");
    }
    if (
      formData.startTime &&
      !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.startTime)
    ) {
      errors.startTime = t("form.validation.timeFormat");
    }
    if (
      formData.endTime &&
      !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.endTime)
    ) {
      errors.endTime = t("form.validation.timeFormat");
    }
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (data: MenuFormData) => {
    if (validateForm(data)) {
      onSubmit(data);
    }
  };

  // Handler for menu section selection
  const handleSectionChange = (values: string[]) => {
    setValue("menuSections", values);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack gap="md">
        <Title order={4}>
          {isEdit ? t("editTitle") : t("createTitle")}{" "}
          {t("forRestaurant", { restaurantName })}
        </Title>
        <TextInput
          {...register("name", { required: t("form.validation.nameRequired") })}
          label={t("form.name")}
          required
          error={errors.name?.message}
          disabled={isLoading}
        />
        <Textarea
          {...register("description")}
          label={t("form.description")}
          error={errors.description?.message}
          disabled={isLoading}
        />
        <MultiSelect
          data={daysOfWeekOptions}
          label={t("form.activeDays")}
          placeholder={t("form.selectDays")}
          required
          error={errors.activeDays?.message}
          onChange={(value) => setValue("activeDays", value as DayOfWeek[])}
          value={watch("activeDays") || []}
          disabled={isLoading}
        />
        <Group grow>
          <TimeInput
            label={t("form.startTime")}
            error={errors.startTime?.message}
            disabled={isLoading}
            placeholder="HH:MM"
            onChange={(e) => setValue("startTime", e.currentTarget.value)}
            value={watch("startTime") || ""}
          />
          <TimeInput
            label={t("form.endTime")}
            error={errors.endTime?.message}
            disabled={isLoading}
            placeholder="HH:MM"
            onChange={(e) => setValue("endTime", e.currentTarget.value)}
            value={watch("endTime") || ""}
          />
        </Group>
        <Box>
          {loading ? (
            <Text size="sm" mt="sm" mb="sm" color="dimmed">
              {t("form.loadingSections")}
            </Text>
          ) : null}
          <MultiSelect
            data={sectionOptions}
            label={t("form.sections")}
            placeholder={t("form.selectSections")}
            required
            error={errors.menuSections?.message}
            onChange={handleSectionChange}
            value={selectedSectionIds || []}
            disabled={isLoading || loading}
            searchable
          />
          {selectedSections.length > 0 && (
            <Box mt="md">
              <Text fw={500} mb="xs">
                {t("form.sectionOrder")}
              </Text>
              <Paper p="sm" withBorder>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="sections">
                    {(provided: DroppableProvided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {selectedSections.map((section, index) => (
                          <Draggable
                            key={section.menuSectionId}
                            draggableId={section.menuSectionId}
                            index={index}
                          >
                            {(provided: DraggableProvided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Group
                                  p="xs"
                                  mb="xs"
                                  bg="gray.0"
                                  style={{ borderRadius: "4px" }}
                                >
                                  <IconGripVertical size={16} />
                                  <Text>
                                    {index + 1}. {section.title}
                                  </Text>
                                </Group>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </Paper>
            </Box>
          )}
        </Box>
        <Group mt="xl">
          <Button
            type="submit"
            loading={isLoading}
            disabled={!selectedSectionIds?.length}
          >
            {isEdit ? t("form.update") : t("form.submit")}
          </Button>
          <Button
            variant="light"
            color="red"
            component={Link}
            href="/restaurant/menus"
            disabled={isLoading}
          >
            {t("form.cancel")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
