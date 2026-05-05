import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import { colors, radii } from '../theme';

export default function Input({ label, error, hint, style, leftIcon, rightAdornment, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          error && styles.boxError,
        ]}
      >
        {leftIcon ? <Text style={styles.icon}>{leftIcon}</Text> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
          selectionColor={colors.primary}
          {...rest}
        />
        {rightAdornment}
      </View>
      {error ? (
        <Text style={styles.err}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { color: colors.textDim, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
  },
  boxFocused: { borderColor: colors.primary, backgroundColor: colors.bg },
  boxError: { borderColor: colors.danger },
  icon: { fontSize: 16, color: colors.textDim, marginRight: 6 },
  input: { flex: 1, color: colors.text, paddingVertical: 12, fontSize: 15 },
  err: { color: colors.danger, marginTop: 4, fontSize: 12 },
  hint: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
});
