/**
 * AdminReviewsScreen — Reviews (M4)
 * Admin moderation hub. Aggregate stats card (avg + 1-5★ distribution +
 * top tag mentions), filter chips (All / With photos / Needs reply /
 * Replied) and sort tabs (Newest / Oldest / Highest / Lowest). Each card
 * has Reply (5-300 chars) and Delete actions.
 */
import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, Pressable, TextInput, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import Badge from '../../components/Badge';
import StarRating from '../../components/StarRating';
import RatingBadge from '../../components/RatingBadge';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import PhotoLightbox from '../../components/PhotoLightbox';
import { reviews as reviewsApi } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, type, radii } from '../../theme';

const ADMIN_SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'highest', label: 'Highest' },
  { key: 'lowest', label: 'Lowest' },
];

const ADMIN_FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'photos', label: '📷 With photos' },
  { key: 'noReply', label: 'Needs reply' },
  { key: 'replied', label: 'Replied' },
];

export default function AdminReviewsScreen() {
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [lightboxPhotos, setLightboxPhotos] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [sort, setSort] = useState('newest');
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      const [all, s] = await Promise.all([
        reviewsApi.listAll(),
        reviewsApi.sellerStats().catch(() => null),
      ]);
      setList(all);
      setStats(s);
    } catch (e) {
      toast.error(e.userMessage || 'Failed to load reviews');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sortedList = (() => {
    let out = [...list];
    if (filter === 'photos') out = out.filter((r) => r.photos?.length > 0);
    else if (filter === 'noReply') out = out.filter((r) => !r.adminReply);
    else if (filter === 'replied') out = out.filter((r) => !!r.adminReply);

    if (sort === 'newest') out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === 'oldest') out.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sort === 'highest') out.sort((a, b) => b.rating - a.rating);
    else if (sort === 'lowest') out.sort((a, b) => a.rating - b.rating);
    return out;
  })();

  const remove = async (review) => {
    try {
      await reviewsApi.remove(review._id);
      toast.success('Review removed');
      load();
    } catch (e) {
      toast.error(e.userMessage || 'Failed to delete');
    }
  };

  const submitReply = async (review) => {
    if (!replyText.trim()) return toast.warn('Reply cannot be empty');
    try {
      await reviewsApi.reply(review._id, replyText.trim());
      toast.success('Reply posted');
      setReplyTo(null);
      setReplyText('');
      load();
    } catch (e) {
      toast.error(e.userMessage || 'Reply failed');
    }
  };

  const removeReply = async (review) => {
    try {
      await reviewsApi.removeReply(review._id);
      toast.success('Reply removed');
      load();
    } catch (e) {
      toast.error(e.userMessage || 'Failed to remove');
    }
  };

  const openLightbox = (photos, index = 0) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>Reviews</Text>
        <Text style={styles.sub}>Moderate every review across the platform</Text>
      </View>

      {stats ? (
        <View style={{ paddingHorizontal: 20 }}>
          <Card>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statsLabel}>Average rating</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                  <Text style={styles.statsValue}>{stats.avg.toFixed(1)}</Text>
                  <Text style={{ color: colors.textDim, marginLeft: 4 }}>/ 5</Text>
                </View>
                <Text style={styles.statsHint}>{stats.count} review{stats.count === 1 ? '' : 's'}</Text>
              </View>
              <RatingBadge rating={stats.avg} count={stats.count} />
            </View>
            <View style={styles.distWrap}>
              {[5, 4, 3, 2, 1].map((n) => {
                const c = stats.distribution?.[n] || 0;
                const max = Math.max(1, ...Object.values(stats.distribution || {}));
                const pct = (c / max) * 100;
                return (
                  <View key={n} style={styles.distRow}>
                    <Text style={styles.distLabel}>{n}★</Text>
                    <View style={styles.distBar}>
                      <View style={[styles.distFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.distCount}>{c}</Text>
                  </View>
                );
              })}
            </View>
            {stats.tagCounts?.length ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.tagsHeading}>Top mentions</Text>
                <View style={styles.tagWrap}>
                  {stats.tagCounts.slice(0, 6).map((t) => (
                    <View key={t.tag} style={styles.tagPill}>
                      <Text style={styles.tagText}>{t.tag}</Text>
                      <Text style={styles.tagCount}>{t.count}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </Card>
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ADMIN_FILTER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setFilter(opt.key)}
              style={[styles.toolChip, filter === opt.key ? styles.toolChipActive : styles.toolChipInactive]}
            >
              <Text style={[styles.toolChipText, filter === opt.key && { color: colors.primary }]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={styles.toolbar}>
        <Text style={styles.sortLabel}>Sort by</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ADMIN_SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setSort(opt.key)}
              style={[styles.toolChip, sort === opt.key ? styles.toolChipActive : styles.toolChipInactive]}
            >
              <Text style={[styles.toolChipText, sort === opt.key && { color: colors.primary }]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={sortedList}
        keyExtractor={(r) => r._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={<EmptyState icon="📝" title="No reviews yet" message="Reviews will appear once customers receive their orders." />}
        renderItem={({ item, index }) => {
          const editing = replyTo === item._id;
          return (
            <AnimatedListItem index={index}>
              <Card>
                <View style={styles.reviewTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewer}>{item.customer?.name || 'Anonymous'}</Text>
                    <Text style={styles.reviewMeta}>
                      {item.gem?.name} · {item.order?.orderNumber}
                    </Text>
                  </View>
                  <StarRating value={item.rating} size={14} readonly />
                </View>

                {item.tags?.length ? (
                  <View style={styles.smallTagRow}>
                    {item.tags.map((t) => (
                      <Badge key={t} label={t} variant="primary" />
                    ))}
                  </View>
                ) : null}

                {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}

                {item.photos?.length ? (
                  <View style={styles.photosRow}>
                    {item.photos.map((p, i) => (
                      <Pressable key={i} onPress={() => openLightbox(item.photos, i)}>
                        <Image source={{ uri: p }} style={styles.reviewPhoto} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>

                {item.adminReply ? (
                  <View style={styles.replyBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.replyHead}>↳ Reply by {item.adminReply.by?.name || 'Admin'}</Text>
                      <Pressable onPress={() => removeReply(item)} hitSlop={6}>
                        <Text style={{ color: colors.danger, fontSize: 11, fontWeight: '700' }}>Remove</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.replyText}>{item.adminReply.text}</Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {!item.adminReply && !editing ? (
                    <Button
                      title="Reply"
                      variant="secondary"
                      size="sm"
                      icon="↩"
                      style={{ flex: 1 }}
                      onPress={() => { setReplyTo(item._id); setReplyText(''); }}
                    />
                  ) : null}
                  <Button title="Delete" variant="outline" size="sm" style={{ flex: 1 }} textStyle={{ color: colors.danger }} onPress={() => remove(item)} />
                </View>

                {editing ? (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                      placeholder="Public reply (visible to all customers)…"
                      placeholderTextColor={colors.textMuted}
                      selectionColor={colors.primary}
                      style={styles.replyEditor}
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Button title="Cancel" variant="outline" size="sm" style={{ flex: 1 }} onPress={() => { setReplyTo(null); setReplyText(''); }} />
                      <GradientButton title="Post" icon="✓" size="sm" style={{ flex: 1 }} onPress={() => submitReply(item)} />
                    </View>
                  </View>
                ) : null}
              </Card>
            </AnimatedListItem>
          );
        }}
      />

      <PhotoLightbox
        visible={lightboxPhotos !== null}
        photos={lightboxPhotos || []}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxPhotos(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  h1: { ...type.display, color: colors.text },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statsLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  statsValue: { color: colors.text, fontSize: 36, fontWeight: '900' },
  statsHint: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  distWrap: { marginTop: 16, gap: 6 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distLabel: { color: colors.textDim, fontSize: 12, width: 20 },
  distBar: { flex: 1, height: 8, backgroundColor: colors.surfaceMuted, borderRadius: 4, overflow: 'hidden' },
  distFill: { height: '100%', backgroundColor: colors.primary },
  distCount: { color: colors.textDim, fontSize: 12, width: 24, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 14 },
  tagsHeading: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  tagText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  tagCount: { color: colors.textDim, fontSize: 11, fontWeight: '600' },

  toolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 6,
  },
  sortLabel: { color: colors.textDim, fontSize: 12, fontWeight: '700', marginRight: 6 },
  toolChip: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: radii.pill, borderWidth: 1,
    marginRight: 8,
  },
  toolChipInactive: { backgroundColor: colors.bg, borderColor: colors.border },
  toolChipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  toolChipText: { fontSize: 12, fontWeight: '700', color: colors.textDim },

  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  reviewer: { color: colors.text, fontSize: 15, fontWeight: '700' },
  reviewMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  smallTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  comment: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 8 },
  photosRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reviewPhoto: { width: 64, height: 64, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 8 },

  replyBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  replyHead: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  replyText: { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 6 },

  replyEditor: {
    minHeight: 80,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
