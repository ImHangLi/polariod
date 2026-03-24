import type { LensInfo } from '../../src/types/camera';

/**
 * Lazily loads the native module to avoid hanging if it's not linked.
 * requireNativeModule hangs (not throws) when the module doesn't exist.
 */
export function getAvailableLenses(): LensInfo[] {
  try {
    const { requireNativeModule } = require('expo-modules-core');
    const LensInfoModule = requireNativeModule('LensInfoModule');
    return LensInfoModule.getAvailableLenses();
  } catch {
    return [];
  }
}
