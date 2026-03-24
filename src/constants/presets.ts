import type { CameraPreset } from '../types/camera';

export const PRESETS: CameraPreset[] = [
  {
    id: 'instax-mini-12',
    name: 'Mini 12',
    displayName: 'Fuji Instax Mini 12',
    aspectRatio: { width: 31, height: 23 }, // Real: 62mm × 46mm = 31:23
    focalLength35mmEquiv: 34, // Real: 60mm on 62×46mm format
    flash: { defaultMode: 'auto', userSelectable: false },
    hasFilter: true,
  },
  {
    id: 'instax-wide-300',
    name: 'Wide',
    displayName: 'Fuji Instax Wide 300',
    aspectRatio: { width: 99, height: 62 }, // Real: 99mm × 62mm
    focalLength35mmEquiv: 35, // Real: 95mm on 99×62mm format
    flash: { defaultMode: 'auto', userSelectable: true },
    hasFilter: true,
  },
  {
    id: 'ixus-130',
    name: 'IXUS 130',
    displayName: 'Canon IXUS 130',
    aspectRatio: { width: 4, height: 3 }, // Real: 1/2.3" CCD, 4:3
    focalLength35mmEquiv: 28, // Wide end of 28-112mm
    zoomStops: [28, 50, 112], // Real: 4× optical zoom (28-112mm)
    flash: { defaultMode: 'auto', userSelectable: true },
    hasFilter: true,
  },
];
