import React from 'react';
import { Text, View } from 'react-native';

export function StripeProvider({ children }) {
  return children;
}

export function CardField() {
  return (
    <View style={{ padding: 12 }}>
      <Text>Stripe is not supported on web.</Text>
    </View>
  );
}

export function useStripe() {
  return {
    createPaymentMethod: async () => ({
      paymentMethod: null,
      error: { message: 'Stripe is not supported on web.' },
    }),
  };
}
