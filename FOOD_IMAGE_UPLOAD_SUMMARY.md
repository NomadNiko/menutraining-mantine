# Food Image Upload Feature Summary

## Overview
I've implemented a new food image upload system that ensures all food-related images meet specific requirements for consistency and performance.

## Key Features

### 1. **Image Requirements**
- All images must be square (1:1 aspect ratio)
- Minimum size: 300x300 pixels
- Maximum size: 600x600 pixels
- Format: JPEG for optimal file size and load times

### 2. **New Components**

#### `FoodImageCropper` (/src/components/form/food-image-cropper/food-image-cropper.tsx)
- Modal interface for cropping images
- Canvas-based implementation for client-side processing
- Features:
  - Drag to reposition image
  - Slider for scaling (10% to 300%)
  - Rotation controls (90° increments)
  - Live preview of crop area
  - Reset button to restore original position

#### `FormFoodImageInput` (/src/components/form/food-image-input/food-image-input.tsx)
- Drop-in replacement for the previous avatar/image inputs
- Features:
  - Drag & drop support
  - File validation before cropping
  - Visual feedback for drag states
  - Error handling for invalid images
  - Automatic JPEG conversion
  - 300x300px square preview

### 3. **Integration**
The new image upload component has been integrated into:
- Ingredient forms
- Menu item forms
- Recipe forms

### 4. **User Experience**
1. User selects/drops an image file
2. Image dimensions are validated
3. If valid, the cropper modal opens
4. User adjusts position, scale, and rotation
5. On save, image is cropped to 300x300px and converted to JPEG
6. Cropped image is uploaded to the server

### 5. **Technical Details**
- Uses HTML5 Canvas API for image manipulation
- Client-side processing reduces server load
- Automatic scaling for oversized images
- Maintains high quality (90% JPEG compression)
- Responsive design with Mantine UI components

## Benefits
1. **Consistency**: All food images are uniform in size and format
2. **Performance**: Optimized file sizes for faster loading
3. **User Control**: Intuitive cropping interface
4. **Quality**: High-quality JPEG compression
5. **Accessibility**: Clear error messages and visual feedback

## Translation Keys Added
New translation keys have been added to support internationalization:
- `common:formInputs.foodImageInput.*`
- `common:formInputs.foodImageCropper.*`

The implementation is complete and ready for use across all food-related forms in the application.