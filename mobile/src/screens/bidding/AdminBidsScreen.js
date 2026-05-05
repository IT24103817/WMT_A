import { useState, useCallback } from 'react';
import { Text, FlatList, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import Badge from '../../components/Badge';
import CountdownTimer from '../../components/CountdownTimer';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import { bids } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, formatPrice, type } from '../../theme';

const statusVariant = { active: 'success', closed: 'neutral', cancelled: 'warn', scheduled: 'info' };

export default function AdminBidsScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setList(await bids.list());
    } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (b) => {
    try { await bids.remove(b._id); toast.success('Auction cancelled'); load(); }
    catch (e) { toast.error(e.userMessage); }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>Auctions</Text>
          <Text style={styles.sub}>Live and past bids</Text>
        </View>
        <GradientButton title="New" icon="+" size="sm" onPress={() => navigation.navigate('BidForm')} />
      </View>
      <FlatList
        data={list}
        keyExtractor={(b) => b._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={<EmptyState icon="🔨" title="No auctions" message="Start an auction by listing a gem with a starting price + end time." />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.gem?.name}</Text>
                  <Text style={styles.meta}>
                    Highest: {formatPrice(item.currentHighest?.amount || item.startPrice)}
                  </Text>
                </View>
                <Badge label={item.status} variant={statusVariant[item.status] || 'neutral'} />
              </View>
              {item.description ? (
                <Text style={{ color: colors.textDim, fontSize: 13, marginTop: 6, lineHeight: 18 }} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              {item.status === 'scheduled' && item.scheduledStartAt ? (
                <Text style={{ color: colors.info, marginTop: 8, fontSize: 12, fontWeight: '700' }}>
                  🕒 Starts {new Date(item.scheduledStartAt).toLocaleString()}
                </Text>
              ) : null}
              {item.status === 'active' ? (
                <View style={{ marginTop: 8 }}>
                  <CountdownTimer endTime={item.endTime} />
                </View>
              ) : null}
              {item.status === 'closed' && !item.currentHighest?.customer ? (
                <Text style={{ color: colors.warn, marginTop: 8, fontWeight: '600', fontSize: 13 }}>
                  ⚠ No bids placed — relist or return to inventory
                </Text>
              ) : null}
              {(item.status === 'active' || item.status === 'scheduled') ? (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Button
                    title="Edit"
                    variant="secondary"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate('BidForm', { bid: item })}
                  />
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => remove(item)}
                    textStyle={{ color: colors.danger }}
                  />
                </View>
              ) : null}
            </Card>
          </AnimatedListItem>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  h1: { ...type.display, color: colors.text },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: 13, marginTop: 4 },
});
