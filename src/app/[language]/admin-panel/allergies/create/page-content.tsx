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
import { usePostAllergyService } from "@/services/api/services/allergies";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { AllergyPostRequest } from "@/services/api/types/allergy";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import { FileEntity } from "@/services/api/types/file-entity";

type CreateAllergyFormData = {
  allergyName: string;
  photo?: FileEntity | null;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-allergies");
  return yup.object().shape({
    allergyName: yup.string().required(t("form.validation.nameRequired")),
    // Only validate the photo, not the URL
  });
};

function CreateAllergy() {
  const router = useRouter();
  const { t } = useTranslation("admin-panel-allergies");
  const postAllergyService = usePostAllergyService();
  const { enqueueSnackbar } = useSnackbar();
  const { setLoading } = useGlobalLoading();
  const validationSchema = useValidationSchema();

  const methods = useForm<CreateAllergyFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      allergyName: "",
      photo: null,
    },
  });

  const { handleSubmit, setError, control } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    try {
      // Create a properly typed object
      const cleanData: AllergyPostRequest = {
        allergyName: formData.allergyName,
        allergyLogoUrl: formData.photo?.path || null,
      };

      const { status, data } = await postAllergyService(cleanData);

      if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        (
          Object.keys(data.errors) as Array<keyof CreateAllergyFormData>
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
              <Title order={4}>{t("createTitle")}</Title>

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

              <FormAvatarInput<CreateAllergyFormData>
                name="photo"
                testId="allergy-logo"
              />

              <Box>
                <Button type="submit" mr="sm" size="compact-sm">
                  {t("form.submit")}
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

export default CreateAllergy;
