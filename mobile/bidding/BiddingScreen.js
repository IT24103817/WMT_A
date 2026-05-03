import { useState, useCallback } from 'react';
import { Text, FlatList, View, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import CountdownTimer from '../../components/CountdownTimer';
import AnimatedListItem from '../../components/AnimatedListItem';
import { SkeletonCard } from '../../components/Skeleton';
import { bids } from '../../api';
import { colors, formatPrice, type } from '../../theme';

export default function BiddingScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setList(await bids.list());
      setLoaded(true);
    } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const active = list.filter((b) => b.status === 'active');
  const closed = list.filter((b) => b.status !== 'active');
  const data = [...active, ...closed];

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>Auctions</Text>
        <Text style={styles.sub}>Bid on rare pieces, ending soon</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(b) => b._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={
          !loaded ? (<View>{[0, 1].map((i) => <SkeletonCard key={i} />)}</View>) : (
            <EmptyState icon="🔨" title="No auctions running" message="Check back soon — rare pieces appear here regularly." />
          )
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card padded={false} onPress={() => navigation.navigate('BidDetail', { id: item._id })}>
              <View style={{ flexDirection: 'row' }}>
                <View style={styles.left}>
                  <Text style={{ fontSize: 36 }}>💎</Text>
                </View>
                <View style={{ flex: 1, padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.gem?.name}</Text>
                      <Text style={styles.meta}>
                        {item.gem?.type} · {item.gem?.carats}ct
                      </Text>
                    </View>
                    {item.status === 'active' ? (
                      <Badge label="LIVE" variant="danger" />
                    ) : item.status === 'closed' ? (
                      <Badge label="ENDED" variant="neutral" />
                    ) : (
                      <Badge label={item.status.toUpperCase()} variant="warn" />
                    )}
                  </View>
                  <View style={styles.row}>
                    <View>
                      <Text style={styles.label}>Highest bid</Text>
                      <Text style={styles.price}>{formatPrice(item.currentHighest?.amount || item.startPrice)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.label}>{item.status === 'active' ? 'Ends in' : 'Status'}</Text>
                      {item.status === 'active' ? (
                        <CountdownTimer endTime={item.endTime} style={{ fontSize: 14 }} />
                      ) : (
                        <Text style={{ color: colors.textDim, fontSize: 13, fontWeight: '700' }}>{item.status}</Text>
                      )}
                    </View>
                  </View>
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
  left: { width: 96, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  label: { color: colors.textDim, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  price: { color: colors.accent, fontSize: 18, fontWeight: '900', marginTop: 2 },
});
