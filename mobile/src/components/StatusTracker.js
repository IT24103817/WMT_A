import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

const STAGES = ['Confirmed', 'Processing', 'Out for Delivery', 'Delivered'];

export default function StatusTracker({ status }) {
  if (status === 'Cancelled') {
    return (
      <View style={styles.cancelledWrap}>
        <Text style={styles.cancelledText}>Order Cancelled</Text>
      </View>
    );
  }
  const idx = Math.max(0, STAGES.indexOf(status));
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {STAGES.map((s, i) => {
          const reached = i <= idx;
          return (
            <View key={s} style={styles.stage}>
              <View style={[styles.dot, reached ? styles.dotActive : styles.dotInactive]}>
                {reached ? <Text style={styles.tick}>✓</Text> : null}
              </View>
              {i < STAGES.length - 1 ? (
                <View style={[styles.line, { backgroundColor: i < idx ? colors.primary : colors.border }]} />
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        {STAGES.map((s, i) => {
          const reached = i <= idx;
          return (
            <Text
              key={s}
              style={[styles.label, reached && { color: colors.text, fontWeight: '700' }]}
              numberOfLines={2}
            >
              {s}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 18 },
  row: { flexDirection: 'row', alignItems: 'center' },
  stage: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: colors.primary },
  dotInactive: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  tick: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  line: { flex: 1, height: 2, marginHorizontal: 4, borderRadius: 1 },
  labelsRow: { flexDirection: 'row', marginTop: 8 },
  label: { flex: 1, color: colors.textMuted, fontSize: 11, textAlign: 'left', paddingRight: 4 },
  cancelledWrap: {
    backgroundColor: colors.dangerBg,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 18,
    alignItems: 'center',
  },
  cancelledText: { color: colors.danger, fontWeight: '800', fontSize: 15 },
});
