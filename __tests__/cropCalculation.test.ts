import { calculateCropRect } from '../src/utils/cropCalculation';

describe('calculateCropRect', () => {
  const screenWidth = 390;
  const screenHeight = 844;

  it('4:3 landscape crop on portrait screen', () => {
    const rect = calculateCropRect({ width: 4, height: 3 }, screenWidth, screenHeight);
    expect(rect.width).toBe(screenWidth);
    expect(rect.height).toBeCloseTo(screenWidth * (3 / 4), 0);
    expect(rect.x).toBe(0);
    expect(rect.y).toBeCloseTo((screenHeight - rect.height) / 2, 0);
  });

  it('31:23 (Instax Mini) landscape crop on portrait screen', () => {
    const rect = calculateCropRect({ width: 31, height: 23 }, screenWidth, screenHeight);
    expect(rect.width).toBe(screenWidth);
    expect(rect.height).toBeCloseTo(screenWidth * (23 / 31), 0);
    expect(rect.x).toBe(0);
  });

  it('99:62 (Instax Wide) landscape crop on portrait screen', () => {
    const rect = calculateCropRect({ width: 99, height: 62 }, screenWidth, screenHeight);
    expect(rect.width).toBe(screenWidth);
    expect(rect.height).toBeCloseTo(screenWidth * (62 / 99), 0);
  });

  it('should constrain by height when crop is taller than screen', () => {
    const rect = calculateCropRect({ width: 1, height: 3 }, screenWidth, screenHeight);
    expect(rect.height).toBe(screenHeight);
    expect(rect.width).toBeCloseTo(screenHeight / 3, 0);
    expect(rect.y).toBe(0);
    expect(rect.x).toBeCloseTo((screenWidth - rect.width) / 2, 0);
  });
});
