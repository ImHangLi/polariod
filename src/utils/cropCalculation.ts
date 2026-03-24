import type { AspectRatio } from '../types/camera';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates the crop rectangle for a given aspect ratio within a screen.
 * The crop is centered and fits the maximum width, since we're in portrait mode
 * and all our target ratios are landscape (wider than tall).
 */
export function calculateCropRect(
  aspectRatio: AspectRatio,
  screenWidth: number,
  screenHeight: number,
): CropRect {
  const ratio = aspectRatio.height / aspectRatio.width;
  const cropWidth = screenWidth;
  const cropHeight = screenWidth * ratio;

  if (cropHeight > screenHeight) {
    const constrainedWidth = screenHeight / ratio;
    return {
      x: (screenWidth - constrainedWidth) / 2,
      y: 0,
      width: constrainedWidth,
      height: screenHeight,
    };
  }

  return {
    x: 0,
    y: (screenHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}
