import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import GradientButton from '../../components/GradientButton';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import { offers } from '../../api';
import { listingPhoto } from '../../utils/photo';
import { colors, formatPrice, type } from '../../theme';

const variantFor = (s) =>
  s === 'paid' ? 'primary'
  : s === 'accepted' ? 'success'
  : s === 'rejected' ? 'danger'
  : 'warn';

const labelFor = (s) => s === 'paid' ? 'Paid ✓' : s;

export default function CustomerOffersScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setList(await offers.mine());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>My Offers</Text>
        <Text style={styles.sub}>Track every offer you've made</Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(o) => o._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="No offers yet"
            message="Browse the marketplace and make an offer on a negotiable listing."
          />
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card onPress={() => navigation.navigate('GemDetail', { id: item.listing?._id })}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {listingPhoto(item.listing) ? (
                  <Image source={{ uri: listingPhoto(item.listing) }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 22 }}>💎</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.listing?.gem?.name || 'Gem'}</Text>
                  <Text style={styles.meta}>{item.listing?.gem?.type}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatPrice(item.amount)}</Text>
                    <Text style={styles.listPrice}>list {formatPrice(item.listing?.price)}</Text>
                  </View>
                </View>
                <Badge label={labelFor(item.status)} variant={variantFor(item.status)} />
              </View>

              {item.status === 'accepted' ? (
                <GradientButton
                  title={`Pay ${formatPrice(item.amount)}`}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    navigation.navigate('Checkout', { source: 'offer', sourceId: item._id });
                  }}
                  style={{ marginTop: 12 }}
                  size="sm"
                />
              ) : null}
            </Card>
          </AnimatedListItem>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  h1: { ...type.display, color: colors.text },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  thumb: { width: 70, height: 70, borderRadius: 12, backgroundColor: colors.surfaceMuted },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8, gap: 8 },
  price: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  listPrice: { color: colors.textMuted, fontSize: 12, textDecorationLine: 'line-through' },
});
