import { mapFocalLength } from '../src/hooks/useLensMapping';
import type { LensInfo } from '../src/types/camera';

const mockLenses: LensInfo[] = [
  {
    deviceType: 'builtInUltraWideCamera',
    focalLength35mm: 13,
    minZoomFactor: 1.0,
    maxOpticalZoomFactor: 1.0,
    maxZoomFactor: 16.0,
  },
  {
    deviceType: 'builtInWideAngleCamera',
    focalLength35mm: 24,
    minZoomFactor: 1.0,
    maxOpticalZoomFactor: 1.0,
    maxZoomFactor: 16.0,
  },
  {
    deviceType: 'builtInTelephotoCamera',
    focalLength35mm: 77,
    minZoomFactor: 1.0,
    maxOpticalZoomFactor: 1.0,
    maxZoomFactor: 16.0,
  },
];

describe('mapFocalLength', () => {
  it('34mm should use wide lens with ~1.42x zoom', () => {
    const result = mapFocalLength(34, mockLenses);
    expect(result.selectedLens).toBe('builtInWideAngleCamera');
    expect(result.zoomValue).toBeCloseTo(0.0278, 2);
    expect(result.isDigitalCrop).toBe(true);
  });

  it('35mm should use wide lens with ~1.46x zoom', () => {
    const result = mapFocalLength(35, mockLenses);
    expect(result.selectedLens).toBe('builtInWideAngleCamera');
    expect(result.zoomValue).toBeCloseTo(0.0306, 2);
  });

  it('28mm should use wide lens with ~1.17x zoom', () => {
    const result = mapFocalLength(28, mockLenses);
    expect(result.selectedLens).toBe('builtInWideAngleCamera');
    expect(result.zoomValue).toBeCloseTo(0.0111, 2);
  });

  it('50mm should use wide lens with ~2.08x zoom', () => {
    const result = mapFocalLength(50, mockLenses);
    expect(result.selectedLens).toBe('builtInWideAngleCamera');
    expect(result.zoomValue).toBeCloseTo(0.0722, 2);
  });

  it('112mm should use telephoto lens with ~1.45x zoom', () => {
    const result = mapFocalLength(112, mockLenses);
    expect(result.selectedLens).toBe('builtInTelephotoCamera');
    expect(result.zoomValue).toBeCloseTo(0.0303, 2);
  });

  it('should fallback to widest lens for very short focal lengths', () => {
    const result = mapFocalLength(13, mockLenses);
    expect(result.selectedLens).toBe('builtInUltraWideCamera');
    expect(result.zoomValue).toBe(0);
    expect(result.isDigitalCrop).toBe(false);
  });

  it('should work with only one lens (non-Pro iPhones)', () => {
    const singleLens: LensInfo[] = [
      {
        deviceType: 'builtInWideAngleCamera',
        focalLength35mm: 26,
        minZoomFactor: 1.0,
        maxOpticalZoomFactor: 1.0,
        maxZoomFactor: 15.0,
      },
    ];
    const result = mapFocalLength(34, singleLens);
    expect(result.selectedLens).toBe('builtInWideAngleCamera');
    expect(result.isDigitalCrop).toBe(true);
  });

  it('should return default for empty lens array', () => {
    const result = mapFocalLength(34, []);
    expect(result.selectedLens).toBe('builtInWideAngleCamera');
    expect(result.zoomValue).toBe(0);
    expect(result.isDigitalCrop).toBe(false);
  });
});
