import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

export default function Chip({ label, active, onPress, icon, size = 'md', style }) {
  const padding = size === 'sm'
    ? { paddingVertical: 5, paddingHorizontal: 10, fs: 12 }
    : { paddingVertical: 7, paddingHorizontal: 14, fs: 13 };
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        padding,
        active ? styles.active : styles.inactive,
        style,
      ]}
    >
      <Text style={{
        fontSize: padding.fs,
        fontWeight: '600',
        color: active ? colors.textInverse : colors.text,
      }}>
        {icon ? `${icon} ` : ''}{label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: radii.pill, borderWidth: 1, marginRight: 8 },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  inactive: { backgroundColor: colors.bg, borderColor: colors.border },
});
