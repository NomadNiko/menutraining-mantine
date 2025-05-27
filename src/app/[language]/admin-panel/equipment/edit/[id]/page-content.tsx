// src/app/[language]/admin-panel/equipment/edit/[id]/page-content.tsx
"use client";
import { useForm, FormProvider, Controller } from "react-hook-form";
import {
  Container,
  Stack,
  Box,
  Title,
  TextInput,
  Button,
  Image,
  Text,
} from "@mantine/core";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "@/components/link";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { useRouter, useParams } from "next/navigation";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import RouteGuard from "@/services/auth/route-guard";
import { RoleEnum } from "@/services/api/types/role";
import {
  useGetEquipmentItemService,
  usePatchEquipmentService,
} from "@/services/api/services/equipment";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { EquipmentPatchRequest } from "@/services/api/types/equipment";
import { useEffect, useState } from "react";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import { FileEntity } from "@/services/api/types/file-entity";

type EditEquipmentFormData = {
  equipmentName: string;
  photo?: FileEntity | null;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-equipment");
  return yup.object().shape({
    equipmentName: yup.string().required(t("form.validation.nameRequired")),
  });
};

function EditEquipment() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation("admin-panel-equipment");
  const getEquipmentService = useGetEquipmentItemService();
  const patchEquipmentService = usePatchEquipmentService();
  const { enqueueSnackbar } = useSnackbar();
  const { setLoading } = useGlobalLoading();
  const validationSchema = useValidationSchema();
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const methods = useForm<EditEquipmentFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      equipmentName: "",
      photo: null,
    },
  });

  const { handleSubmit, setError, reset, control, watch } = methods;
  const photo = watch("photo");

  // Load equipment data
  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      try {
        const { status, data } = await getEquipmentService({
          equipmentId: params.id,
        });
        if (status === HTTP_CODES_ENUM.OK) {
          reset({
            equipmentName: data.equipmentName,
            photo: null,
          });
          setCurrentImageUrl(data.equipmentImageUrl as string);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [getEquipmentService, params.id, reset, setLoading]);

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    try {
      // Use the new uploaded photo path if available, otherwise keep the existing URL
      const imageUrl = formData.photo?.path || currentImageUrl;

      // Create patch request
      const cleanData: EquipmentPatchRequest = {
        equipmentName: formData.equipmentName,
        equipmentImageUrl: imageUrl,
      };

      const { status, data } = await patchEquipmentService(cleanData, {
        equipmentId: params.id,
      });

      if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        (
          Object.keys(data.errors) as Array<keyof EditEquipmentFormData>
        ).forEach((key) => {
          setError(key, {
            type: "manual",
            message: t(`form.validation.server.${data.errors[key]}`),
          });
        });
        return;
      }

      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t("updateSuccess"), {
          variant: "success",
        });
        router.push("/admin-panel/equipment");
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <RouteGuard roles={[RoleEnum.ADMIN]}>
      <FormProvider {...methods}>
        <Container size="xs">
          <form onSubmit={onSubmit}>
            <Stack gap="md" py="md">
              <Title order={4}>{t("editTitle")}</Title>
              <Controller
                name="equipmentName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t("form.name")}
                    error={fieldState.error?.message}
                    data-testid="equipment-name"
                    required
                  />
                )}
              />

              {/* Current image thumbnail */}
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

              <FormAvatarInput<EditEquipmentFormData>
                name="photo"
                testId="equipment-image"
              />

              <Box>
                <Button type="submit" mr="sm" size="compact-sm">
                  {t("form.update")}
                </Button>
                <Button
                  variant="light"
                  color="red"
                  component={Link}
                  href="/admin-panel/equipment"
                  size="compact-sm"
                >
                  {t("form.cancel")}
                </Button>
              </Box>
            </Stack>
          </form>
        </Container>
      </FormProvider>
    </RouteGuard>
  );
}

export default EditEquipment;
