import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../components/Screen';
import Card from '../components/Card';
import RatingBadge from '../components/RatingBadge';
import StarRating from '../components/StarRating';
import EmptyState from '../components/EmptyState';
import Hero from '../components/Hero';
import { reviews } from '../api';
import { colors, type } from '../theme';

export default function SellerProfileScreen() {
  const [stats, setStats] = useState(null);

  useEffect(() => { reviews.sellerStats().then(setStats).catch(() => {}); }, []);

  if (!stats) {
    return (
      <Screen scroll>
        <Hero
          eyebrow="The Atelier"
          title="GemMarket Atelier"
          subtitle="A curated collection of rare and ethically sourced gemstones."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Hero
          eyebrow="The Atelier"
          title="GemMarket Atelier"
          subtitle="A curated collection of rare and ethically sourced gemstones from around the world."
        />

        <Card>
          <View style={styles.headRow}>
            <View>
              <Text style={styles.bigNumber}>{stats.avg.toFixed(1)}</Text>
              <View style={{ marginTop: 6 }}>
                <StarRating value={Math.round(stats.avg)} size={18} readonly />
              </View>
              <Text style={styles.basedOn}>Based on {stats.count} review{stats.count === 1 ? '' : 's'}</Text>
            </View>
            <RatingBadge rating={stats.avg} count={stats.count} />
          </View>

          <View style={styles.divider} />

          <View style={styles.distWrap}>
            {[5, 4, 3, 2, 1].map((n) => {
              const c = stats.distribution?.[n] || 0;
              const max = Math.max(1, ...Object.values(stats.distribution || {}));
              const pct = (c / max) * 100;
              return (
                <View key={n} style={styles.distRow}>
                  <Text style={styles.distLabel}>{n} ★</Text>
                  <View style={styles.distBar}>
                    <View style={[styles.distFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.distCount}>{c}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Recent reviews</Text>
        {stats.recent?.length === 0 ? (
          <EmptyState icon="🌟" title="No reviews yet" message="Be the first to leave a review after your purchase arrives." />
        ) : (
          stats.recent?.map((r, i) => (
            <Animated.View key={r._id} entering={FadeInDown.delay(i * 60).springify().damping(18)}>
              <Card>
                <View style={styles.reviewHead}>
                  <View>
                    <Text style={styles.reviewer}>{r.customer?.name || 'Anonymous'}</Text>
                    <Text style={styles.reviewMeta}>on {r.gem?.name}</Text>
                  </View>
                  <StarRating value={r.rating} size={14} readonly />
                </View>
                {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
                <Text style={styles.date}>{new Date(r.createdAt).toLocaleDateString()}</Text>
              </Card>
            </Animated.View>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigNumber: { color: colors.text, fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  basedOn: { color: colors.textDim, fontSize: 12, marginTop: 6 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 16 },
  distWrap: { gap: 6 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distLabel: { color: colors.textDim, fontSize: 12, width: 28 },
  distBar: { flex: 1, height: 8, backgroundColor: colors.surfaceMuted, borderRadius: 4, overflow: 'hidden' },
  distFill: { height: '100%', backgroundColor: colors.primary },
  distCount: { color: colors.textDim, fontSize: 12, width: 24, textAlign: 'right' },
  sectionTitle: { ...type.h2, color: colors.text, marginTop: 28, marginBottom: 12 },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewer: { color: colors.text, fontSize: 15, fontWeight: '700' },
  reviewMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  comment: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 8 },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
});
