import { useState, useCallback } from 'react';
import { Text, FlatList, View, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import { offers } from '../../api';
import { useToast } from '../../components/Toast';
import { listingPhoto } from '../../utils/photo';
import { colors, formatPrice, type } from '../../theme';

const variantFor = (s) => (s === 'accepted' ? 'success' : s === 'rejected' ? 'danger' : 'warn');

export default function AdminOffersScreen() {
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setData(await offers.listAll());
    } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const decide = async (id, action) => {
    try {
      await offers.decide(id, action);
      toast.success(action === 'accept' ? 'Offer accepted' : 'Offer rejected');
      load();
    } catch (e) { toast.error(e.userMessage); }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>Offers</Text>
        <Text style={styles.sub}>Review and decide on negotiation requests</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(o) => o._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={<EmptyState icon="💬" title="No offers yet" message="Customer offers on negotiable listings will appear here." />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {listingPhoto(item.listing) ? (
                  <Image source={{ uri: listingPhoto(item.listing) }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 22 }}>💎</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.gem}>{item.listing?.gem?.name || 'Gem'}</Text>
                  <Text style={styles.from}>From {item.customer?.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 8 }}>
                    <Text style={styles.amount}>{formatPrice(item.amount)}</Text>
                    <Text style={styles.list}>list {formatPrice(item.listing?.price)}</Text>
                  </View>
                </View>
                <Badge label={item.status} variant={variantFor(item.status)} />
              </View>
              {item.status === 'pending' ? (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <GradientButton title="Accept" icon="✓" size="sm" onPress={() => decide(item._id, 'accept')} style={{ flex: 1 }} />
                  <Button title="Reject" variant="outline" size="sm" textStyle={{ color: colors.danger }} onPress={() => decide(item._id, 'reject')} style={{ flex: 1 }} />
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  h1: { ...type.display, color: colors.text },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  thumb: { width: 70, height: 70, borderRadius: 12 },
  gem: { color: colors.text, fontSize: 16, fontWeight: '700' },
  from: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  amount: { color: colors.accent, fontSize: 20, fontWeight: '900' },
  list: { color: colors.textMuted, fontSize: 12, textDecorationLine: 'line-through' },
});
