import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

/**
 * Multi-select tag chips. Used in ReviewScreen + EditReviewScreen for the
 * "What went well?" prompt. Pass `tags` (string[]), `selected` (string[]),
 * and `onChange((string[]) => void)`.
 */
export default function TagPicker({ tags = [], selected = [], onChange, label = 'What went well?' }) {
  const toggle = (t) => {
    if (!onChange) return;
    onChange(selected.includes(t) ? selected.filter((s) => s !== t) : [...selected, t]);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {tags.map((t) => {
          const on = selected.includes(t);
          return (
            <Pressable
              key={t}
              onPress={() => toggle(t)}
              style={[styles.chip, on ? styles.on : styles.off]}
            >
              <Text style={[styles.text, on ? { color: colors.primary } : { color: colors.textDim }]}>
                {on ? '✓ ' : ''}{t}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1 },
  off: { backgroundColor: colors.bg, borderColor: colors.border },
  on: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  text: { fontSize: 13, fontWeight: '600' },
});
