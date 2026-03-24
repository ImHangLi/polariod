import { useMemo } from 'react';
import type { LensInfo, LensMappingResult } from '../types/camera';

/**
 * Pure function: maps a target 35mm-equivalent focal length to the best
 * physical lens and zoom value.
 *
 * Strategy:
 * 1. Find the lens whose base focal length is closest to (but not exceeding) the target.
 * 2. If no lens is shorter than target, use the shortest available lens.
 * 3. Calculate zoom factor = targetFocal / lensFocal.
 * 4. Map zoom factor to Expo's 0-1 zoom prop value.
 */
export function mapFocalLength(
  targetFocal: number,
  lenses: LensInfo[],
): LensMappingResult {
  if (lenses.length === 0) {
    return { selectedLens: 'builtInWideAngleCamera', zoomValue: 0, isDigitalCrop: false };
  }

  const sorted = [...lenses].sort((a, b) => a.focalLength35mm - b.focalLength35mm);

  let bestLens = sorted[0];
  for (const lens of sorted) {
    if (lens.focalLength35mm <= targetFocal) {
      bestLens = lens;
    }
  }

  const zoomFactor = targetFocal / bestLens.focalLength35mm;

  if (zoomFactor <= 1.0) {
    return {
      selectedLens: bestLens.deviceType,
      zoomValue: 0,
      isDigitalCrop: false,
    };
  }

  const range = bestLens.maxZoomFactor - bestLens.minZoomFactor;
  const zoomValue = (zoomFactor - bestLens.minZoomFactor) / range;

  return {
    selectedLens: bestLens.deviceType,
    zoomValue: Math.min(Math.max(zoomValue, 0), 1),
    isDigitalCrop: zoomFactor > bestLens.maxOpticalZoomFactor,
  };
}

/**
 * Hook that returns the lens mapping for a given focal length.
 * Uses useMemo to avoid render-cycle delay.
 */
export function useLensMapping(targetFocal: number, lenses: LensInfo[]): LensMappingResult {
  return useMemo(() => mapFocalLength(targetFocal, lenses), [targetFocal, lenses]);
}
