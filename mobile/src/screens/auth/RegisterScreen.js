/**
 * RegisterScreen — Auth (Group module)
 * Creates a new customer account. Calls AuthContext.register() →
 * POST /api/auth/register. Validations: name/email/password required,
 * password ≥ 6 chars (server also checks).
 */
import { useState } from 'react';
import { Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Input from '../../components/Input';
import GradientButton from '../../components/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { colors, type } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Invalid email';
    if (password.length < 6) e.password = 'At least 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
      toast.success(`Welcome, ${name.split(' ')[0]}!`);
    } catch (err) {
      toast.error(err.userMessage || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.Text entering={FadeInUp.duration(420)} style={styles.title}>
          Create account
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(80).duration(420)} style={styles.subtitle}>
          Join the marketplace for collectors.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(160).duration(420)}>
          <Input label="Full name" value={name} onChangeText={setName} placeholder="Jane Cartier" error={errors.name} leftIcon="◐" />
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
            placeholder="At least 6 characters"
            error={errors.password}
            leftIcon="⚿"
          />
          <Input
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="Re-enter password"
            error={errors.confirm}
            leftIcon="⚿"
          />

          <GradientButton title="Create account" onPress={submit} loading={loading} icon="→" />
        </Animated.View>

        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
          <Text style={styles.link}>
            Already have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Log in</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...type.display, color: colors.text, marginTop: 24, fontSize: 32 },
  subtitle: { color: colors.textDim, fontSize: 15, marginBottom: 28, marginTop: 4 },
  link: { color: colors.textDim, textAlign: 'center', fontSize: 14 },
});
