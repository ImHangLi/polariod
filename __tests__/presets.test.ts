import { PRESETS } from '../src/constants/presets';
import type { CameraPreset } from '../src/types/camera';

describe('Camera Presets', () => {
  it('should define exactly 3 presets', () => {
    expect(PRESETS).toHaveLength(3);
  });

  it('each preset should have required fields', () => {
    PRESETS.forEach((preset: CameraPreset) => {
      expect(preset.id).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.aspectRatio).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
      expect(preset.focalLength35mmEquiv).toBeDefined();
      expect(preset.flash).toBeDefined();
    });
  });

  it('Mini 12 should have correct real specs', () => {
    const mini = PRESETS.find(p => p.id === 'instax-mini-12')!;
    expect(mini.aspectRatio).toEqual({ width: 31, height: 23 });
    expect(mini.focalLength35mmEquiv).toBe(34);
    expect(mini.flash.defaultMode).toBe('auto');
    expect(mini.flash.userSelectable).toBe(false);
    expect(mini.zoomStops).toBeUndefined();
  });

  it('Instax Wide should have correct real specs', () => {
    const wide = PRESETS.find(p => p.id === 'instax-wide-300')!;
    expect(wide.aspectRatio).toEqual({ width: 99, height: 62 });
    expect(wide.focalLength35mmEquiv).toBe(35);
    expect(wide.flash.defaultMode).toBe('auto');
    expect(wide.flash.userSelectable).toBe(true);
  });

  it('IXUS 130 should have correct real specs with zoom stops', () => {
    const ixus = PRESETS.find(p => p.id === 'ixus-130')!;
    expect(ixus.aspectRatio).toEqual({ width: 4, height: 3 });
    expect(ixus.focalLength35mmEquiv).toBe(28);
    expect(ixus.zoomStops).toEqual([28, 50, 112]);
    expect(ixus.flash.defaultMode).toBe('auto');
    expect(ixus.flash.userSelectable).toBe(true);
  });
});
