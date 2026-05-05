import { Pressable, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, radii, shadows } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GradientButton({ title, onPress, disabled, loading, icon, style, size = 'md' }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const sizing = {
    sm: { py: 10, px: 16, fs: 13 },
    md: { py: 14, px: 20, fs: 15 },
    lg: { py: 17, px: 24, fs: 16 },
  }[size];

  const handlePress = (e) => {
    if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {} }
    onPress?.(e);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 18, stiffness: 320 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 320 }); }}
      disabled={disabled || loading}
      style={[styles.wrap, shadows.glow, { borderRadius: radii.md, opacity: disabled ? 0.5 : 1 }, animStyle, style]}
    >
      <LinearGradient
        colors={[colors.gradStart, colors.gradEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.btn, { borderRadius: radii.md, paddingVertical: sizing.py, paddingHorizontal: sizing.px }]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={[styles.text, { fontSize: sizing.fs }]}>
            {icon ? `${icon}  ` : ''}{title}
          </Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  btn: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.2 },
});
