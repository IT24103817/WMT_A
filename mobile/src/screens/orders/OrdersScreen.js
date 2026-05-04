import { useState, useCallback } from 'react';
import { Text, FlatList, StyleSheet, View, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import { orders } from '../../api';
import { colors, formatPrice, type, radii } from '../../theme';

const statusVariant = {
  Confirmed: 'info',
  Processing: 'warn',
  'Out for Delivery': 'accent',
  Delivered: 'success',
  Cancelled: 'danger',
};

function summarize(order) {
  const items = order.items || [];
  const first = items[0];
  const photo = first?.photoSnapshot || first?.gem?.photos?.[0] || null;
  const name = first?.gemNameSnapshot || first?.gem?.name || 'Gem';
  const more = items.length > 1 ? ` + ${items.length - 1} more` : '';
  return { photo, name, summary: `${name}${more}`, count: items.length };
}

export default function OrdersScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setList(await orders.mine());
    } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>My Orders</Text>
        <Text style={styles.sub}>{list.length} order{list.length === 1 ? '' : 's'}</Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(o) => o._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title="No orders yet"
            message="Browse the marketplace and complete your first purchase."
          />
        }
        renderItem={({ item, index }) => {
          const s = summarize(item);
          return (
            <AnimatedListItem index={index}>
              <Card onPress={() => navigation.navigate('OrderDetail', { id: item._id })}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {s.photo ? (
                    <Image source={{ uri: s.photo }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 22 }}>💎</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.num}>{item.orderNumber}</Text>
                    <Text style={styles.name}>{s.summary}</Text>
                    <Text style={styles.amount}>{formatPrice(item.totalAmount || 0)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                      <Badge label={item.status} variant={statusVariant[item.status] || 'neutral'} />
                    </View>
                  </View>
                </View>
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
  thumb: { width: 72, height: 72, borderRadius: radii.md },
  num: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  amount: { color: colors.accent, fontSize: 18, fontWeight: '900', marginTop: 6 },
  date: { color: colors.textMuted, fontSize: 12 },
});
