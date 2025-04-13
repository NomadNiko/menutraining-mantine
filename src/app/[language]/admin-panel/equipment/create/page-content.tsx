// src/app/[language]/admin-panel/equipment/create/page-content.tsx
"use client";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { Container, Stack, Box, Title, TextInput, Button } from "@mantine/core";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "@/components/link";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import RouteGuard from "@/services/auth/route-guard";
import { RoleEnum } from "@/services/api/types/role";
import { usePostEquipmentService } from "@/services/api/services/equipment";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { EquipmentPostRequest } from "@/services/api/types/equipment";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import { FileEntity } from "@/services/api/types/file-entity";

type CreateEquipmentFormData = {
  equipmentName: string;
  photo?: FileEntity | null;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-equipment");
  return yup.object().shape({
    equipmentName: yup.string().required(t("form.validation.nameRequired")),
  });
};

function CreateEquipment() {
  const router = useRouter();
  const { t } = useTranslation("admin-panel-equipment");
  const postEquipmentService = usePostEquipmentService();
  const { enqueueSnackbar } = useSnackbar();
  const { setLoading } = useGlobalLoading();
  const validationSchema = useValidationSchema();

  const methods = useForm<CreateEquipmentFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      equipmentName: "",
      photo: null,
    },
  });

  const { handleSubmit, setError, control } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    try {
      // Create a properly typed object
      const cleanData: EquipmentPostRequest = {
        equipmentName: formData.equipmentName,
        equipmentImageUrl: formData.photo?.path || null,
      };

      const { status, data } = await postEquipmentService(cleanData);

      if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        (
          Object.keys(data.errors) as Array<keyof CreateEquipmentFormData>
        ).forEach((key) => {
          setError(key, {
            type: "manual",
            message: t(`form.validation.server.${data.errors[key]}`),
          });
        });
        return;
      }

      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(t("createSuccess"), {
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
              <Title order={4}>{t("createTitle")}</Title>
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
              <FormAvatarInput<CreateEquipmentFormData>
                name="photo"
                testId="equipment-image"
              />
              <Box>
                <Button type="submit" mr="sm" size="compact-sm">
                  {t("form.submit")}
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

export default CreateEquipment;
