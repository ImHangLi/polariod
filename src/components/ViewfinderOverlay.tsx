import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { AspectRatio } from '../types/camera';
import { calculateCropRect } from '../utils/cropCalculation';

export { calculateCropRect };

interface ViewfinderOverlayProps {
  aspectRatio: AspectRatio;
}

export function ViewfinderOverlay({ aspectRatio }: ViewfinderOverlayProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const crop = calculateCropRect(aspectRatio, screenWidth, screenHeight);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: crop.y }]} />
      <View
        style={[
          styles.overlay,
          { top: crop.y + crop.height, left: 0, right: 0, bottom: 0 },
        ]}
      />
      {crop.x > 0 && (
        <View
          style={[
            styles.overlay,
            { top: crop.y, left: 0, width: crop.x, height: crop.height },
          ]}
        />
      )}
      {crop.x > 0 && (
        <View
          style={[
            styles.overlay,
            { top: crop.y, right: 0, width: crop.x, height: crop.height },
          ]}
        />
      )}
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
