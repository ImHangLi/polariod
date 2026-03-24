import { useState, useCallback, useEffect } from 'react';
import { PRESETS } from '../constants/presets';
import type { FlashMode, LensInfo } from '../types/camera';
import { useLensMapping } from './useLensMapping';

export function useCamera() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [currentZoomStop, setCurrentZoomStop] = useState(0);
  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [lenses, setLenses] = useState<LensInfo[]>([]);

  const preset = PRESETS[presetIndex];

  useEffect(() => {
    try {
      const { getAvailableLenses } = require('../../modules/lens-info');
      const result = getAvailableLenses();
      if (Array.isArray(result)) {
        setLenses(result);
      }
    } catch {
      // Native module not available — lens mapping will use defaults
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
