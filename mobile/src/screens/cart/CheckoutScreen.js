import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import Badge from '../../components/Badge';
import client from '../../api/client';
import { offers as offersApi, bids as bidsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/Toast';
import { colors, formatPrice, type, radii } from '../../theme';

const PAYMENT_METHODS = [
  { key: 'card', label: 'Credit / Debit Card', sub: 'Secure Stripe payment, instant confirmation', icon: '💳' },
  { key: 'cod', label: 'Cash on Delivery', sub: 'Pay when the courier hands you the gem', icon: '💵' },
];

export default function CheckoutScreen({ route, navigation }) {
  const { source = 'cart', sourceId } = route.params || {};
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();

  const [items, setItems] = useState([]);                // resolved items for display
  const [resolving, setResolving] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const blank = { fullName: '', phone: '', line1: '', line2: '', city: '', postalCode: '', country: '', notes: '' };
  const [addr, setAddr] = useState(() => {
    const last = user?.lastAddress;
    return last ? { ...blank, ...last } : { ...blank, fullName: user?.name || '' };
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Resolve display items based on source
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (source === 'offer' && sourceId) {
          const all = await offersApi.mine();
          const o = all.find((x) => x._id === sourceId);
          if (alive && o) {
            setItems([{
              gemName: o.listing?.gem?.name || 'Gem',
              gemMeta: [o.listing?.gem?.type, o.listing?.gem?.colour, o.listing?.gem?.carats ? `${o.listing.gem.carats}ct` : null].filter(Boolean).join(' · '),
              photo: o.listing?.gem?.photos?.[0] || o.listing?.photos?.[0] || null,
              unitPrice: o.amount,
              qty: 1,
              badge: 'Negotiated offer',
            }]);
          }
        } else if (source === 'bid' && sourceId) {
          const b = await bidsApi.get(sourceId);
          if (alive) {
            setItems([{
              gemName: b.gem?.name || 'Gem',
              gemMeta: [b.gem?.type, b.gem?.colour, b.gem?.carats ? `${b.gem.carats}ct` : null].filter(Boolean).join(' · '),
              photo: b.gem?.photos?.[0] || null,
              unitPrice: b.currentHighest?.amount || 0,
              qty: 1,
              badge: 'Won at auction',
            }]);
          }
        } else {
          // cart
          if (alive) setItems(cart.items.map((i) => ({
            gemName: i.gemName, gemMeta: i.gemMeta, photo: i.photo, unitPrice: i.unitPrice, qty: i.qty || 1,
          })));
        }
      } finally {
        if (alive) setResolving(false);
      }
    })();
    return () => { alive = false; };
  }, [source, sourceId]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + (i.unitPrice * (i.qty || 1)), 0), [items]);
  const total = subtotal; // shipping = 0 for now

  const validate = () => {
    const e = {};
    ['fullName', 'phone', 'line1', 'city', 'postalCode', 'country'].forEach((f) => {
      if (!addr[f] || !String(addr[f]).trim()) e[f] = 'Required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.warn('Please complete the address');
      return;
    }
    if (source === 'cart' && cart.items.length === 0) {
      toast.warn('Your cart is empty');
      return;
    }

    if (paymentMethod === 'card') {
      // Hand off to PaymentScreen which collects the card and POSTs /api/checkout
      navigation.navigate('Payment', {
        checkout: {
          source,
          sourceId,
          shippingAddress: addr,
          cartItems: source === 'cart' ? cart.items.map((i) => ({ listingId: i.listingId, qty: i.qty || 1 })) : undefined,
          totalAmount: total,
        },
      });
      return;
    }

    // COD path → call /api/checkout directly
    try {
      setLoading(true);
      const body = {
        source,
        paymentMethod: 'cod',
        shippingAddress: addr,
      };
      if (source === 'cart') body.cartItems = cart.items.map((i) => ({ listingId: i.listingId, qty: i.qty || 1 }));
      else body.sourceId = sourceId;

      const { data } = await client.post('/api/checkout', body);
      if (source === 'cart') cart.clear();
      toast.success(`Order ${data.order.orderNumber} placed`);
      navigation.replace('OrderDetail', { id: data.order._id });
    } catch (e) {
      toast.error(e.userMessage || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(360)}>
        <Text style={styles.h1}>Checkout</Text>
        <Text style={styles.sub}>Confirm your details and choose how to pay.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(360)}>
        <Text style={styles.section}>Shipping address</Text>
        <Card>
          <Input label="Full name" value={addr.fullName} onChangeText={(v) => setAddr({ ...addr, fullName: v })} placeholder="Jane Cartier" error={errors.fullName} />
          <Input label="Phone" value={addr.phone} onChangeText={(v) => setAddr({ ...addr, phone: v })} keyboardType="phone-pad" placeholder="+94 71 234 5678" error={errors.phone} />
          <Input label="Address line 1" value={addr.line1} onChangeText={(v) => setAddr({ ...addr, line1: v })} placeholder="Street, building, unit" error={errors.line1} />
          <Input label="Address line 2 (optional)" value={addr.line2} onChangeText={(v) => setAddr({ ...addr, line2: v })} placeholder="Apt, floor, etc." />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input label="City" value={addr.city} onChangeText={(v) => setAddr({ ...addr, city: v })} style={{ flex: 1 }} error={errors.city} />
            <Input label="Postal code" value={addr.postalCode} onChangeText={(v) => setAddr({ ...addr, postalCode: v })} style={{ flex: 1 }} error={errors.postalCode} />
          </View>
          <Input label="Country" value={addr.country} onChangeText={(v) => setAddr({ ...addr, country: v })} placeholder="Sri Lanka" error={errors.country} />
          <Input label="Delivery notes (optional)" value={addr.notes} onChangeText={(v) => setAddr({ ...addr, notes: v })} placeholder="Doorbell, gate code…" />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(360)}>
        <Text style={styles.section}>Payment method</Text>
        {PAYMENT_METHODS.map((pm) => (
          <Pressable
            key={pm.key}
            onPress={() => setPaymentMethod(pm.key)}
            style={[styles.method, paymentMethod === pm.key && styles.methodActive]}
          >
            <Text style={{ fontSize: 24 }}>{pm.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodLabel, paymentMethod === pm.key && { color: colors.primary }]}>{pm.label}</Text>
              <Text style={styles.methodSub}>{pm.sub}</Text>
            </View>
            <View style={[styles.radio, paymentMethod === pm.key && styles.radioOn]}>
              {paymentMethod === pm.key ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(360)}>
        <Text style={styles.section}>Order summary</Text>
        <Card>
          {resolving ? <Text style={{ color: colors.textDim }}>Loading…</Text> : (
            items.map((i, idx) => (
              <View key={idx} style={[styles.summaryItem, idx > 0 && styles.summaryDivider]}>
                {i.photo ? (
                  <Image source={{ uri: i.photo }} style={styles.summaryThumb} />
                ) : (
                  <View style={[styles.summaryThumb, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 18 }}>💎</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryName}>{i.gemName}</Text>
                  <Text style={styles.summaryMeta}>
                    {i.gemMeta}{i.qty > 1 ? `  ·  Qty ${i.qty}` : ''}
                  </Text>
                  {i.badge ? <View style={{ marginTop: 4, alignSelf: 'flex-start' }}><Badge label={i.badge} variant="primary" /></View> : null}
                </View>
                <Text style={styles.summaryPrice}>{formatPrice(i.unitPrice * (i.qty || 1))}</Text>
              </View>
            ))
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Shipping</Text>
            <Text style={styles.totalsValue}>Free</Text>
          </View>
          <View style={[styles.totalsRow, { marginTop: 6 }]}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{formatPrice(total)}</Text>
          </View>
        </Card>
      </Animated.View>

      <GradientButton
        title={paymentMethod === 'card' ? `Pay ${formatPrice(total)}` : `Place order · ${formatPrice(total)}`}
        icon={paymentMethod === 'card' ? '🔒' : '✓'}
        onPress={submit}
        loading={loading}
        size="lg"
        style={{ marginTop: 8 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, color: colors.text, fontSize: 28 },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 6, marginBottom: 16 },
  section: { ...type.h3, color: colors.text, marginTop: 16, marginBottom: 10 },
  method: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.md,
    padding: 14, marginBottom: 8,
  },
  methodActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  methodLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  methodSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  summaryDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  summaryThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surfaceMuted },
  summaryName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  summaryMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  summaryPrice: { color: colors.accent, fontSize: 14, fontWeight: '800' },

  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  totalsLabel: { color: colors.textDim, fontSize: 14 },
  totalsValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  grandLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  grandValue: { color: colors.accent, fontSize: 22, fontWeight: '900' },
});
