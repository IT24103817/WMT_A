import { Pressable, Text, StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radii, shadows, type } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  textStyle,
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const palette = {
    primary: { bg: colors.primary, text: colors.textInverse, border: colors.primary, shadow: shadows.glow },
    secondary: { bg: colors.surfaceAlt, text: colors.primary, border: 'transparent', shadow: shadows.sm },
    ghost: { bg: 'transparent', text: colors.primary, border: colors.primary, shadow: undefined },
    outline: { bg: 'transparent', text: colors.text, border: colors.borderStrong, shadow: undefined },
    danger: { bg: colors.danger, text: colors.textInverse, border: colors.danger, shadow: shadows.sm },
    subtle: { bg: colors.surfaceMuted, text: colors.text, border: 'transparent', shadow: undefined },
  }[variant] || {};

  const sizing = {
    sm: { paddingVertical: 9, paddingHorizontal: 14, fontSize: 13, radius: radii.sm },
    md: { paddingVertical: 13, paddingHorizontal: 18, fontSize: 15, radius: radii.md },
    lg: { paddingVertical: 16, paddingHorizontal: 22, fontSize: 16, radius: radii.md },
  }[size];

  const handlePressIn = () => { scale.value = withSpring(0.96, { damping: 18, stiffness: 320 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 18, stiffness: 320 }); };
  const handlePress = (e) => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    onPress?.(e);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.btn,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: sizing.radius,
          paddingVertical: sizing.paddingVertical,
          paddingHorizontal: sizing.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        palette.shadow,
        animStyle,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : (
          <>
            {icon ? <Text style={[styles.icon, { color: palette.text }]}>{icon}</Text> : null}
            <Text style={[{ color: palette.text, fontSize: sizing.fontSize, fontWeight: '700' }, textStyle]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16, marginRight: 4 },
});
