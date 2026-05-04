/**
 * PaymentScreen — Payment (M6)
 * Wraps the Stripe SDK <CardField>. Calls confirmPayment() to obtain a
 * paymentMethodId, then POSTs to /api/checkout with the card token plus
 * the address/cart from CheckoutScreen. On success: Confetti + replace to
 * OrderDetail.
 */
import { useState } from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { CardField, useStripe } from '../../stripe';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import GradientButton from '../../components/GradientButton';
import Confetti from '../../components/Confetti';
import Badge from '../../components/Badge';
import client from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/Toast';
import { colors, formatPrice, type, radii } from '../../theme';

export default function PaymentScreen({ route, navigation }) {
  if (Platform.OS === 'web') {
    return (
      <Screen scroll>
        <Card>
          <Text style={[styles.label2]}>Payments aren't supported on web.</Text>
          <Text style={{ color: colors.textDim, marginTop: 8 }}>
            Use the iOS or Android app (development build) to test Stripe payments.
          </Text>
        </Card>
      </Screen>
    );
  }

  const checkout = route.params?.checkout;
  const { source, sourceId, shippingAddress, cartItems, totalAmount } = checkout || {};
  const label = checkout?.label || (cartItems?.length === 1 ? '1 item' : `${cartItems?.length || 1} items`);

  const { createPaymentMethod } = useStripe();
  const cart = useCart();
  const toast = useToast();
  const [cardOk, setCardOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [order, setOrder] = useState(null);

  const pay = async () => {
    if (!cardOk) {
      toast.warn('Please enter complete card details');
      return;
    }
    if (!checkout) {
      toast.error('Missing checkout context');
      return;
    }
    try {
      setLoading(true);
      const { paymentMethod, error } = await createPaymentMethod({ paymentMethodType: 'Card' });
      if (error) {
        toast.error(error.message);
        return;
      }
      const body = {
        source,
        paymentMethod: 'card',
        paymentMethodId: paymentMethod.id,
        shippingAddress,
      };
      if (source === 'cart') body.cartItems = cartItems;
      else body.sourceId = sourceId;

      const { data } = await client.post('/api/checkout', body);
      setOrder(data.order);
      setSuccess(true);
      if (source === 'cart') cart.clear();
      setTimeout(() => navigation.replace('OrderDetail', { id: data.order._id }), 2200);
    } catch (err) {
      toast.error(err.userMessage || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (success && order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Confetti count={80} />
        <View style={styles.successWrap}>
          <Animated.View entering={FadeIn.duration(400).springify()}>
            <View style={styles.successIcon}>
              <Text style={{ fontSize: 56, color: '#FFFFFF' }}>✓</Text>
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(200).duration(420)} style={styles.successTitle}>
            Payment successful!
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(280).duration(420)} style={styles.successSub}>
            Order {order.orderNumber}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(360).duration(420)} style={styles.successHint}>
            Taking you to your order…
          </Animated.Text>
        </View>
      </View>
    );
  }

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Card>
          <Text style={styles.label}>You're paying for</Text>
          <Text style={styles.label2}>{label}</Text>
          <View style={styles.divider} />
          <Text style={styles.label}>Total</Text>
          <Text style={styles.amount}>{formatPrice(totalAmount)}</Text>
          <Badge label="Test mode · No real money" variant="info" style={{ marginTop: 8 }} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(420)}>
        <Text style={styles.section}>Card details</Text>
        <View style={styles.cardWrap}>
          <CardField
            postalCodeEnabled={false}
            placeholders={{ number: '4242 4242 4242 4242' }}
            cardStyle={{
              backgroundColor: colors.bg,
              textColor: colors.text,
              placeholderColor: colors.textMuted,
            }}
            style={styles.cardField}
            onCardChange={(c) => setCardOk(c.complete)}
          />
        </View>
        <Text style={styles.testCard}>
          Use the test card{'  '}
          <Text style={{ fontFamily: 'Courier', color: colors.text, fontWeight: '700' }}>4242 4242 4242 4242</Text>
          {'  '}· any future expiry · any CVC
        </Text>

        <GradientButton
          title={loading ? 'Processing…' : `Pay ${formatPrice(totalAmount)}`}
          icon="🔒"
          onPress={pay}
          loading={loading}
          size="lg"
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  label2: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 16 },
  amount: { color: colors.accent, fontSize: 36, fontWeight: '900', marginTop: 4, letterSpacing: -1 },
  section: { ...type.h3, color: colors.text, marginTop: 16, marginBottom: 12 },
  cardWrap: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: 8,
  },
  cardField: { width: '100%', height: 50 },
  testCard: { color: colors.textDim, fontSize: 12, marginBottom: 16 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.success, shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
  },
  successTitle: { ...type.h1, color: colors.text, marginTop: 24, textAlign: 'center', fontSize: 28 },
  successSub: { ...type.body, color: colors.textDim, marginTop: 8 },
  successHint: { color: colors.textMuted, fontSize: 13, marginTop: 24 },
});
