import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadows } from '../theme';

export default function Hero({ eyebrow, title, subtitle, cta, sparkle = true }) {
  return (
    <Animated.View entering={FadeIn.duration(420)} style={[styles.wrap, shadows.glow]}>
      <LinearGradient
        colors={[colors.heroStart, colors.heroEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {sparkle ? (
          <View style={styles.sparkles} pointerEvents="none">
            <Text style={[styles.sparkle, { top: 12, left: 22, fontSize: 14 }]}>✦</Text>
            <Text style={[styles.sparkle, { top: 36, right: 28, fontSize: 22 }]}>✧</Text>
            <Text style={[styles.sparkle, { bottom: 22, left: 80, fontSize: 12 }]}>✦</Text>
            <Text style={[styles.sparkle, { bottom: 14, right: 18, fontSize: 18 }]}>✧</Text>
          </View>
        ) : null}

        {eyebrow ? (
          <Animated.Text entering={FadeInDown.delay(80).duration(420)} style={styles.eyebrow}>
            {eyebrow}
          </Animated.Text>
        ) : null}
        <Animated.Text entering={FadeInDown.delay(140).duration(440)} style={styles.title}>
          {title}
        </Animated.Text>
        {subtitle ? (
          <Animated.Text entering={FadeInDown.delay(220).duration(440)} style={styles.subtitle}>
            {subtitle}
          </Animated.Text>
        ) : null}
        {cta ? <View style={{ marginTop: 18, alignSelf: 'flex-start' }}>{cta}</View> : null}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radii.xl, overflow: 'hidden', marginBottom: 20 },
  gradient: { padding: 24, paddingVertical: 32, position: 'relative' },
  sparkles: { ...StyleSheet.absoluteFillObject },
  sparkle: { position: 'absolute', color: '#FDE68A' },
  eyebrow: {
    color: '#E9D5FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.4, lineHeight: 32 },
  subtitle: { color: '#EDE9FE', fontSize: 14, marginTop: 8, lineHeight: 20, maxWidth: 380 },
});
