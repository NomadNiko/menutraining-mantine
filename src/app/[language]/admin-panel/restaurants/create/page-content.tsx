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
import { usePostRestaurantService } from "@/services/api/services/restaurants";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { RestaurantPostRequest } from "@/services/api/types/restaurant";

type CreateRestaurantFormData = {
  name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-restaurants");
  return yup.object().shape({
    name: yup.string().required(t("form.validation.nameRequired")),
    email: yup
      .string()
      .email(t("form.validation.emailInvalid"))
      .nullable()
      .transform((value) => (value === null ? undefined : value)),
    phone: yup
      .string()
      .nullable()
      .transform((value) => (value === null ? undefined : value)),
    address: yup
      .string()
      .nullable()
      .transform((value) => (value === null ? undefined : value)),
    website: yup
      .string()
      .nullable()
      .transform((value) => (value === null ? undefined : value)),
    description: yup
      .string()
      .nullable()
      .transform((value) => (value === null ? undefined : value)),
  });
};

function CreateRestaurant() {
  const router = useRouter();
  const { t } = useTranslation("admin-panel-restaurants");
  const postRestaurantService = usePostRestaurantService();
  const { enqueueSnackbar } = useSnackbar();
  const { setLoading } = useGlobalLoading();
  const validationSchema = useValidationSchema();

  const methods = useForm<CreateRestaurantFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      email: null,
      phone: null,
      address: null,
      website: null,
      description: null,
    },
  });

  const { handleSubmit, setError, control } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    try {
      // Create a properly typed object with required fields
      const cleanData: RestaurantPostRequest = {
        name: formData.name,
        description:
          formData.description === "" ? undefined : formData.description,
        address: formData.address === "" ? undefined : formData.address,
        phone: formData.phone === "" ? undefined : formData.phone,
        email: formData.email === "" ? undefined : formData.email,
        website: formData.website === "" ? undefined : formData.website,
      };

      const { status, data } = await postRestaurantService(cleanData);

      // Rest of the function stays the same
      if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        (
          Object.keys(data.errors) as Array<keyof CreateRestaurantFormData>
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
        router.push("/admin-panel/restaurants");
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
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    label={t("form.name")}
                    error={fieldState.error?.message}
                    data-testid="restaurant-name"
                    required
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label={t("form.description")}
                    error={fieldState.error?.message}
                    data-testid="restaurant-description"
                  />
                )}
              />

              <Controller
                name="address"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label={t("form.address")}
                    error={fieldState.error?.message}
                    data-testid="restaurant-address"
                  />
                )}
              />

              <Controller
                name="phone"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label={t("form.phone")}
                    error={fieldState.error?.message}
                    data-testid="restaurant-phone"
                  />
                )}
              />

              <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label={t("form.email")}
                    error={fieldState.error?.message}
                    data-testid="restaurant-email"
                    type="email"
                  />
                )}
              />

              <Controller
                name="website"
                control={control}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label={t("form.website")}
                    error={fieldState.error?.message}
                    data-testid="restaurant-website"
                  />
                )}
              />

              <Box>
                <Button type="submit" mr="sm" size="compact-sm">
                  {t("form.submit")}
                </Button>
                <Button
                  variant="light"
                  color="red"
                  component={Link}
                  href="/admin-panel/restaurants"
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

export default CreateRestaurant;
