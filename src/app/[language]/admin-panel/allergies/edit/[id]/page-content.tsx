// src/app/[language]/admin-panel/allergies/edit/[id]/page-content.tsx
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
  useGetAllergyService,
  usePatchAllergyService,
} from "@/services/api/services/allergies";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { AllergyPatchRequest } from "@/services/api/types/allergy";
import { useEffect, useState } from "react";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import { FileEntity } from "@/services/api/types/file-entity";

type EditAllergyFormData = {
  allergyName: string;
  photo?: FileEntity | null;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-allergies");
  return yup.object().shape({
    allergyName: yup.string().required(t("form.validation.nameRequired")),
  });
};

function EditAllergy() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation("admin-panel-allergies");
  const getAllergyService = useGetAllergyService();
  const patchAllergyService = usePatchAllergyService();
  const { enqueueSnackbar } = useSnackbar();
  const { setLoading } = useGlobalLoading();
  const validationSchema = useValidationSchema();
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);

  const methods = useForm<EditAllergyFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      allergyName: "",
      photo: null,
    },
  });

  const { handleSubmit, setError, reset, control, watch } = methods;
  const photo = watch("photo");

  // Load allergy data
  useEffect(() => {
    const fetchAllergy = async () => {
      setLoading(true);
      try {
        const { status, data } = await getAllergyService({ id: params.id });
        if (status === HTTP_CODES_ENUM.OK) {
          reset({
            allergyName: data.allergyName,
            photo: null,
          });
          setCurrentLogoUrl(data.allergyLogoUrl as string);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAllergy();
  }, [getAllergyService, params.id, reset, setLoading]);

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    try {
      // Use the new uploaded photo path if available, otherwise keep the existing URL
      const logoUrl = formData.photo?.path || currentLogoUrl;

      // Create patch request
      const cleanData: AllergyPatchRequest = {
        allergyName: formData.allergyName,
        allergyLogoUrl: logoUrl,
      };

      const { status, data } = await patchAllergyService(cleanData, {
        id: params.id,
      });

      if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        (Object.keys(data.errors) as Array<keyof EditAllergyFormData>).forEach(
          (key) => {
            setError(key, {
              type: "manual",
              message: t(`form.validation.server.${data.errors[key]}`),
            });
          }
        );
        return;
      }

      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t("updateSuccess"), {
          variant: "success",
        });
        router.push("/admin-panel/allergies");
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
                name="allergyName"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t("form.name")}
                    error={fieldState.error?.message}
                    data-testid="allergy-name"
                    required
                  />
                )}
              />

              {/* Current image thumbnail */}
              {currentLogoUrl && !photo && (
                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    {t("form.currentLogo")}
                  </Text>
                  <Image
                    src={currentLogoUrl}
                    alt={t("form.logoAlt")}
                    width={100}
                    height={100}
                    fit="contain"
                    radius="md"
                  />
                </Box>
              )}

              <FormAvatarInput<EditAllergyFormData>
                name="photo"
                testId="allergy-logo"
              />

              <Box>
                <Button type="submit" mr="sm" size="compact-sm">
                  {t("form.update")}
                </Button>
                <Button
                  variant="light"
                  color="red"
                  component={Link}
                  href="/admin-panel/allergies"
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

export default EditAllergy;
