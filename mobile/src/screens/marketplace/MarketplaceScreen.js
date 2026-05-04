/**
 * MarketplaceScreen — Marketplace (M3)
 * Public list of active listings. Search box + sort chips
 * (newest / price↑ / price↓ / top rated). Pull-to-refresh + chip filters
 * call marketplace.list({ q, sort }).
 */
import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TextInput, Platform, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import AnimatedListItem from '../../components/AnimatedListItem';
import { marketplace } from '../../api';
import { listingPhoto } from '../../utils/photo';
import { colors, formatPrice, type, radii } from '../../theme';

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'priceAsc', label: 'Price ↑' },
  { key: 'priceDesc', label: 'Price ↓' },
  { key: 'rating', label: 'Top rated' },
];

export default function MarketplaceScreen({ navigation, route }) {
  const presetSearch = route.params?.presetSearch;
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState(presetSearch || '');
  const [sort, setSort] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (presetSearch) {
      setSearch(presetSearch);
      navigation.setParams({ presetSearch: undefined });
    }
  }, [presetSearch]);

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = { sort };
      if (search) params.q = search;
      setListings(await marketplace.list(params));
      setLoaded(true);
    } finally {
      setRefreshing(false);
    }
  }, [search, sort]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>Marketplace</Text>
        <Text style={styles.sub}>Browse our curated collection</Text>
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search by gem name…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={load}
            returnKeyType="search"
            style={styles.search}
            selectionColor={colors.primary}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setSort(opt.key)}
              style={[styles.sortChip, sort === opt.key ? styles.sortChipActive : styles.sortChipInactive]}
            >
              <Text style={[styles.sortChipText, sort === opt.key && { color: colors.primary }]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(l) => l._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 0 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={
          !loaded ? (
            <View>
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </View>
          ) : (
            <EmptyState
              icon="💎"
              title="No gems found"
              message={search ? 'Try a different search term.' : 'Check back soon — new pieces are added regularly.'}
            />
          )
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card padded={false} onPress={() => navigation.navigate('GemDetail', { id: item._id })}>
              {listingPhoto(item) ? (
                <Image source={{ uri: listingPhoto(item) }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Text style={{ fontSize: 38 }}>💎</Text>
                </View>
              )}
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.gem?.name}</Text>
                    <Text style={styles.meta}>
                      {item.gem?.type} · {item.gem?.colour} · {item.gem?.carats}ct
                    </Text>
                  </View>
                  {item.openForOffers ? <Badge label="Negotiable" variant="primary" /> : null}
                </View>
                <Text style={styles.price}>{formatPrice(item.price)}</Text>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  searchIcon: { fontSize: 14, color: colors.textDim, marginRight: 8 },
  search: { flex: 1, color: colors.text, paddingVertical: Platform.OS === 'web' ? 10 : 12, fontSize: 15 },
  sortRow: { marginTop: 12, marginBottom: -4 },
  sortChip: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: radii.pill, borderWidth: 1,
    marginRight: 8,
  },
  sortChipInactive: { backgroundColor: colors.bg, borderColor: colors.border },
  sortChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  sortChipText: { fontSize: 13, fontWeight: '700', color: colors.textDim },
  thumb: { width: '100%', height: 220, backgroundColor: colors.surfaceMuted },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  price: { color: colors.accent, fontSize: 22, fontWeight: '900', marginTop: 12 },
});
