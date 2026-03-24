import type { PresetId } from '../types/camera';

export interface FilterTint {
  /** Overlay color in rgba */
  color: string;
  /** Additional brightness adjustment via white overlay (0-1) */
  brightnessLift: number;
}

export const FILTER_TINTS: Record<PresetId, FilterTint> = {
  'instax-mini-12': {
    color: 'rgba(180, 220, 230, 0.12)', // Cool cyan tint, washed out
    brightnessLift: 0.06,
  },
  'instax-wide-300': {
    color: 'rgba(210, 195, 170, 0.10)', // Warm amber tint
    brightnessLift: 0.03,
  },
  'ixus-130': {
    color: 'rgba(240, 200, 140, 0.08)', // Warm high-saturation CCD look
    brightnessLift: 0.0,
  },
};
