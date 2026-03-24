import type { PresetId } from '../types/camera';

export interface FilterTint {
  /** Overlay color in rgba */
  color: string;
  /** Additional brightness adjustment via white overlay (0-1) */
  brightnessLift: number;
}

/**
 * Color tints based on real camera color science research:
 *
 * Instax Mini 12:
 *   - Fuji instant film leans BLUE (not warm like Polaroid)
 *   - Soft contrast, slightly overexposed, reduced dynamic range
 *   - Blues come out very dark, greens shift toward orange when overexposed
 *   - Enhanced saturation curve around normal exposure
 *   Source: emulsive.org, roberthammphotography.com, digitalcameraworld.com
 *
 * Instax Wide 300:
 *   - Same Fuji instant film chemistry as Mini (cool/blue shift)
 *   - Slightly more vignetting at edges due to wider field
 *   - Vivid colors, natural skin tones, ISO 800 film
 *   Source: fujifilm.com, dpreview.com
 *
 * Canon IXUS 130 CCD:
 *   - CCD sensors produce punchy, vivid colors with deep blues
 *   - Warm skin tones, thick midtones, gentle highlight roll-off
 *   - Slightly soft at default sharpness ("old digital charm")
 *   - Elevated saturation compared to modern CMOS sensors
 *   Source: 35mmc.com, dutchthrift.com, cameralabs.com, photographyblog.com
 */
export const FILTER_TINTS: Record<PresetId, FilterTint> = {
  'instax-mini-12': {
    // Fuji instant film: cool BLUE shift (not warm), soft, slightly overexposed
    color: 'rgba(140, 170, 220, 0.14)',
    brightnessLift: 0.08,
  },
  'instax-wide-300': {
    // Same Fuji film chemistry as Mini but slightly less pronounced
    // Wide format shows more vignetting — handled by separate overlay if needed
    color: 'rgba(150, 175, 210, 0.11)',
    brightnessLift: 0.05,
  },
  'ixus-130': {
    // CCD: warm punchy colors, deep blues, thick midtones, elevated saturation
    // Slightly warm amber cast with a hint of the CCD "glow"
    color: 'rgba(255, 210, 160, 0.09)',
    brightnessLift: 0.0,
  },
};
