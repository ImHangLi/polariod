import { useState, useCallback, useEffect } from 'react';
import { PRESETS } from '../constants/presets';
import type { FlashMode, LensInfo } from '../types/camera';
import { useLensMapping } from './useLensMapping';

let getAvailableLenses: (() => LensInfo[]) | undefined;
try {
  // Dynamic import so it doesn't crash when native module is unavailable
  const mod = require('../../modules/lens-info');
  getAvailableLenses = mod.getAvailableLenses;
} catch {
  // Native module not available (e.g., web, simulator, tests)
}

export function useCamera() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [currentZoomStop, setCurrentZoomStop] = useState(0);
  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [lenses, setLenses] = useState<LensInfo[]>([]);

  const preset = PRESETS[presetIndex];

  useEffect(() => {
    try {
      if (getAvailableLenses) {
        setLenses(getAvailableLenses());
      }
    } catch {
      setLenses([]);
    }
  }, []);

  const targetFocal = preset.zoomStops
    ? preset.zoomStops[currentZoomStop]
    : preset.focalLength35mmEquiv;

  const lensMapping = useLensMapping(targetFocal, lenses);

  const selectPreset = useCallback((index: number) => {
    setPresetIndex(index);
    setCurrentZoomStop(0);
    setFlashMode(PRESETS[index].flash.defaultMode);
    setFilterEnabled(false);
  }, []);

  const cycleZoomStop = useCallback(() => {
    if (!preset.zoomStops) return;
    setCurrentZoomStop(prev => (prev + 1) % preset.zoomStops!.length);
  }, [preset]);

  const cycleFlash = useCallback(() => {
    if (!preset.flash.userSelectable) return;
    setFlashMode(prev => {
      if (prev === 'auto') return 'on';
      if (prev === 'on') return 'off';
      return 'auto';
    });
  }, [preset]);

  const toggleFilter = useCallback(() => {
    setFilterEnabled(prev => !prev);
  }, []);

  return {
    preset,
    presetIndex,
    selectPreset,
    targetFocal,
    currentZoomStop,
    cycleZoomStop,
    flashMode,
    cycleFlash,
    filterEnabled,
    toggleFilter,
    lensMapping,
    lenses,
  };
}
