/**
 * LoginScreen — Auth (Group module)
 * Form for existing users. Calls AuthContext.login() which posts to
 * /api/auth/login and stores the JWT. RootNavigator then swaps to the
 * customer/admin tabs based on user.role.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../../components/Screen';
import Input from '../../components/Input';
import GradientButton from '../../components/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { colors, type, radii } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (err) {
      toast.error(err.userMessage || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.brandWrap}>
          <LinearGradient
            colors={[colors.heroStart, colors.heroEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandIcon}
          >
            <Text style={styles.brandIconText}>✦</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(120).duration(440)} style={styles.title}>
          GemMarket
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(180).duration(440)} style={styles.subtitle}>
          Welcome back. Discover rare gems.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(280).duration(420)}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            error={errors.email}
            leftIcon="✉"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            error={errors.password}
            leftIcon="⚿"
          />

          <GradientButton title="Log in" onPress={submit} loading={loading} icon="→" />
        </Animated.View>

        <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: 24 }}>
          <Text style={styles.link}>
            New to GemMarket? <Text style={{ color: colors.primary, fontWeight: '700' }}>Create an account</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandWrap: { alignItems: 'center', marginTop: 36 },
  brandIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
  },
  brandIconText: { color: '#FFFFFF', fontSize: 28 },
  title: { ...type.display, color: colors.text, textAlign: 'center', marginTop: 20, fontSize: 36 },
  subtitle: { color: colors.textDim, fontSize: 15, textAlign: 'center', marginBottom: 36, marginTop: 6 },
  link: { color: colors.textDim, textAlign: 'center', fontSize: 14 },
});
