import 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from './src/stripe';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
<<<<<<< HEAD
=======
import { CartProvider } from './src/context/CartContext';
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
import { ToastProvider } from './src/components/Toast';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PK || '';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
    notification: colors.primary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PK} merchantIdentifier="merchant.com.gemmarket">
        <AuthProvider>
<<<<<<< HEAD
          <ToastProvider>
            <NavigationContainer theme={navTheme}>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </ToastProvider>
=======
          <CartProvider>
            <ToastProvider>
              <NavigationContainer theme={navTheme}>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </ToastProvider>
          </CartProvider>
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
