"use client";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { Container, Stack, Box, Title, TextInput, Button } from "@mantine/core";
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
  useGetRestaurantService,
  usePatchRestaurantService,
} from "@/services/api/services/restaurants";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { RestaurantPatchRequest } from "@/services/api/types/restaurant";
import { useEffect } from "react";

type EditRestaurantFormData = {
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

function EditRestaurant() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation("admin-panel-restaurants");
  const getRestaurantService = useGetRestaurantService();
  const patchRestaurantService = usePatchRestaurantService();
  const { enqueueSnackbar } = useSnackbar();
  const { setLoading } = useGlobalLoading();
  const validationSchema = useValidationSchema();

  const methods = useForm<EditRestaurantFormData>({
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

  const { handleSubmit, setError, control, reset } = methods;

  // Load restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true);
      try {
        const { status, data } = await getRestaurantService({
          restaurantId: params.id,
        });
        if (status === HTTP_CODES_ENUM.OK) {
          reset({
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            website: data.website || null,
            description: data.description || null,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [getRestaurantService, params.id, reset, setLoading]);

  const onSubmit = handleSubmit(async (formData) => {
    setLoading(true);
    try {
      // Clean up empty string values to be undefined
      const cleanData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value === "") {
          acc[key as keyof RestaurantPatchRequest] = undefined;
        } else if (value !== null) {
          acc[key as keyof RestaurantPatchRequest] = value;
        }
        return acc;
      }, {} as RestaurantPatchRequest);

      const { status, data } = await patchRestaurantService(cleanData, {
        restaurantId: params.id,
      });

      if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        (
          Object.keys(data.errors) as Array<keyof EditRestaurantFormData>
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
              <Title order={4}>{t("editTitle")}</Title>

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
                  {t("form.update")}
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

export default EditRestaurant;
