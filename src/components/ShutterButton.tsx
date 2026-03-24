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
