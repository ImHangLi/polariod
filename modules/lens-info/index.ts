import { requireNativeModule } from 'expo-modules-core';

interface NativeLensInfo {
  deviceType: string;
  focalLength35mm: number;
  minZoomFactor: number;
  maxOpticalZoomFactor: number;
  maxZoomFactor: number;
}

interface LensInfoModuleType {
  getAvailableLenses(): NativeLensInfo[];
}

const LensInfoModule = requireNativeModule<LensInfoModuleType>('LensInfoModule');

export function getAvailableLenses(): NativeLensInfo[] {
  return LensInfoModule.getAvailableLenses();
}

export type { NativeLensInfo };
