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
    top: 100,
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
