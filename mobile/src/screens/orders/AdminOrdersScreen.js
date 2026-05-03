import { useState, useCallback } from 'react';
import { Text, FlatList, View, StyleSheet, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import { orders } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, formatPrice, type } from '../../theme';

const statusVariant = {
  Confirmed: 'info',
  Processing: 'warn',
  'Out for Delivery': 'accent',
  Delivered: 'success',
  Cancelled: 'danger',
};

export default function AdminOrdersScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refunding, setRefunding] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setList(await orders.listAll());
    } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancelOrder = (order) => {
    const proceed = async () => {
      try {
        setRefunding(order._id);
        const result = await orders.cancelWithRefund(order._id);
        toast.success(result.refundRef ? `Refunded · ${result.refundRef.slice(-8)}` : 'Order cancelled');
        load();
      } catch (e) {
        toast.error(e.userMessage || 'Cancel failed');
      } finally {
        setRefunding(null);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Cancel ${order.orderNumber} and refund the customer?`)) proceed();
    } else {
      Alert.alert(
        'Cancel and refund?',
        `Order ${order.orderNumber} for ${order.customer?.name} (${formatPrice(order.amount)}) will be cancelled and refunded via Stripe. Stock returns to inventory; the listing reopens.`,
        [
          { text: 'Keep order', style: 'cancel' },
          { text: 'Cancel & refund', style: 'destructive', onPress: proceed },
        ]
      );
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>Orders</Text>
        <Text style={styles.sub}>Manage shipments and refunds</Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(o) => o._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={<EmptyState icon="📦" title="No orders yet" message="Customer orders will appear here after payment." />}
        renderItem={({ item, index }) => {
          const isFinal = item.status === 'Cancelled' || item.status === 'Delivered';
          return (
            <AnimatedListItem index={index}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.num}>{item.orderNumber}</Text>
                    <Text style={styles.name}>{item.gem?.name}</Text>
                    <Text style={styles.customer}>{item.customer?.name} · {formatPrice(item.amount)}</Text>
                  </View>
                  <Badge label={item.status} variant={statusVariant[item.status] || 'neutral'} />
                </View>

                {!isFinal ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Button
                      title="Cancel"
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      textStyle={{ color: colors.danger }}
                      loading={refunding === item._id}
                      onPress={() => cancelOrder(item)}
                    />
                    <GradientButton
                      title="Update"
                      icon="✎"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => navigation.navigate('AdminOrderUpdate', { id: item._id })}
                    />
                  </View>
                ) : null}
              </Card>
            </AnimatedListItem>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  h1: { ...type.display, color: colors.text },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  num: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  customer: { color: colors.textDim, fontSize: 13, marginTop: 4 },
});
