import { StyleSheet, Pressable, Text } from 'react-native';
import type { FlashMode } from '../types/camera';

interface FlashButtonProps {
  mode: FlashMode;
  userSelectable: boolean;
  onCycle: () => void;
}

const FLASH_LABELS: Record<FlashMode, string> = {
  auto: 'Flash A',
  on: 'Flash',
  off: 'Flash X',
};

export function FlashButton({ mode, userSelectable, onCycle }: FlashButtonProps) {
  return (
    <Pressable
      style={[styles.button, !userSelectable && styles.disabled]}
      onPress={userSelectable ? onCycle : undefined}
    >
      <Text style={styles.label}>{FLASH_LABELS[mode]}</Text>
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
    fontSize: 14,
  },
});
