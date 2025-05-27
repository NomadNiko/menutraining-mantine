"use client";
import React, { useState, useCallback } from "react";
import {
  Modal,
  Box,
  Button,
  Group,
  Text,
  Slider,
  Paper,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop/types";

interface FoodImageCropperProps {
  opened: boolean;
  onClose: () => void;
  onCrop: (croppedImageBlob: Blob) => void;
  imageFile: File;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped image using getImageData
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // Set canvas width to final desired crop size (300x300)
  canvas.width = 300;
  canvas.height = 300;

  // Clear the canvas
  ctx.clearRect(0, 0, 300, 300);

  // Create a temporary canvas to hold the crop data
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = pixelCrop.width;
  tempCanvas.height = pixelCrop.height;
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) {
    return null;
  }

  // Put the image data on the temp canvas
  tempCtx.putImageData(data, 0, 0);

  // Draw the temp canvas scaled to 300x300 on the final canvas
  ctx.drawImage(
    tempCanvas,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    300,
    300
  );

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.9
    );
  });
}

export function FoodImageCropper({
  opened,
  onClose,
  onCrop,
  imageFile,
}: FoodImageCropperProps) {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load image when modal opens
  React.useEffect(() => {
    if (opened && imageFile) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(imageFile);
    }
  }, [opened, imageFile]);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        { horizontal: false, vertical: false }
      );
      if (croppedImage) {
        onCrop(croppedImage);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("common:formInputs.foodImageCropper.title", "Crop Food Image")}
      size="lg"
      centered
    >
      <Stack gap="md">
        <Paper p="sm" bg="blue.1" c="blue.9">
          <Text size="sm">
            {t(
              "common:formInputs.foodImageCropper.instructions",
              "Drag to reposition, use the slider to scale, and scroll to zoom. Final image will be 300x300 pixels in JPEG format."
            )}
          </Text>
        </Paper>

        <Box
          style={{
            position: "relative",
            width: "100%",
            height: 400,
            backgroundColor: theme.colors.gray[2],
          }}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              cropShape="rect"
              showGrid={true}
              style={{
                containerStyle: {
                  backgroundColor: theme.colors.gray[2],
                },
                cropAreaStyle: {
                  border: `3px solid ${theme.colors.blue[5]}`,
                },
              }}
            />
          )}
        </Box>

        <Stack gap="sm">
          <Box>
            <Text size="sm" mb="xs">
              {t("common:formInputs.foodImageCropper.scale", "Zoom")}:{" "}
              {Math.round(zoom * 100)}%
            </Text>
            <Slider
              value={zoom}
              onChange={setZoom}
              min={1}
              max={3}
              step={0.1}
              marks={[
                { value: 1, label: "100%" },
                { value: 2, label: "200%" },
                { value: 3, label: "300%" },
              ]}
            />
          </Box>

          <Box>
            <Text size="sm" mb="xs">
              {t("common:formInputs.foodImageCropper.rotation", "Rotation")}:{" "}
              {rotation}°
            </Text>
            <Slider
              value={rotation}
              onChange={setRotation}
              min={0}
              max={360}
              step={1}
              marks={[
                { value: 0, label: "0°" },
                { value: 90, label: "90°" },
                { value: 180, label: "180°" },
                { value: 270, label: "270°" },
                { value: 360, label: "360°" },
              ]}
            />
          </Box>
        </Stack>

        <Group justify="space-between">
          <Button variant="light" onClick={handleReset}>
            {t("common:formInputs.foodImageCropper.reset", "Reset")}
          </Button>
          <Group>
            <Button variant="light" onClick={onClose}>
              {t("common:cancel", "Cancel")}
            </Button>
            <Button onClick={handleCrop} loading={loading}>
              {t("common:formInputs.foodImageCropper.crop", "Crop & Save")}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
