import { StyleSheet, View, Text, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCamera } from '../hooks/useCamera';
import { useCapture } from '../hooks/useCapture';
import { ViewfinderOverlay } from './ViewfinderOverlay';
import { PresetSelector } from './PresetSelector';
import { ZoomControl } from './ZoomControl';
import { FlashButton } from './FlashButton';
import { ShutterButton } from './ShutterButton';
import { FILTER_TINTS } from '../filters/filterTints';

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useCamera();
  const { cameraRef, capture, capturing } = useCapture();
  const insets = useSafeAreaInsets();

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

  const tint = FILTER_TINTS[camera.preset.id];

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={camera.flashMode}
        zoom={camera.lensMapping.zoomValue}
        selectedLens={camera.lensMapping.selectedLens}
      />

      <ViewfinderOverlay aspectRatio={camera.preset.aspectRatio} />

      {/* Filter tint overlays */}
      {camera.filterEnabled && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: tint.color }]}
          pointerEvents="none"
        />
      )}
      {camera.filterEnabled && tint.brightnessLift > 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(255, 255, 255, ${tint.brightnessLift})` },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Info bar */}
      <View style={[styles.infoBar, { top: insets.top + 8 }]}>
        <Text style={styles.infoText}>
          {camera.preset.displayName} · {camera.targetFocal}mm
        </Text>
      </View>

      {/* Zoom control (IXUS only) */}
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

      {/* Filter toggle */}
      <Pressable style={styles.filterButton} onPress={camera.toggleFilter}>
        <Text style={[styles.filterLabel, camera.filterEnabled && styles.filterActive]}>
          F
        </Text>
      </Pressable>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
  infoBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
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
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  shutterRow: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
