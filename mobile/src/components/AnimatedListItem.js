import Animated, { FadeInDown } from 'react-native-reanimated';
import { motion } from '../theme';

export default function AnimatedListItem({ index = 0, children, style }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.base).delay(Math.min(index, 8) * motion.stagger).springify().damping(18)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
