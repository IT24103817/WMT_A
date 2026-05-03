import { useState, useCallback } from 'react';
import { Text, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import { orders } from '../../api';
import { colors, formatPrice, type } from '../../theme';

const statusVariant = {
  Confirmed: 'info',
  Processing: 'warn',
  'Out for Delivery': 'accent',
  Delivered: 'success',
  Cancelled: 'danger',
};

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
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card onPress={() => navigation.navigate('OrderDetail', { id: item._id })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.num}>{item.orderNumber}</Text>
                  <Text style={styles.name}>{item.gem?.name}</Text>
                  <Text style={styles.amount}>{formatPrice(item.amount)}</Text>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Badge label={item.status} variant={statusVariant[item.status] || 'neutral'} />
              </View>
            </Card>
          </AnimatedListItem>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  h1: { ...type.display, color: colors.text },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  num: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 4 },
  amount: { color: colors.accent, fontSize: 18, fontWeight: '800', marginTop: 8 },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
