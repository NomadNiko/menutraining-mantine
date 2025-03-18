"use client";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "@/services/i18n/client";
import { useAuthLoginService } from "@/services/api/services/auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import useAuthTokens from "@/services/auth/use-auth-tokens";
import withPageRequiredGuest from "@/services/auth/with-page-required-guest";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { FormTextInput } from "@/components/mantine/form/TextInput";
import { Button } from "@/components/mantine/core/Button";
import { Container } from "@mantine/core";
import { Box, Divider, Stack, Text, Anchor } from "@mantine/core";
import Link from "@/components/link";
import { isGoogleAuthEnabled } from "@/services/social-auth/google/google-config";
import SocialAuth from "@/services/social-auth/social-auth";

type SignInFormData = {
  email: string;
  password: string;
};

function SignIn() {
  const { t } = useTranslation("sign-in");
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const fetchAuthLogin = useAuthLoginService();

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .email(t("sign-in:inputs.email.validation.invalid"))
      .required(t("sign-in:inputs.email.validation.required")),
    password: yup
      .string()
      .min(6, t("sign-in:inputs.password.validation.min"))
      .required(t("sign-in:inputs.password.validation.required")),
  });

  const methods = useForm<SignInFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleSubmit, setError } = methods;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    try {
      const { data, status } = await fetchAuthLogin(formData);
      if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
        (Object.keys(data.errors) as Array<keyof SignInFormData>).forEach(
          (key) => {
            setError(key, {
              type: "manual",
              message: t(
                `sign-in:inputs.${key}.validation.server.${data.errors[key]}`
              ),
            });
          }
        );
        return;
      }
      if (status === HTTP_CODES_ENUM.OK) {
        setTokensInfo({
          token: data.token,
          refreshToken: data.refreshToken,
          tokenExpires: data.tokenExpires,
        });
        setUser(data.user);
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <FormProvider {...methods}>
      <Container size="xs">
        <form onSubmit={onSubmit}>
          <Stack gap="md" mt="lg">
            <Text size="xl" fw={600}>
              {t("sign-in:title")}
            </Text>
            <FormTextInput<SignInFormData>
              name="email"
              label={t("sign-in:inputs.email.label")}
              type="email"
              testId="email"
              autoFocus
            />
            <FormTextInput<SignInFormData>
              name="password"
              label={t("sign-in:inputs.password.label")}
              type="password"
              testId="password"
            />
            <Anchor href="/forgot-password" data-testid="forgot-password">
              {t("sign-in:actions.forgotPassword")}
            </Anchor>
            <Box>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="sign-in-submit"
                mr="xs"
              >
                {t("sign-in:actions.submit")}
              </Button>
              {IS_SIGN_UP_ENABLED && (
                <Button
                  variant="outlined"
                  color="gray"
                  component={Link}
                  href="/sign-up"
                  data-testid="create-account"
                >
                  {t("sign-in:actions.createAccount")}
                </Button>
              )}
            </Box>
            {[isGoogleAuthEnabled].some(Boolean) && (
              <>
                <Divider label={t("sign-in:or")} labelPosition="center" />
                <SocialAuth />
              </>
            )}
          </Stack>
        </form>
      </Container>
    </FormProvider>
  );
}

export default withPageRequiredGuest(SignIn);
