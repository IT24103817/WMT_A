import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

const variants = {
  primary: { bg: colors.primaryGlow, fg: colors.primary },
  accent: { bg: '#FEF3C7', fg: colors.accentDark },
  success: { bg: colors.successBg, fg: colors.success },
  warn: { bg: colors.warnBg, fg: colors.warn },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  info: { bg: colors.infoBg, fg: colors.info },
  neutral: { bg: colors.surfaceMuted, fg: colors.textDim },
};

export default function Badge({ label, variant = 'primary', icon, style }) {
  const v = variants[variant] || variants.primary;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.fg }]}>{icon ? `${icon} ` : ''}{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radii.pill, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
});
