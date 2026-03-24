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
