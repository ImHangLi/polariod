export interface AspectRatio {
  /** Width component of the ratio (e.g., 31 for Instax Mini's 31:23) */
  width: number;
  /** Height component of the ratio */
  height: number;
}

export interface FlashConfig {
  /** Default flash mode for this preset */
  defaultMode: 'auto' | 'on' | 'off';
  /** Whether the user can change flash mode */
  userSelectable: boolean;
}

export type FlashMode = 'auto' | 'on' | 'off';

export type PresetId = 'instax-mini-12' | 'instax-wide-300' | 'ixus-130';

export interface CameraPreset {
  id: PresetId;
  name: string;
  /** Real camera model name for display */
  displayName: string;
  /** Image area aspect ratio from real camera specs */
  aspectRatio: AspectRatio;
  /** Default focal length in 35mm equivalent */
  focalLength35mmEquiv: number;
  /** Available zoom stops in 35mm equiv. Only for zoom cameras like IXUS. */
  zoomStops?: number[];
  /** Flash configuration */
  flash: FlashConfig;
  /** Whether this preset has an optional color filter */
  hasFilter: boolean;
}

/**
 * Lens metadata returned by the native LensInfoModule.
 * Each entry represents one physical camera lens on the device.
 */
export interface LensInfo {
  /** AVCaptureDevice lens identifier (e.g., 'builtInWideAngleCamera') */
  deviceType: string;
  /** Base focal length in 35mm equivalent with no zoom applied */
  focalLength35mm: number;
  /** Minimum zoom factor (usually 1.0) */
  minZoomFactor: number;
  /** Maximum zoom factor before digital-only zoom */
  maxOpticalZoomFactor: number;
  /** Absolute maximum zoom factor including digital */
  maxZoomFactor: number;
}

/**
 * Result of mapping a target focal length to a physical lens + zoom.
 */
export interface LensMappingResult {
  /** Which physical lens to use */
  selectedLens: string;
  /** Expo Camera zoom prop value (0-1) */
  zoomValue: number;
  /** Whether digital crop is needed beyond optical zoom */
  isDigitalCrop: boolean;
}
