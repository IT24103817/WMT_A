import { useState, useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import StatusTracker from '../../components/StatusTracker';
import { orders, reviews } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { colors, formatPrice, type } from '../../theme';

export default function OrderDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [hasReview, setHasReview] = useState(false);

  const load = useCallback(async () => {
    try {
      const o = await orders.get(id);
      setOrder(o);
      if (o?.gem?._id) {
        const rs = await reviews.byGem(o.gem._id);
        setHasReview(rs.some((r) => String(r.order) === String(o._id) && String(r.customer?._id || r.customer) === String(user?.id)));
      }
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

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Text style={styles.num}>{order.orderNumber}</Text>
        <Text style={styles.name}>{order.gem?.name}</Text>
        <Text style={styles.amount}>{formatPrice(order.amount)}</Text>

        <Card>
          <StatusTracker status={order.status} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(420)}>
        <Card>
          <Row label="Source" value={order.source} />
          <Divider />
          <Row label="Placed" value={new Date(order.createdAt).toLocaleString()} />
          <Divider />
          <Row label="Last update" value={new Date(order.updatedAt).toLocaleString()} />
        </Card>

        {order.status === 'Confirmed' ? (
          <Button title="Cancel order" variant="outline" onPress={cancel} textStyle={{ color: colors.danger }} />
        ) : null}

        {order.status === 'Delivered' && !hasReview ? (
          <GradientButton
            title="Leave a review"
            icon="⭐"
            onPress={() => navigation.navigate('Review', { orderId: order._id, gemName: order.gem?.name })}
          />
        ) : null}

        {order.status === 'Delivered' && hasReview ? (
          <Card style={{ backgroundColor: colors.successBg, borderColor: colors.success }}>
            <Text style={{ color: colors.success, fontWeight: '700' }}>✓ You've reviewed this order</Text>
            <Text style={{ color: colors.text, marginTop: 4, fontSize: 13 }}>Thanks for the feedback!</Text>
          </Card>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

function Row({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
      <Text style={{ color: colors.textDim, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>{value}</Text>
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
});
