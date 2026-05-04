import { useState, useCallback } from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import Badge from '../../components/Badge';
import StatusTracker from '../../components/StatusTracker';
import { orders, reviews } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { colors, formatPrice, type, radii } from '../../theme';

const methodLabel = { card: 'Credit / Debit Card', cod: 'Cash on Delivery' };

export default function OrderDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [hasReviewByGem, setHasReviewByGem] = useState({});

  const load = useCallback(async () => {
    try {
      const o = await orders.get(id);
      setOrder(o);
      const map = {};
      for (const it of (o.items || [])) {
        if (it.gem?._id) {
          try {
            const rs = await reviews.byGem(it.gem._id);
            map[it.gem._id] = rs.some((r) =>
              String(r.order) === String(o._id) &&
              String(r.customer?._id || r.customer) === String(user?.id)
            );
          } catch {}
        }
      }
      setHasReviewByGem(map);
    } catch (e) {
      toast.error(e.userMessage);
    }
  }, [id, user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!order) return <Screen><Text style={{ color: colors.textDim }}>Loading…</Text></Screen>;

  const cancel = async () => {
    try {
      await orders.cancel(order._id);
      toast.success('Order cancelled');
      load();
    } catch (e) { toast.error(e.userMessage); }
  };

  const items = order.items || [];

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Text style={styles.num}>{order.orderNumber}</Text>
        <Text style={styles.name}>
          {items.length === 1 ? items[0].gemNameSnapshot || items[0].gem?.name : `${items.length} items`}
        </Text>
        <Text style={styles.amount}>{formatPrice(order.totalAmount || 0)}</Text>

        <Card>
          <StatusTracker status={order.status} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(420)}>
        <Text style={styles.section}>Items</Text>
        {items.map((it, idx) => {
          const reviewed = hasReviewByGem[it.gem?._id];
          return (
            <Card key={idx}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {it.photoSnapshot || it.gem?.photos?.[0] ? (
                  <Image source={{ uri: it.photoSnapshot || it.gem?.photos?.[0] }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 22 }}>💎</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{it.gemNameSnapshot || it.gem?.name}</Text>
                  <Text style={styles.itemMeta}>
                    {it.gem?.type} · {it.gem?.colour} · {it.gem?.carats}ct
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Badge label={it.source === 'direct' ? 'Buy' : it.source === 'offer' ? 'Negotiated' : 'Auction'} variant="primary" />
                    <Text style={styles.itemPrice}>{formatPrice(it.unitPrice)}</Text>
                  </View>
                  {order.status === 'Delivered' ? (
                    reviewed ? (
                      <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700', marginTop: 8 }}>✓ Reviewed</Text>
                    ) : (
                      <Button
                        title="Leave a review"
                        variant="secondary"
                        size="sm"
                        style={{ marginTop: 8 }}
                        onPress={() => navigation.navigate('Review', {
                          orderId: order._id,
                          gemId: it.gem?._id,
                          gemName: it.gemNameSnapshot || it.gem?.name,
                          gemPhoto: it.photoSnapshot || it.gem?.photos?.[0] || null,
                          gemMeta: [it.gem?.type, it.gem?.colour, it.gem?.carats ? `${it.gem.carats}ct` : null].filter(Boolean).join(' · '),
                        })}
                      />
                    )
                  ) : null}
                </View>
              </View>
            </Card>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(420)}>
        <Text style={styles.section}>Shipping</Text>
        <Card>
          {order.shippingAddress ? (
            <>
              <Text style={styles.addrName}>{order.shippingAddress.fullName}</Text>
              <Text style={styles.addrLine}>{order.shippingAddress.phone}</Text>
              <View style={{ height: 8 }} />
              <Text style={styles.addrLine}>{order.shippingAddress.line1}</Text>
              {order.shippingAddress.line2 ? <Text style={styles.addrLine}>{order.shippingAddress.line2}</Text> : null}
              <Text style={styles.addrLine}>
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </Text>
              <Text style={styles.addrLine}>{order.shippingAddress.country}</Text>
              {order.shippingAddress.notes ? <Text style={[styles.addrLine, { marginTop: 8, fontStyle: 'italic' }]}>"{order.shippingAddress.notes}"</Text> : null}
            </>
          ) : (
            <Text style={{ color: colors.textDim }}>No shipping address on file.</Text>
          )}
        </Card>

        <Text style={styles.section}>Payment</Text>
        <Card>
          <Row label="Method" value={methodLabel[order.paymentMethod] || order.paymentMethod} />
          <Divider />
          <Row label="Subtotal" value={formatPrice(order.subtotal || order.totalAmount || 0)} />
          <Row label="Shipping" value={order.shippingFee ? formatPrice(order.shippingFee) : 'Free'} />
          <Divider />
          <Row label="Total" value={formatPrice(order.totalAmount || 0)} bold />
          <Divider />
          <Row label="Placed" value={new Date(order.createdAt).toLocaleString()} />
        </Card>

        {order.status === 'Confirmed' ? (
          <Button title="Cancel order" variant="outline" onPress={cancel} textStyle={{ color: colors.danger }} />
        ) : null}
      </Animated.View>
    </Screen>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
      <Text style={{ color: colors.textDim, fontSize: 13 }}>{label}</Text>
      <Text style={{
        color: bold ? colors.accent : colors.text,
        fontSize: bold ? 18 : 14,
        fontWeight: bold ? '900' : '600',
      }}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.divider }} />;
}

const styles = StyleSheet.create({
  num: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  name: { ...type.h1, color: colors.text, fontSize: 26, marginTop: 4 },
  amount: { color: colors.accent, fontSize: 28, fontWeight: '900', marginTop: 4, marginBottom: 16 },
  section: { ...type.h3, color: colors.text, marginTop: 16, marginBottom: 10 },
  thumb: { width: 80, height: 80, borderRadius: radii.md },
  itemName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  itemMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  itemPrice: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  addrName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  addrLine: { color: colors.text, fontSize: 13, marginTop: 4 },
});
