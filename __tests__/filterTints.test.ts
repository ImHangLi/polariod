import { FILTER_TINTS } from '../src/filters/filterTints';
import type { PresetId } from '../src/types/camera';

describe('Filter Tints', () => {
  const presetIds: PresetId[] = ['instax-mini-12', 'instax-wide-300', 'ixus-130'];

  it('should have tint configs for all three presets', () => {
    presetIds.forEach(id => {
      expect(FILTER_TINTS[id]).toBeDefined();
    });
  });

  it('each tint should have a valid rgba color string', () => {
    presetIds.forEach(id => {
      expect(FILTER_TINTS[id].color).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
    });
  });

  it('brightness lift should be between 0 and 1', () => {
    presetIds.forEach(id => {
      const lift = FILTER_TINTS[id].brightnessLift;
      expect(lift).toBeGreaterThanOrEqual(0);
      expect(lift).toBeLessThanOrEqual(1);
    });
  });
});
