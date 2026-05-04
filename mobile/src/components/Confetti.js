import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const COLORS = ['#7C3AED', '#A855F7', '#F59E0B', '#10B981', '#2563EB', '#F472B6'];

function Piece({ delay = 0, x, color, rotate = 0 }) {
  const ty = useSharedValue(-40);
  const tx = useSharedValue(x);
  const rot = useSharedValue(0);
  const op = useSharedValue(0);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 80 }));
    ty.value = withDelay(delay, withTiming(height + 40, { duration: 2000 + Math.random() * 800, easing: Easing.in(Easing.quad) }));
    tx.value = withDelay(delay, withSequence(
      withTiming(x + (Math.random() * 80 - 40), { duration: 700 }),
      withTiming(x + (Math.random() * 120 - 60), { duration: 1200 }),
    ));
    rot.value = withDelay(delay, withTiming(rotate + 720, { duration: 2400, easing: Easing.linear }));
    setTimeout(() => { op.value = withTiming(0, { duration: 200 }); }, 2200 + delay);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View style={[
      { position: 'absolute', width: 10, height: 14, backgroundColor: color, borderRadius: 2 },
      style,
    ]} />
  );
}

export default function Confetti({ count = 60 }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    delay: i * 18,
    x: Math.random() * width,
    color: COLORS[i % COLORS.length],
    rotate: Math.random() * 360,
  }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => <Piece key={i} {...p} />)}
    </View>
  );
}
