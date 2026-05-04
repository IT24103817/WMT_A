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
import { marketplace } from '../../api';
import { useToast } from '../../components/Toast';
import { listingPhoto } from '../../utils/photo';
import { colors, formatPrice, type } from '../../theme';

const statusVariant = { active: 'success', sold: 'neutral', removed: 'warn' };

export default function AdminListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setListings(await marketplace.list());
    } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (l) => {
    try { await marketplace.remove(l._id); toast.success('Listing removed'); load(); }
    catch (e) { toast.error(e.userMessage); }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>Listings</Text>
          <Text style={styles.sub}>Storefront catalogue</Text>
        </View>
        <GradientButton title="New" icon="+" size="sm" onPress={() => navigation.navigate('ListingForm', {})} />
      </View>
      <FlatList
        data={listings}
        keyExtractor={(l) => l._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={<EmptyState icon="🛒" title="No listings yet" message="Publish gems from inventory to your shop." />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card padded={false}>
              {listingPhoto(item) ? <Image source={{ uri: listingPhoto(item) }} style={styles.thumb} /> : null}
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.gem?.name}</Text>
                    <Text style={styles.meta}>{formatPrice(item.price)}</Text>
                  </View>
                  <Badge label={item.status} variant={statusVariant[item.status] || 'neutral'} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Button title="Edit" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => navigation.navigate('ListingForm', { listing: item })} />
                  <Button title="Remove" variant="outline" size="sm" style={{ flex: 1 }} onPress={() => remove(item)} textStyle={{ color: colors.danger }} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  h1: { ...type.display, color: colors.text },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  thumb: { width: '100%', height: 160 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  meta: { color: colors.accent, fontSize: 16, fontWeight: '800', marginTop: 4 },
});
