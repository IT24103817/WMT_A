import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Screen from '../components/Screen';
import Hero from '../components/Hero';
import Card from '../components/Card';
import Badge from '../components/Badge';
import GradientButton from '../components/GradientButton';
import RatingBadge from '../components/RatingBadge';
import Skeleton, { SkeletonCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import CountdownTimer from '../components/CountdownTimer';
import AnimatedListItem from '../components/AnimatedListItem';
import { marketplace, bids, learning, reviews } from '../api';
import { useAuth } from '../context/AuthContext';
import { listingPhoto } from '../utils/photo';
import { colors, spacing, formatPrice, type } from '../theme';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [bidList, setBidList] = useState([]);
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      const [l, b, a, s] = await Promise.all([
        marketplace.list().catch(() => []),
        bids.list().catch(() => []),
        learning.list().catch(() => []),
        reviews.sellerStats().catch(() => null),
      ]);
      setListings(l);
      setBidList(b);
      setArticles(a);
      setStats(s);
      setLoaded(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const featured = useMemo(() => listings.filter((l) => l.status === 'active').slice(0, 6), [listings]);
  const endingSoon = useMemo(
    () =>
      bidList
        .filter((b) => b.status === 'active')
        .sort((a, b) => new Date(a.endTime) - new Date(b.endTime))
        .slice(0, 5),
    [bidList]
  );
  const latestArticles = useMemo(() => articles.slice(0, 5), [articles]);

  return (
    <Screen scroll padded={false} refreshing={refreshing} onRefresh={load}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Hero
          eyebrow={`Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
          title="Discover rare gems."
          subtitle="Curated sapphires, rubies, emeralds and more — buy outright, negotiate, or bid in live auctions."
          cta={
            <GradientButton
              title="Browse marketplace"
              icon="✦"
              onPress={() => navigation.navigate('Market')}
            />
          }
        />

        {stats && stats.count > 0 ? (
          <Animated.View entering={FadeIn.delay(280).duration(420)}>
            <Pressable onPress={() => navigation.navigate('SellerProfile')}>
              <Card>
                <View style={styles.statsRow}>
                  <View>
                    <Text style={styles.eyebrow}>The Atelier</Text>
                    <Text style={styles.statsTitle}>GemMarket Atelier</Text>
                  </View>
                  <RatingBadge rating={stats.avg} count={stats.count} />
                </View>
                <View style={styles.divider} />
                <View style={styles.statsBottom}>
                  <Stat label="Listings" value={listings.length} />
                  <Stat label="Auctions" value={bidList.filter(b => b.status==='active').length} />
                  <Stat label="Articles" value={articles.length} />
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>

      {/* Featured listings */}
      <SectionHeader
        title="Featured gems"
        action="View all"
        onPress={() => navigation.navigate('Market')}
      />
      {!loaded ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {[0, 1, 2].map((i) => <View key={i} style={{ width: 240 }}><SkeletonCard /></View>)}
        </ScrollView>
      ) : featured.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <EmptyState icon="💎" title="No listings yet" message="The admin hasn't published any gems for sale." />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {featured.map((l, i) => (
            <AnimatedListItem key={l._id} index={i} style={{ width: 240, marginRight: 12 }}>
              <Pressable onPress={() => navigation.navigate('GemDetail', { id: l._id })}>
                <Card padded={false}>
                  {listingPhoto(l) ? (
                    <Image source={{ uri: listingPhoto(l) }} style={styles.featuredImg} />
                  ) : (
                    <View style={[styles.featuredImg, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 36 }}>💎</Text>
                    </View>
                  )}
                  <View style={{ padding: 12 }}>
                    <Text style={styles.itemName} numberOfLines={1}>{l.gem?.name}</Text>
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {l.gem?.type} · {l.gem?.carats}ct
                    </Text>
                    <View style={styles.itemRow}>
                      <Text style={styles.itemPrice}>{formatPrice(l.price)}</Text>
                      {l.openForOffers ? <Badge label="Negotiable" variant="primary" /> : null}
                    </View>
                  </View>
                </Card>
              </Pressable>
            </AnimatedListItem>
          ))}
        </ScrollView>
      )}

      {/* Ending soon (auctions) */}
      {endingSoon.length > 0 && (
        <>
          <SectionHeader
            title="Ending soon"
            action="See auctions"
            onPress={() => navigation.navigate('Auctions')}
          />
          <View style={{ paddingHorizontal: 20 }}>
            {endingSoon.map((b, i) => (
              <AnimatedListItem key={b._id} index={i}>
                <Card onPress={() => navigation.navigate('BidDetail', { id: b._id })}>
                  <View style={styles.bidRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{b.gem?.name}</Text>
                      <Text style={styles.itemMeta}>
                        {b.gem?.type} · {b.gem?.carats}ct
                      </Text>
                      <Text style={[styles.itemPrice, { marginTop: 6 }]}>
                        {formatPrice(b.currentHighest?.amount || b.startPrice)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Badge label="LIVE" variant="danger" />
                      <View style={{ height: 6 }} />
                      <CountdownTimer endTime={b.endTime} />
                    </View>
                  </View>
                </Card>
              </AnimatedListItem>
            ))}
          </View>
        </>
      )}

      {/* Latest articles */}
      {latestArticles.length > 0 && (
        <>
          <SectionHeader
            title="Learn the craft"
            action="More articles"
            onPress={() => navigation.navigate('Learn')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {latestArticles.map((a, i) => (
              <AnimatedListItem key={a._id} index={i} style={{ width: 220, marginRight: 12 }}>
                <Pressable onPress={() => navigation.navigate('ArticleDetail', { id: a._id })}>
                  <Card padded={false}>
                    {a.coverImageUrl ? (
                      <Image source={{ uri: a.coverImageUrl }} style={styles.articleImg} />
                    ) : (
                      <View style={[styles.articleImg, { backgroundColor: colors.surfaceAlt }]} />
                    )}
                    <View style={{ padding: 12 }}>
                      <Text style={styles.cat}>{a.category}</Text>
                      <Text style={styles.itemName} numberOfLines={2}>{a.title}</Text>
                    </View>
                  </Card>
                </Pressable>
              </AnimatedListItem>
            ))}
          </ScrollView>
        </>
      )}

      <View style={{ height: 32 }} />
    </Screen>
  );
}

function SectionHeader({ title, action, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onPress} hitSlop={6}>
          <Text style={styles.sectionAction}>{action} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { ...type.h2, color: colors.text },
  sectionAction: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  hScroll: { paddingHorizontal: 20, paddingRight: 8 },
  featuredImg: { width: '100%', height: 160, backgroundColor: colors.surfaceMuted },
  articleImg: { width: '100%', height: 110, backgroundColor: colors.surfaceMuted },
  itemName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  itemMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  itemPrice: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  bidRow: { flexDirection: 'row', alignItems: 'center' },
  cat: { color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  statsTitle: { ...type.h3, color: colors.text, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 14 },
  statsBottom: { flexDirection: 'row' },
  statValue: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.textDim, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
});
