import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

export default function RatingBadge({ rating = 0, count = 0, size = 'md', style }) {
  const padded = size === 'sm' ? { paddingVertical: 3, paddingHorizontal: 8, fs: 12 } : { paddingVertical: 5, paddingHorizontal: 10, fs: 13 };
  const display = Number(rating).toFixed(1);
  return (
    <View style={[styles.wrap, padded, style]}>
      <Text style={[styles.star, { fontSize: padded.fs + 1 }]}>★</Text>
      <Text style={[styles.value, { fontSize: padded.fs }]}>{display}</Text>
      {count > 0 ? <Text style={[styles.count, { fontSize: padded.fs - 1 }]}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    gap: 4,
    alignSelf: 'flex-start',
  },
  star: { color: colors.accent },
  value: { color: colors.text, fontWeight: '700' },
  count: { color: colors.textDim, marginLeft: 2 },
});
