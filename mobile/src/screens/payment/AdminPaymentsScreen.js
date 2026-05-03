import { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import { payments } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, formatPrice, type } from '../../theme';

const sourceVariant = { direct: 'primary', offer: 'info', bid: 'accent' };
const sourceIcon = { direct: '🛒', offer: '💬', bid: '🔨' };

export default function AdminPaymentsScreen() {
  const [list, setList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setList(await payments.list());
    } catch (e) {
      toast.error(e.userMessage || 'Failed to load payments');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totals = useMemo(() => {
    const successful = list.filter((p) => p.status === 'success');
    const total = successful.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { count: successful.length, total };
  }, [list]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>Payments</Text>
        <Text style={styles.sub}>All transactions on the platform</Text>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Card>
          <View style={styles.kpiRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kpiLabel}>Total revenue</Text>
              <Text style={styles.kpiValue}>{formatPrice(totals.total)}</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.kpiLabel}>Successful</Text>
              <Text style={[styles.kpiValue, { color: colors.success }]}>{totals.count}</Text>
            </View>
          </View>
        </Card>
      </View>

      <FlatList
        data={list}
        keyExtractor={(p) => p._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={<EmptyState icon="💳" title="No payments yet" message="Successful payments will appear here." />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gem}>{item.gem?.name || 'Gem'}</Text>
                  <Text style={styles.customer}>{item.customer?.name} · {item.customer?.email}</Text>
                  <Text style={styles.ref} numberOfLines={1}>Ref: {item.stripeRef}</Text>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.amount}>{formatPrice(item.amount)}</Text>
                  <Badge label={`${sourceIcon[item.source] || ''} ${item.source}`} variant={sourceVariant[item.source] || 'neutral'} />
                  <Badge label={item.status} variant={item.status === 'success' ? 'success' : 'danger'} />
                </View>
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
  kpiRow: { flexDirection: 'row', alignItems: 'center' },
  kpiLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  kpiValue: { color: colors.text, fontSize: 26, fontWeight: '900', marginTop: 4 },
  kpiDivider: { width: 1, height: 36, backgroundColor: colors.divider, marginHorizontal: 16 },
  row: { flexDirection: 'row' },
  gem: { color: colors.text, fontSize: 16, fontWeight: '700' },
  customer: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  ref: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  amount: { color: colors.accent, fontSize: 18, fontWeight: '800' },
});
