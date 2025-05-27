"use client";
import { useFileUploadService } from "@/services/api/services/files";
import { FileEntity } from "@/services/api/types/file-entity";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  Box,
  Text,
  Paper,
  Button,
  Group,
  ActionIcon,
  Image as MantineImage,
  useMantineTheme,
} from "@mantine/core";
import { IconX, IconUpload } from "@tabler/icons-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FoodImageCropper } from "../food-image-cropper/food-image-cropper";

type FoodImageInputProps = {
  error?: string;
  onChange: (value: FileEntity | null) => void;
  onBlur: () => void;
  value?: FileEntity;
  disabled?: boolean;
  testId?: string;
  label?: React.ReactNode;
};

function FoodImageInput(props: FoodImageInputProps) {
  const { onChange } = props;
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [cropperOpened, setCropperOpened] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fetchFileUpload = useFileUploadService();
  const theme = useMantineTheme();

  const validateImageDimensions = useCallback(
    (file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const { width, height } = img;
          URL.revokeObjectURL(img.src);

          if (width < 300 || height < 300) {
            setValidationError(
              t(
                "common:formInputs.foodImageInput.tooSmallError",
                "Image is too small. Minimum size is 300x300 pixels."
              )
            );
            resolve(false);
          } else if (width > 600 || height > 600) {
            // Image will be scaled down in the cropper
            resolve(true);
          } else {
            resolve(true);
          }
        };
        img.onerror = () => {
          setValidationError(
            t(
              "common:formInputs.foodImageInput.invalidImage",
              "Invalid image file."
            )
          );
          resolve(false);
        };
        img.src = URL.createObjectURL(file);
      });
    },
    [t]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setValidationError(null);

      // Validate image dimensions
      const isValid = await validateImageDimensions(file);
      if (!isValid) return;

      // Open cropper modal
      setSelectedFile(file);
      setCropperOpened(true);
    },
    [validateImageDimensions]
  );

  const handleCroppedImage = useCallback(
    async (croppedBlob: Blob) => {
      setIsLoading(true);
      setCropperOpened(false);

      try {
        // Create a File object from the Blob
        const croppedFile = new File(
          [croppedBlob],
          selectedFile?.name || "food-image.jpg",
          { type: "image/jpeg" }
        );

        const { status, data } = await fetchFileUpload(croppedFile);
        if (status === HTTP_CODES_ENUM.CREATED) {
          onChange(data.file);
        }
      } catch (error) {
        console.error("Upload failed:", error);
        setValidationError(
          t(
            "common:formInputs.foodImageInput.uploadError",
            "Failed to upload image. Please try again."
          )
        );
      } finally {
        setIsLoading(false);
        setSelectedFile(null);
      }
    },
    [fetchFileUpload, onChange, selectedFile, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB max file size
    disabled: isLoading || props.disabled,
  });

  const removeImageHandle = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.stopPropagation();
    onChange(null);
    setValidationError(null);
  };

  return (
    <>
      <Paper
        {...getRootProps()}
        p={theme.spacing.md}
        mt={theme.spacing.md}
        withBorder
        data-testid={`${props.testId}-wrapper`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: theme.spacing.md,
          border: isDragActive
            ? `2px dashed ${theme.colors.blue[6]}`
            : `2px dashed ${theme.colors.gray[4]}`,
          borderRadius: theme.radius.md,
          cursor: "pointer",
          position: "relative",
          backgroundColor: isDragActive ? theme.colors.blue[0] : "transparent",
          transition: "all 0.2s ease",
        }}
      >
        {isDragActive && (
          <Box
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radius.md,
            }}
          >
            <Text size="lg" fw="bold" ta="center">
              {t(
                "common:formInputs.foodImageInput.dropzoneText",
                "Drop your image here"
              )}
            </Text>
          </Box>
        )}

        {props?.value ? (
          <Box
            style={{
              position: "relative",
              width: 300,
              height: 300,
              marginBottom: theme.spacing.md,
            }}
          >
            <MantineImage
              src={props.value.path}
              alt={t("common:formInputs.foodImageInput.imageAlt", "Food image")}
              fit="cover"
              w={300}
              h={300}
              radius="md"
            />
            <ActionIcon
              color="red"
              variant="filled"
              onClick={removeImageHandle}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 2,
              }}
              size="lg"
            >
              <IconX size={20} />
            </ActionIcon>
          </Box>
        ) : (
          <Box
            style={{
              width: 300,
              height: 300,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.gray[1],
              borderRadius: theme.radius.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <IconUpload size={48} color={theme.colors.gray[5]} />
            <Text size="sm" c="dimmed" mt="md">
              {t(
                "common:formInputs.foodImageInput.placeholder",
                "Upload food image"
              )}
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              {t(
                "common:formInputs.foodImageInput.requirements",
                "300-600px square, JPEG"
              )}
            </Text>
          </Box>
        )}

        <Group mt={props.value ? 0 : theme.spacing.md}>
          <Button
            loading={isLoading}
            data-testid={props.testId}
            size="compact-sm"
            leftSection={<IconUpload size={16} />}
          >
            {isLoading
              ? t("common:loading")
              : props.value
                ? t(
                    "common:formInputs.foodImageInput.changeImage",
                    "Change Image"
                  )
                : t(
                    "common:formInputs.foodImageInput.selectFile",
                    "Select Image"
                  )}
            <input {...getInputProps()} />
          </Button>
        </Group>

        <Text mt="xs" size="sm" c="dimmed">
          {t(
            "common:formInputs.foodImageInput.dragAndDrop",
            "or drag and drop your image here"
          )}
        </Text>

        {(props.error || validationError) && (
          <Text color="red" size="sm" mt="xs">
            {props.error || validationError}
          </Text>
        )}
      </Paper>

      {selectedFile && (
        <FoodImageCropper
          opened={cropperOpened}
          onClose={() => {
            setCropperOpened(false);
            setSelectedFile(null);
          }}
          onCrop={handleCroppedImage}
          imageFile={selectedFile}
        />
      )}
    </>
  );
}

function FormFoodImageInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: Pick<ControllerProps<TFieldValues, TName>, "name" | "defaultValue"> & {
    disabled?: boolean;
    testId?: string;
    label?: React.ReactNode;
  }
) {
  return (
    <Controller
      name={props.name}
      defaultValue={props.defaultValue}
      render={({ field, fieldState }) => (
        <FoodImageInput
          onChange={field.onChange}
          onBlur={field.onBlur}
          value={field.value}
          error={fieldState.error?.message}
          disabled={props.disabled}
          testId={props.testId}
          label={props.label}
        />
      )}
    />
  );
}

export default FormFoodImageInput;
