import { requireNativeModule } from 'expo-modules-core';
import type { LensInfo } from '../../src/types/camera';

interface LensInfoModuleType {
  getAvailableLenses(): LensInfo[];
}

const LensInfoModule = requireNativeModule<LensInfoModuleType>('LensInfoModule');

export function getAvailableLenses(): LensInfo[] {
  return LensInfoModule.getAvailableLenses();
}
