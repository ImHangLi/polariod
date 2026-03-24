# Polariod Camera App — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an iOS camera app using Expo SDK 55 that simulates three real cameras (Fuji Instax Mini 12, Fuji Instax Wide 300, Canon IXUS 130) with accurate aspect ratios, focal lengths, flash behavior, and optional color filters.

**Architecture:** Single-screen camera app built with Expo Router. The `CameraView` component handles preview with `selectedLens` + `zoom` props for focal length simulation. A lightweight Swift native module (`LensInfoModule`) queries `AVCaptureDevice` metadata to enable precise focal-length-to-zoom mapping. Aspect ratio is enforced via a darkened overlay on the viewfinder and a post-capture crop before saving to the camera roll. Optional per-preset color filters use semi-transparent View overlays for live preview tinting (V1.1 can add GPU-accurate post-capture grading via `expo-gl`).

**Tech Stack:** Expo SDK 55, TypeScript, Expo Router, expo-camera, expo-image-manipulator, expo-media-library, Swift (Expo Modules API)

---

## Real Camera Specifications (verified)

| Camera | Actual Focal Length | 35mm Equiv | Image Area | Aspect Ratio | Aperture | Flash |
|---|---|---|---|---|---|---|
| Fuji Instax Mini 12 | 60mm | ~34mm | 62×46mm | 31:23 (≈1.348) | f/12.7 | Auto always |
| Fuji Instax Wide 300 | 95mm | ~35mm | 99×62mm | 99:62 (≈1.597) | f/14 | Auto (user can select) |
| Canon IXUS 130 | 5.0–20.0mm | 28–112mm (4×) | 1/2.3" CCD 4:3 | 4:3 (1.333) | f/2.8–5.9 | User selectable |

**Note:** During the design discussion we said IXUS was 28-96mm. The real spec is **28-112mm**. The three zoom stops are updated to **28 / 50 / 112mm**.

---

## File Structure

```
polariod/
├── app/
│   ├── _layout.tsx                  # Root layout (status bar hidden)
│   └── index.tsx                    # Main camera screen entry
├── src/
│   ├── types/
│   │   └── camera.ts               # CameraPreset, LensInfo, ZoomStop types
│   ├── constants/
│   │   └── presets.ts              # Three preset definitions with real specs
│   ├── components/
│   │   ├── CameraScreen.tsx        # Orchestrates all camera UI
│   │   ├── ViewfinderOverlay.tsx   # Darkened mask outside crop area
│   │   ├── PresetSelector.tsx      # Bottom 3 preset buttons
│   │   ├── ZoomControl.tsx         # IXUS zoom stop buttons (28/50/112)
│   │   ├── FlashButton.tsx         # Flash toggle (auto/on/off)
│   │   └── ShutterButton.tsx       # Capture button
│   ├── hooks/
│   │   ├── useCamera.ts           # Preset state, lens, zoom, flash management
│   │   ├── useLensMapping.ts      # Maps target focal length → selectedLens + zoom
│   │   └── useCapture.ts          # takePicture → crop → save to camera roll
│   └── filters/
│       └── filterTints.ts         # Per-preset color tint overlay configs
├── modules/
│   └── lens-info/
│       ├── expo-module.config.json # Expo module config
│       ├── index.ts               # JS/TS bridge
│       └── ios/
│           └── LensInfoModule.swift # AVCaptureDevice query
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
└── __tests__/
    ├── presets.test.ts            # Preset config validation
    ├── lensMapping.test.ts        # Focal length mapping logic
    └── cropCalculation.test.ts   # Crop rect calculation
```

---

## Chunk 1: Foundation

### Task 1: Project Scaffolding

**Files:**
- Create: `polariod/` (entire project via `create-expo-app`)
- Modify: `app.json`, `package.json`

- [ ] **Step 1: Create Expo project**

```bash
cd /Users/hangli/Developer/Personal
npx create-expo-app@latest polariod --template blank-typescript
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/hangli/Developer/Personal/polariod
npx expo install expo-camera expo-image-manipulator expo-media-library
```

- [ ] **Step 3: Configure app.json**

Update `app.json` to include camera and media library permissions, hide status bar, lock to portrait, and register the native module:

```json
{
  "expo": {
    "name": "Polariod",
    "slug": "polariod",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.polariod.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Polariod needs camera access to take photos.",
        "NSPhotoLibraryAddUsageDescription": "Polariod needs photo library access to save your photos.",
        "UIStatusBarHidden": true,
        "UIViewControllerBasedStatusBarAppearance": false
      }
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Polariod needs camera access to take photos."
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "Polariod needs photo library access to save your photos."
        }
      ],
      "./modules/lens-info"
    ]
  }
}
```

- [ ] **Step 4: Create directory structure**

```bash
mkdir -p src/{types,constants,components,hooks,filters}
mkdir -p modules/lens-info/ios
mkdir -p __tests__
```

- [ ] **Step 5: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Expo SDK 55 project with dependencies"
```

---

### Task 2: Type Definitions

**Files:**
- Create: `src/types/camera.ts`
- Test: `__tests__/presets.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/presets.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/presets.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create type definitions**

```typescript
// src/types/camera.ts

export interface AspectRatio {
  /** Width component of the ratio (e.g., 31 for Instax Mini's 31:23) */
  width: number;
  /** Height component of the ratio */
  height: number;
}

export interface FlashConfig {
  /** Default flash mode for this preset */
  defaultMode: 'auto' | 'on' | 'off';
  /** Whether the user can change flash mode */
  userSelectable: boolean;
}

export type FlashMode = 'auto' | 'on' | 'off';

export type PresetId = 'instax-mini-12' | 'instax-wide-300' | 'ixus-130';

export interface CameraPreset {
  id: PresetId;
  name: string;
  /** Real camera model name for display */
  displayName: string;
  /** Image area aspect ratio from real camera specs */
  aspectRatio: AspectRatio;
  /** Default focal length in 35mm equivalent */
  focalLength35mmEquiv: number;
  /** Available zoom stops in 35mm equiv. Only for zoom cameras like IXUS. */
  zoomStops?: number[];
  /** Flash configuration */
  flash: FlashConfig;
  /** Whether this preset has an optional color filter */
  hasFilter: boolean;
}

/**
 * Lens metadata returned by the native LensInfoModule.
 * Each entry represents one physical camera lens on the device.
 */
export interface LensInfo {
  /** AVCaptureDevice lens identifier (e.g., 'builtInWideAngleCamera') */
  deviceType: string;
  /** Base focal length in 35mm equivalent with no zoom applied */
  focalLength35mm: number;
  /** Minimum zoom factor (usually 1.0) */
  minZoomFactor: number;
  /** Maximum zoom factor before digital-only zoom */
  maxOpticalZoomFactor: number;
  /** Absolute maximum zoom factor including digital */
  maxZoomFactor: number;
}

/**
 * Result of mapping a target focal length to a physical lens + zoom.
 */
export interface LensMappingResult {
  /** Which physical lens to use */
  selectedLens: string;
  /** Expo Camera zoom prop value (0-1) */
  zoomValue: number;
  /** Whether digital crop is needed beyond optical zoom */
  isDigitalCrop: boolean;
}
```

- [ ] **Step 4: Create preset constants**

```typescript
// src/constants/presets.ts
import type { CameraPreset } from '../types/camera';

export const PRESETS: CameraPreset[] = [
  {
    id: 'instax-mini-12',
    name: 'Mini 12',
    displayName: 'Fuji Instax Mini 12',
    aspectRatio: { width: 31, height: 23 },  // Real: 62mm × 46mm = 31:23
    focalLength35mmEquiv: 34,                  // Real: 60mm on 62×46mm format
    flash: { defaultMode: 'auto', userSelectable: false },
    hasFilter: true,
  },
  {
    id: 'instax-wide-300',
    name: 'Wide',
    displayName: 'Fuji Instax Wide 300',
    aspectRatio: { width: 99, height: 62 },   // Real: 99mm × 62mm
    focalLength35mmEquiv: 35,                  // Real: 95mm on 99×62mm format
    flash: { defaultMode: 'auto', userSelectable: true },
    hasFilter: true,
  },
  {
    id: 'ixus-130',
    name: 'IXUS 130',
    displayName: 'Canon IXUS 130',
    aspectRatio: { width: 4, height: 3 },     // Real: 1/2.3" CCD, 4:3
    focalLength35mmEquiv: 28,                  // Wide end of 28-112mm
    zoomStops: [28, 50, 112],                  // Real: 4× optical zoom (28-112mm)
    flash: { defaultMode: 'auto', userSelectable: true },
    hasFilter: true,
  },
];
```

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/presets.test.ts
```

Expected: PASS — all 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/types/camera.ts src/constants/presets.ts __tests__/presets.test.ts
git commit -m "feat: add camera preset types and real specs for Mini 12, Wide 300, IXUS 130"
```

---

### Task 3: Camera Permissions & Basic Preview

**Files:**
- Create: `app/_layout.tsx`, `app/index.tsx`, `src/components/CameraScreen.tsx`

- [ ] **Step 1: Create root layout**

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
```

- [ ] **Step 2: Create index screen**

```typescript
// app/index.tsx
import { CameraScreen } from '../src/components/CameraScreen';

export default function Index() {
  return <CameraScreen />;
}
```

- [ ] **Step 3: Create CameraScreen with permission handling**

```typescript
// src/components/CameraScreen.tsx
import { StyleSheet, View, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission required</Text>
        <Text style={styles.link} onPress={requestPermission}>
          Grant Permission
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  link: {
    color: '#4da6ff',
    fontSize: 16,
  },
});
```

- [ ] **Step 4: Test on device**

```bash
npx expo prebuild --platform ios
npx expo run:ios --device
```

Expected: Camera preview fills screen. (Simulator won't work — need physical device.)

- [ ] **Step 5: Commit**

```bash
git add app/ src/components/CameraScreen.tsx
git commit -m "feat: basic camera preview with permission handling"
```

---

## Chunk 2: Native Module & Lens Mapping

### Task 4: Swift Native Module — LensInfoModule

**Files:**
- Create: `modules/lens-info/expo-module.config.json`
- Create: `modules/lens-info/index.ts`
- Create: `modules/lens-info/ios/LensInfoModule.swift`

This module queries `AVCaptureDevice.DiscoverySession` to return each physical lens's focal length and zoom range. This data is essential for precisely mapping target focal lengths (e.g., "34mm") to the correct `selectedLens` + `zoom` prop values.

- [ ] **Step 1: Create module config**

```json
// modules/lens-info/expo-module.config.json
{
  "platforms": ["ios"],
  "ios": {
    "modules": ["LensInfoModule"]
  }
}
```

- [ ] **Step 2: Create TypeScript bridge**

```typescript
// modules/lens-info/index.ts
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
```

- [ ] **Step 3: Create Swift module**

```swift
// modules/lens-info/ios/LensInfoModule.swift
import ExpoModulesCore
import AVFoundation

public class LensInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LensInfoModule")

    Function("getAvailableLenses") { () -> [[String: Any]] in
      let deviceTypes: [AVCaptureDevice.DeviceType] = [
        .builtInUltraWideCamera,
        .builtInWideAngleCamera,
        .builtInTelephotoCamera,
      ]

      let session = AVCaptureDevice.DiscoverySession(
        deviceTypes: deviceTypes,
        mediaType: .video,
        position: .back
      )

      return session.devices.map { device in
        let focalLength35mm = self.estimate35mmEquiv(device: device)

        return [
          "deviceType": device.deviceType.rawValue,
          "focalLength35mm": focalLength35mm,
          "minZoomFactor": device.minAvailableVideoZoomFactor,
          "maxOpticalZoomFactor": self.maxOpticalZoom(device: device),
          "maxZoomFactor": device.maxAvailableVideoZoomFactor,
        ]
      }
    }
  }

  /// Estimates the 35mm equivalent focal length for a given device.
  /// Uses the field of view to calculate: equiv = 36mm / (2 * tan(fov/2))
  /// where 36mm is the width of a 35mm frame.
  private func estimate35mmEquiv(device: AVCaptureDevice) -> Double {
    let fov = device.activeFormat.videoFieldOfView // horizontal FOV in degrees
    let fovRadians = Double(fov) * .pi / 180.0
    let equiv = 36.0 / (2.0 * tan(fovRadians / 2.0))
    return round(equiv * 10) / 10 // round to 1 decimal
  }

  /// Returns the maximum optical zoom factor (before digital-only zoom kicks in).
  /// Individual physical devices don't have optical zoom beyond 1x,
  /// so this returns minAvailableVideoZoomFactor for single-lens devices.
  private func maxOpticalZoom(device: AVCaptureDevice) -> Double {
    return device.minAvailableVideoZoomFactor
  }
}
```

- [ ] **Step 4: Rebuild and verify module loads**

```bash
npx expo prebuild --platform ios --clean
npx expo run:ios --device
```

Verify in the app that `getAvailableLenses()` returns data (add temporary console.log).

- [ ] **Step 5: Commit**

```bash
git add modules/lens-info/
git commit -m "feat: add Swift LensInfoModule for querying physical lens metadata"
```

---

### Task 5: Lens Mapping Logic

**Files:**
- Create: `src/hooks/useLensMapping.ts`
- Test: `__tests__/lensMapping.test.ts`

This hook takes a target 35mm-equivalent focal length and the device's lens info array, and returns which physical lens to select plus the exact `zoom` prop value.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lensMapping.test.ts
import { mapFocalLength } from '../src/hooks/useLensMapping';
import type { LensInfo } from '../src/types/camera';

// Simulated iPhone 15 Pro lens data
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
    // zoom factor = 34/24 = 1.4167
    // zoomValue = (1.4167 - 1) / (16 - 1) ≈ 0.0278
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
    // 50/24 = 2.083 → (2.083 - 1) / (16 - 1) = 0.0722
    expect(result.zoomValue).toBeCloseTo(0.0722, 2);
  });

  it('112mm should use telephoto lens with ~1.45x zoom', () => {
    const result = mapFocalLength(112, mockLenses);
    expect(result.selectedLens).toBe('builtInTelephotoCamera');
    // 112/77 = 1.4545 → (1.4545 - 1) / (16 - 1) = 0.0303
    expect(result.zoomValue).toBeCloseTo(0.0303, 2);
  });

  it('should fallback to widest lens + crop for very short focal lengths', () => {
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
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lensMapping.test.ts
```

Expected: FAIL — `mapFocalLength` not found.

- [ ] **Step 3: Implement lens mapping**

```typescript
// src/hooks/useLensMapping.ts
import { useMemo } from 'react';
import type { LensInfo, LensMappingResult } from '../types/camera';

/**
 * Pure function: maps a target 35mm-equivalent focal length to the best
 * physical lens and zoom value.
 *
 * Strategy:
 * 1. Find the lens whose base focal length is closest to (but not exceeding) the target.
 *    This minimizes digital crop and maximizes image quality.
 * 2. If no lens is shorter than target, use the shortest available lens.
 * 3. Calculate zoom factor = targetFocal / lensFocal.
 * 4. Map zoom factor to Expo's 0-1 zoom prop value.
 */
export function mapFocalLength(
  targetFocal: number,
  lenses: LensInfo[],
): LensMappingResult {
  if (lenses.length === 0) {
    return { selectedLens: 'builtInWideAngleCamera', zoomValue: 0, isDigitalCrop: false };
  }

  // Sort lenses by base focal length ascending
  const sorted = [...lenses].sort((a, b) => a.focalLength35mm - b.focalLength35mm);

  // Find the best lens: the longest focal length that doesn't exceed the target
  let bestLens = sorted[0]; // fallback to widest
  for (const lens of sorted) {
    if (lens.focalLength35mm <= targetFocal) {
      bestLens = lens;
    }
  }

  const zoomFactor = targetFocal / bestLens.focalLength35mm;

  // If zoomFactor <= 1, no zoom needed
  if (zoomFactor <= 1.0) {
    return {
      selectedLens: bestLens.deviceType,
      zoomValue: 0,
      isDigitalCrop: false,
    };
  }

  // Map zoom factor to Expo's 0-1 range
  // Expo zoom: 0 = minZoomFactor, 1 = maxZoomFactor
  const range = bestLens.maxZoomFactor - bestLens.minZoomFactor;
  const zoomValue = (zoomFactor - bestLens.minZoomFactor) / range;

  return {
    selectedLens: bestLens.deviceType,
    zoomValue: Math.min(Math.max(zoomValue, 0), 1),
    isDigitalCrop: zoomFactor > bestLens.maxOpticalZoomFactor,
  };
}

/**
 * Hook that returns the lens mapping for a given focal length,
 * using live device lens data from the native module.
 * Uses useMemo to avoid a render-cycle delay that useState+useEffect would cause.
 */
export function useLensMapping(targetFocal: number, lenses: LensInfo[]): LensMappingResult {
  return useMemo(() => mapFocalLength(targetFocal, lenses), [targetFocal, lenses]);
}
```

- [ ] **Step 4: Run tests**

```bash
npx jest __tests__/lensMapping.test.ts
```

Expected: PASS — all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLensMapping.ts __tests__/lensMapping.test.ts
git commit -m "feat: lens mapping logic — maps target focal length to physical lens + zoom"
```

---

## Chunk 3: Viewfinder & UI

### Task 6: Aspect Ratio Overlay

**Files:**
- Create: `src/components/ViewfinderOverlay.tsx`
- Test: `__tests__/cropCalculation.test.ts`

The overlay darkens the area outside the target crop rectangle, giving the user a real-time preview of the final image frame.

- [ ] **Step 1: Write the failing test for crop calculation**

```typescript
// __tests__/cropCalculation.test.ts
import { calculateCropRect } from '../src/components/ViewfinderOverlay';

describe('calculateCropRect', () => {
  const screenWidth = 390;
  const screenHeight = 844;

  it('4:3 landscape crop on portrait screen', () => {
    // 4:3 in portrait = 3:4 → width-constrained
    const rect = calculateCropRect({ width: 4, height: 3 }, screenWidth, screenHeight);
    // In portrait mode, we display the crop in portrait orientation
    // Aspect ratio 4:3 means the image is wider than tall
    // But phone is portrait, so we show it as: width = screenWidth, height = width * 3/4
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
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/cropCalculation.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement ViewfinderOverlay**

```typescript
// src/components/ViewfinderOverlay.tsx
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { AspectRatio } from '../types/camera';

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates the crop rectangle for a given aspect ratio within a screen.
 * The crop is centered and fits the maximum width, since we're in portrait mode
 * and all our target ratios are landscape (wider than tall).
 */
export function calculateCropRect(
  aspectRatio: AspectRatio,
  screenWidth: number,
  screenHeight: number,
): CropRect {
  const ratio = aspectRatio.height / aspectRatio.width; // e.g., 23/31 for Mini
  const cropWidth = screenWidth;
  const cropHeight = screenWidth * ratio;

  // If somehow taller than screen, constrain by height instead
  if (cropHeight > screenHeight) {
    const constrainedWidth = screenHeight / ratio;
    return {
      x: (screenWidth - constrainedWidth) / 2,
      y: 0,
      width: constrainedWidth,
      height: screenHeight,
    };
  }

  return {
    x: 0,
    y: (screenHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}

interface ViewfinderOverlayProps {
  aspectRatio: AspectRatio;
}

/**
 * Renders a semi-transparent black overlay with a transparent cutout
 * matching the target aspect ratio. Uses four dark rectangles around the edges.
 */
export function ViewfinderOverlay({ aspectRatio }: ViewfinderOverlayProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const crop = calculateCropRect(aspectRatio, screenWidth, screenHeight);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top dark bar */}
      <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: crop.y }]} />
      {/* Bottom dark bar */}
      <View
        style={[
          styles.overlay,
          { top: crop.y + crop.height, left: 0, right: 0, bottom: 0 },
        ]}
      />
      {/* Left dark bar (if any) */}
      {crop.x > 0 && (
        <View
          style={[
            styles.overlay,
            { top: crop.y, left: 0, width: crop.x, height: crop.height },
          ]}
        />
      )}
      {/* Right dark bar (if any) */}
      {crop.x > 0 && (
        <View
          style={[
            styles.overlay,
            {
              top: crop.y,
              right: 0,
              width: crop.x,
              height: crop.height,
            },
          ]}
        />
      )}
      {/* Thin border around crop area */}
      <View
        style={[
          styles.border,
          {
            top: crop.y,
            left: crop.x,
            width: crop.width,
            height: crop.height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  border: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
```

- [ ] **Step 4: Run tests**

```bash
npx jest __tests__/cropCalculation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ViewfinderOverlay.tsx __tests__/cropCalculation.test.ts
git commit -m "feat: viewfinder overlay with darkened area outside crop frame"
```

---

### Task 7: Preset Selector

**Files:**
- Create: `src/components/PresetSelector.tsx`
- Create: `src/hooks/useCamera.ts`

- [ ] **Step 1: Create camera state hook**

```typescript
// src/hooks/useCamera.ts
import { useState, useCallback, useEffect } from 'react';
import { PRESETS } from '../constants/presets';
import type { CameraPreset, FlashMode, LensInfo } from '../types/camera';
import { getAvailableLenses } from '../../modules/lens-info';
import { useLensMapping } from './useLensMapping';

export function useCamera() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [currentZoomStop, setCurrentZoomStop] = useState(0);
  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [lenses, setLenses] = useState<LensInfo[]>([]);

  const preset = PRESETS[presetIndex];

  // Load device lens info on mount
  useEffect(() => {
    try {
      const deviceLenses = getAvailableLenses();
      setLenses(deviceLenses);
    } catch {
      // Native module not available (e.g., simulator) — use empty
      setLenses([]);
    }
  }, []);

  // Current target focal length
  const targetFocal = preset.zoomStops
    ? preset.zoomStops[currentZoomStop]
    : preset.focalLength35mmEquiv;

  const lensMapping = useLensMapping(targetFocal, lenses);

  const selectPreset = useCallback((index: number) => {
    setPresetIndex(index);
    setCurrentZoomStop(0);
    // Reset flash to preset default
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
```

- [ ] **Step 2: Create PresetSelector component**

```typescript
// src/components/PresetSelector.tsx
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { PRESETS } from '../constants/presets';

interface PresetSelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function PresetSelector({ selectedIndex, onSelect }: PresetSelectorProps) {
  return (
    <View style={styles.container}>
      {PRESETS.map((preset, index) => (
        <Pressable
          key={preset.id}
          style={[styles.button, index === selectedIndex && styles.buttonActive]}
          onPress={() => onSelect(index)}
        >
          <Text style={[styles.label, index === selectedIndex && styles.labelActive]}>
            {preset.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  labelActive: {
    color: '#fff',
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCamera.ts src/components/PresetSelector.tsx
git commit -m "feat: camera state management and preset selector UI"
```

---

### Task 8: Zoom & Flash Controls

**Files:**
- Create: `src/components/ZoomControl.tsx`
- Create: `src/components/FlashButton.tsx`
- Create: `src/components/ShutterButton.tsx`

- [ ] **Step 1: Create ZoomControl**

```typescript
// src/components/ZoomControl.tsx
import { StyleSheet, View, Text, Pressable } from 'react-native';
import type { CameraPreset } from '../types/camera';

interface ZoomControlProps {
  preset: CameraPreset;
  currentStopIndex: number;
  onCycle: () => void;
}

export function ZoomControl({ preset, currentStopIndex, onCycle }: ZoomControlProps) {
  if (!preset.zoomStops) return null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={onCycle}>
        <Text style={styles.label}>{preset.zoomStops[currentStopIndex]}mm</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Create FlashButton**

```typescript
// src/components/FlashButton.tsx
import { StyleSheet, Pressable, Text } from 'react-native';
import type { FlashMode } from '../types/camera';

interface FlashButtonProps {
  mode: FlashMode;
  userSelectable: boolean;
  onCycle: () => void;
}

const FLASH_ICONS: Record<FlashMode, string> = {
  auto: '⚡A',
  on: '⚡',
  off: '⚡✕',
};

export function FlashButton({ mode, userSelectable, onCycle }: FlashButtonProps) {
  return (
    <Pressable
      style={[styles.button, !userSelectable && styles.disabled]}
      onPress={userSelectable ? onCycle : undefined}
    >
      <Text style={styles.label}>{FLASH_ICONS[mode]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: '#fff',
    fontSize: 16,
  },
});
```

- [ ] **Step 3: Create ShutterButton**

```typescript
// src/components/ShutterButton.tsx
import { StyleSheet, Pressable, View } from 'react-native';

interface ShutterButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function ShutterButton({ onPress, disabled }: ShutterButtonProps) {
  return (
    <Pressable style={styles.outer} onPress={onPress} disabled={disabled}>
      <View style={[styles.inner, disabled && styles.innerDisabled]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  innerDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ZoomControl.tsx src/components/FlashButton.tsx src/components/ShutterButton.tsx
git commit -m "feat: zoom control, flash button, and shutter button components"
```

---

## Chunk 4: Capture & Integration

### Task 9: Photo Capture, Crop & Save

**Files:**
- Create: `src/hooks/useCapture.ts`

- [ ] **Step 1: Implement capture hook**

```typescript
// src/hooks/useCapture.ts
import { useCallback, useRef, useState } from 'react';
import { CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import type { AspectRatio } from '../types/camera';

export function useCapture() {
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const capturingRef = useRef(false);

  const capture = useCallback(async (aspectRatio: AspectRatio) => {
    if (!cameraRef.current || capturingRef.current) return;

    capturingRef.current = true;
    setCapturing(true);
    try {
      // 1. Take the full photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      if (!photo) return;

      // 2. Calculate crop rectangle based on aspect ratio
      const photoAspect = photo.width / photo.height;
      const targetAspect = aspectRatio.width / aspectRatio.height;

      let cropX = 0;
      let cropY = 0;
      let cropWidth = photo.width;
      let cropHeight = photo.height;

      if (photoAspect > targetAspect) {
        // Photo is wider than target — crop sides
        cropWidth = Math.round(photo.height * targetAspect);
        cropX = Math.round((photo.width - cropWidth) / 2);
      } else {
        // Photo is taller than target — crop top/bottom
        cropHeight = Math.round(photo.width / targetAspect);
        cropY = Math.round((photo.height - cropHeight) / 2);
      }

      // 3. Crop the photo
      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ crop: { originX: cropX, originY: cropY, width: cropWidth, height: cropHeight } }],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
      );

      // 4. Save to camera roll
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(cropped.uri);
      }
    } finally {
      capturingRef.current = false;
      setCapturing(false);
    }
  }, []);

  return { cameraRef, capture, capturing };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCapture.ts
git commit -m "feat: photo capture with aspect-ratio crop and save to camera roll"
```

---

### Task 10: Wire Everything Together in CameraScreen

**Files:**
- Modify: `src/components/CameraScreen.tsx`

- [ ] **Step 1: Update CameraScreen to integrate all components**

```typescript
// src/components/CameraScreen.tsx
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text } from 'react-native';

import { useCamera } from '../hooks/useCamera';
import { useCapture } from '../hooks/useCapture';
import { ViewfinderOverlay } from './ViewfinderOverlay';
import { PresetSelector } from './PresetSelector';
import { ZoomControl } from './ZoomControl';
import { FlashButton } from './FlashButton';
import { ShutterButton } from './ShutterButton';

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useCamera();
  const { cameraRef, capture, capturing } = useCapture();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission required</Text>
        <Text style={styles.link} onPress={requestPermission}>
          Grant Permission
        </Text>
      </View>
    );
  }

  const handleShutter = () => {
    capture(camera.preset.aspectRatio);
  };

  return (
    <View style={styles.container}>
      {/* Camera preview */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={camera.flashMode}
        zoom={camera.lensMapping.zoomValue}
        selectedLens={camera.lensMapping.selectedLens}
      />

      {/* Aspect ratio overlay */}
      <ViewfinderOverlay aspectRatio={camera.preset.aspectRatio} />

      {/* Zoom control (only for IXUS) */}
      <ZoomControl
        preset={camera.preset}
        currentStopIndex={camera.currentZoomStop}
        onCycle={camera.cycleZoomStop}
      />

      {/* Flash button */}
      <FlashButton
        mode={camera.flashMode}
        userSelectable={camera.preset.flash.userSelectable}
        onCycle={camera.cycleFlash}
      />

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <PresetSelector
          selectedIndex={camera.presetIndex}
          onSelect={camera.selectPreset}
        />
        <View style={styles.shutterRow}>
          <ShutterButton onPress={handleShutter} disabled={capturing} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  link: {
    color: '#4da6ff',
    fontSize: 16,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  shutterRow: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
```

- [ ] **Step 2: Test on device**

```bash
npx expo prebuild --platform ios --clean
npx expo run:ios --device
```

Test checklist:
- [ ] Camera preview shows
- [ ] Switching presets changes the overlay aspect ratio
- [ ] Shutter button takes a photo
- [ ] Photo appears in camera roll with correct crop
- [ ] IXUS zoom button cycles through 28/50/112mm
- [ ] Flash button toggles for IXUS/Wide, locked for Mini 12

- [ ] **Step 3: Commit**

```bash
git add src/components/CameraScreen.tsx
git commit -m "feat: integrate all components into camera screen"
```

---

## Chunk 5: Optional Filters

### Task 11: Per-Preset Color Filters

**Files:**
- Create: `src/filters/filterTints.ts`
- Modify: `src/components/CameraScreen.tsx`

The filter system uses semi-transparent colored overlays to approximate each camera's color science on the live preview. This is a simple but effective approach — a Skia `Canvas` with `<Fill>` + `<ColorMatrix>` won't work here because it would transform a solid fill color, not the camera view underneath.

For accurate post-capture color grading, V1.1 can add `expo-gl` shaders or Skia offscreen rendering. For V1, the preview tint gives the right "feel" and the captured photo is unfiltered (matching many camera apps' free tier).

- [ ] **Step 1: Define filter tint configs**

```typescript
// src/filters/filterTints.ts
import type { PresetId } from '../types/camera';

/**
 * Each filter is a semi-transparent overlay color + opacity.
 * This approximates the camera's color science as a tint on the live preview.
 * Values are tuned to match each real camera's characteristic look.
 */
export interface FilterTint {
  /** Overlay color in rgba */
  color: string;
  /** Additional brightness adjustment via white overlay (0-1) */
  brightnessLift: number;
}

export const FILTER_TINTS: Record<PresetId, FilterTint> = {
  'instax-mini-12': {
    color: 'rgba(180, 220, 230, 0.12)',  // Cool cyan tint, washed out
    brightnessLift: 0.06,                 // Slight overexposure
  },
  'instax-wide-300': {
    color: 'rgba(210, 195, 170, 0.10)',  // Warm amber tint
    brightnessLift: 0.03,
  },
  'ixus-130': {
    color: 'rgba(240, 200, 140, 0.08)',  // Warm high-saturation CCD look
    brightnessLift: 0.0,
  },
};
```

- [ ] **Step 2: Add filter overlay to CameraScreen**

Modify `CameraScreen.tsx` — add filter Views after `<ViewfinderOverlay>`:

```typescript
// Add to imports:
import { Pressable } from 'react-native';
import { FILTER_TINTS } from '../filters/filterTints';

// Inside the return, after <ViewfinderOverlay>:
{camera.filterEnabled && (
  <>
    {/* Color tint overlay */}
    <View
      style={[StyleSheet.absoluteFill, {
        backgroundColor: FILTER_TINTS[camera.preset.id].color,
      }]}
      pointerEvents="none"
    />
    {/* Brightness lift overlay */}
    {FILTER_TINTS[camera.preset.id].brightnessLift > 0 && (
      <View
        style={[StyleSheet.absoluteFill, {
          backgroundColor: `rgba(255, 255, 255, ${FILTER_TINTS[camera.preset.id].brightnessLift})`,
        }]}
        pointerEvents="none"
      />
    )}
  </>
)}
```

Add a filter toggle button near the flash button:

```typescript
// Add to the JSX, near FlashButton:
<Pressable
  style={styles.filterButton}
  onPress={camera.toggleFilter}
>
  <Text style={[styles.filterLabel, camera.filterEnabled && styles.filterActive]}>
    F
  </Text>
</Pressable>
```

```typescript
// Add to styles:
filterButton: {
  position: 'absolute',
  top: 60,
  left: 20,
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
filterLabel: {
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: 16,
  fontWeight: '700',
},
filterActive: {
  color: '#f5c542',
},
```

> **Note:** For V1, the filter is preview-only — captured photos are unfiltered. V1.1 can add post-capture color grading via `expo-gl` shaders for accurate offline processing.

- [ ] **Step 4: Test on device**

```bash
npx expo prebuild --platform ios --clean
npx expo run:ios --device
```

- [ ] Filter toggle button appears (top-left "F")
- [ ] Tapping "F" applies a color tint over the preview
- [ ] Filter changes when switching presets
- [ ] Capture still works with filter on

- [ ] **Step 5: Commit**

```bash
git add src/filters/filterTints.ts src/components/CameraScreen.tsx
git commit -m "feat: optional per-preset color filter tint overlays"
```

---

## Chunk 6: Polish

### Task 12: Final Integration & Edge Cases

**Files:**
- Modify: various

- [ ] **Step 1: Handle devices with fewer lenses**

In `useLensMapping.ts`, verify the fallback behavior when a device has only 1-2 lenses (e.g., iPhone SE, older models). The existing `mapFocalLength` already handles this — test on a non-Pro device if possible.

- [ ] **Step 2: Add safe area handling**

Ensure the bottom controls avoid the home indicator on Face ID devices:

```typescript
// In CameraScreen.tsx, update imports:
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// In the component:
const insets = useSafeAreaInsets();

// Update bottomControls style:
paddingBottom: Math.max(insets.bottom, 20),
```

Install if not already present:
```bash
npx expo install react-native-safe-area-context
```

- [ ] **Step 3: Display current preset info**

Add a small label showing the current camera name and focal length at the top of the viewfinder:

```typescript
// In CameraScreen, add near top of the view:
<View style={styles.infoBar}>
  <Text style={styles.infoText}>
    {camera.preset.displayName} · {camera.targetFocal}mm
  </Text>
</View>
```

- [ ] **Step 4: Final device test**

Full test checklist on physical device:
- [ ] App launches directly to camera
- [ ] All three presets switch correctly
- [ ] Overlay aspect ratio matches each preset
- [ ] IXUS zoom cycles through 28/50/112mm
- [ ] Flash button works for IXUS/Wide, locked for Mini
- [ ] Shutter captures and saves cropped photo
- [ ] Photo in camera roll has correct aspect ratio
- [ ] Filter toggle works on all presets
- [ ] No crashes on permission denial/grant flow

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "polish: safe areas, info bar, and edge case handling"
```

---

## Summary

| Task | What | Files | Tests |
|---|---|---|---|
| 1 | Project scaffolding | app.json, package.json | — |
| 2 | Types + preset data | types/camera.ts, constants/presets.ts | presets.test.ts |
| 3 | Camera permissions + preview | CameraScreen.tsx, _layout.tsx, index.tsx | device test |
| 4 | Swift LensInfoModule | modules/lens-info/* | device test |
| 5 | Lens mapping logic | hooks/useLensMapping.ts | lensMapping.test.ts |
| 6 | Aspect ratio overlay | ViewfinderOverlay.tsx | cropCalculation.test.ts |
| 7 | Preset selector + state | PresetSelector.tsx, useCamera.ts | — |
| 8 | Zoom + flash + shutter | ZoomControl, FlashButton, ShutterButton | — |
| 9 | Capture + crop + save | hooks/useCapture.ts | device test |
| 10 | Full integration | CameraScreen.tsx | device test |
| 11 | Optional color filters | filters/filterTints.ts | device test |
| 12 | Polish + edge cases | various | full device test |
