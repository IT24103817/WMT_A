/**
 * AdminOrderUpdateScreen — Orders (M4)
 * Pick a new status from the 5-enum and confirm. PATCHes /api/orders/:id.
 * The current status row is dimmed; you can't pick the same one.
 */
import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import Badge from '../../components/Badge';
import StatusTracker from '../../components/StatusTracker';
import { orders } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, formatPrice, type, radii } from '../../theme';

const ALL_STATUSES = ['Confirmed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'];

const statusVariant = {
  Confirmed: 'info',
  Processing: 'warn',
  'Out for Delivery': 'accent',
  Delivered: 'success',
  Cancelled: 'danger',
};

const statusIcon = {
  Confirmed: '🆗',
  Processing: '⚙️',
  'Out for Delivery': '🚚',
  Delivered: '✓',
  Cancelled: '✕',
};

export default function AdminOrderUpdateScreen({ route, navigation }) {
  const { id } = route.params;
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    orders.get(id).then(setOrder).catch((e) => toast.error(e.userMessage || 'Failed to load'));
  }, [id]);

  if (!order) return <Screen><Text style={{ color: colors.textDim }}>Loading…</Text></Screen>;

  const apply = async () => {
    if (!pending || pending === order.status) {
      toast.warn('Pick a different status to update');
      return;
    }
    try {
      setLoading(true);
      const updated = await orders.advance(order._id, pending);
      setOrder(updated);
      setPending(null);
      toast.success(`Status set to ${pending}`);
      setTimeout(() => navigation.goBack(), 600);
    } catch (e) {
      toast.error(e.userMessage || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Card>
          <Text style={styles.num}>{order.orderNumber}</Text>
          <Text style={styles.name}>
            {order.items?.[0]?.gemNameSnapshot || order.items?.[0]?.gem?.name || 'Gem'}
            {order.items?.length > 1 ? ` + ${order.items.length - 1} more` : ''}
          </Text>
          <Text style={styles.customer}>{order.customer?.name} · {order.customer?.email}</Text>
          <Text style={styles.amount}>{formatPrice(order.totalAmount || 0)}</Text>
          <View style={{ marginTop: 8, flexDirection: 'row', gap: 6 }}>
            <Badge label={order.status} variant={statusVariant[order.status] || 'neutral'} />
            <Badge label={order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'} variant="info" />
          </View>
        </Card>

        <Card>
          <StatusTracker status={order.status} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(420)}>
        <Text style={styles.section}>Update status</Text>
        <Text style={styles.hint}>Tap a status to select, then confirm.</Text>

        <View style={{ gap: 8, marginTop: 12 }}>
          {ALL_STATUSES.map((s, i) => {
            const isCurrent = s === order.status;
            const isSelected = s === pending;
            return (
              <Pressable
                key={s}
                onPress={() => !isCurrent && setPending(s)}
                disabled={isCurrent}
                style={[
                  styles.option,
                  isCurrent && styles.optionCurrent,
                  isSelected && styles.optionSelected,
                ]}
              >
                <View style={[styles.optionDot, isSelected && { backgroundColor: colors.primary }]}>
                  <Text style={{ fontSize: 14 }}>{statusIcon[s]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, isSelected && { color: colors.primary }]}>{s}</Text>
                  {isCurrent ? <Text style={styles.optionCurrentText}>Current</Text> : null}
                </View>
                {isSelected ? <Text style={styles.tick}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>

        <GradientButton
          title={pending ? `Update to ${pending}` : 'Pick a status'}
          icon="→"
          onPress={apply}
          loading={loading}
          disabled={!pending}
          style={{ marginTop: 20 }}
        />
        <Button title="Back" variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: 8 }} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  num: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  name: { ...type.h1, color: colors.text, fontSize: 24, marginTop: 4 },
  customer: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  amount: { color: colors.accent, fontSize: 22, fontWeight: '900', marginTop: 6 },
  section: { ...type.h2, color: colors.text, marginTop: 8 },
  hint: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  optionCurrent: { opacity: 0.5 },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  optionDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  optionCurrentText: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  tick: { color: colors.primary, fontSize: 18, fontWeight: '900' },
});
