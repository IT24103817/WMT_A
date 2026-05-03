import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, radii, shadows } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Card({ children, style, onPress, padded = true, elevated = true }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const containerStyle = [
    styles.card,
    padded && styles.padded,
    elevated && shadows.sm,
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 22, stiffness: 320 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 22, stiffness: 320 }); }}
        style={[containerStyle, animStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }
  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  padded: { padding: 16 },
});
