import { useEffect, useState, useCallback } from 'react';
import { Text, View, StyleSheet, Image, ScrollView, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeInDown,
} from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import Badge from '../../components/Badge';
import RatingBadge from '../../components/RatingBadge';
import StarRating from '../../components/StarRating';
import EmptyState from '../../components/EmptyState';
import PhotoLightbox from '../../components/PhotoLightbox';
import { marketplace, reviews as reviewsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/Toast';
import { listingGallery } from '../../utils/photo';
import { colors, formatPrice, type, radii } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 320;

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'highest', label: 'Highest' },
  { key: 'lowest', label: 'Lowest' },
];

export default function GemDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const [listing, setListing] = useState(null);
  const [revs, setRevs] = useState([]);
  const [agg, setAgg] = useState(null);
  const [sort, setSort] = useState('newest');
  const [activeTag, setActiveTag] = useState(null);
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const scrollY = useSharedValue(0);

  const isAdmin = user?.role === 'admin';

  const loadListing = useCallback(async () => {
    try {
      const l = await marketplace.get(id);
      setListing(l);
    } catch (e) {
      toast.error(e.userMessage || 'Could not load');
    }
  }, [id]);

  const loadReviews = useCallback(async (gemId) => {
    if (!gemId) return;
    const params = { sort };
    if (activeTag) params.tag = activeTag;
    if (withPhotosOnly) params.withPhotos = 'true';
    try {
      const [rs, a] = await Promise.all([
        reviewsApi.byGem(gemId, params),
        reviewsApi.aggregate(gemId).catch(() => null),
      ]);
      setRevs(rs);
      setAgg(a);
    } catch (e) {
      toast.error(e.userMessage || 'Failed to load reviews');
    }
  }, [sort, activeTag, withPhotosOnly]);

  useFocusEffect(useCallback(() => { loadListing(); }, [loadListing]));
  useEffect(() => {
    if (listing?.gem?._id) loadReviews(listing.gem._id);
  }, [listing?.gem?._id, loadReviews]);

  const onScroll = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-200, 0, HERO_H], [-100, 0, HERO_H * 0.4], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-200, 0], [1.4, 1], Extrapolation.CLAMP) },
    ],
  }));

  if (!listing) {
    return <Screen><Text style={{ color: colors.textDim }}>Loading…</Text></Screen>;
  }

  const buyable = listing.status === 'active' && !isAdmin;
  const tagCounts = agg?.tagCounts || [];

  const submitReply = async (review) => {
    if (!replyText.trim()) {
      toast.warn('Reply cannot be empty');
      return;
    }
    try {
      await reviewsApi.reply(review._id, replyText.trim());
      toast.success('Reply posted');
      setReplyTo(null);
      setReplyText('');
      loadReviews(listing.gem._id);
    } catch (e) {
      toast.error(e.userMessage || 'Reply failed');
    }
  };

  const removeReply = async (review) => {
    try {
      await reviewsApi.removeReply(review._id);
      toast.success('Reply removed');
      loadReviews(listing.gem._id);
    } catch (e) {
      toast.error(e.userMessage || 'Failed to remove');
    }
  };

  const deleteReview = async (id) => {
    try {
      await reviewsApi.remove(id);
      toast.success('Review deleted');
      loadReviews(listing.gem._id);
    } catch (e) {
      toast.error(e.userMessage || 'Delete failed');
    }
  };

  const openLightbox = (photos, index = 0) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroWrap, heroStyle]}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {listingGallery(listing).map((p, i) => (
              <Pressable key={i} onPress={() => openLightbox(listingGallery(listing), i)}>
                <Image source={{ uri: p }} style={styles.heroImage} />
              </Pressable>
            ))}
            {listing.videoUrl ? (
              <Video
                source={{ uri: listing.videoUrl }}
                style={styles.heroImage}
                useNativeControls
                resizeMode={ResizeMode.COVER}
              />
            ) : null}
          </ScrollView>
        </Animated.View>

        <View style={styles.body}>
          <Animated.View entering={FadeInDown.duration(420)}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{listing.gem?.name}</Text>
                <Text style={styles.meta}>
                  {listing.gem?.type} · {listing.gem?.colour} · {listing.gem?.carats}ct
                </Text>
              </View>
              {agg && agg.count > 0 ? <RatingBadge rating={agg.avg} count={agg.count} /> : null}
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(listing.price)}</Text>
              {listing.openForOffers ? <Badge label="Negotiable" variant="primary" /> : null}
            </View>

            <Text style={styles.desc}>{listing.description}</Text>

            <View style={styles.specs}>
              <Spec label="Type" value={listing.gem?.type} />
              <Spec label="Colour" value={listing.gem?.colour} />
              <Spec label="Carats" value={`${listing.gem?.carats}ct`} />
              <Spec label="Status" value={listing.status} />
            </View>
          </Animated.View>

          {buyable ? (
            <Animated.View entering={FadeInDown.delay(120).duration(420)} style={{ marginTop: 20 }}>
              {cart.has(listing._id) ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    title="In cart ✓"
                    variant="secondary"
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate('Cart')}
                  />
                  <GradientButton
                    title="Checkout"
                    icon="→"
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate('Checkout', { source: 'cart' })}
                  />
                </View>
              ) : (
                <GradientButton
                  title={`Add to cart · ${formatPrice(listing.price)}`}
                  icon="🛒"
                  onPress={() => {
                    cart.add(listing);
                    toast.success('Added to cart');
                  }}
                />
              )}
              {listing.openForOffers ? (
                <Button
                  title="Make an offer"
                  variant="outline"
                  onPress={() => navigation.navigate('MakeOffer', {
                    listingId: listing._id,
                    listingPrice: listing.price,
                    gemName: listing.gem?.name,
                  })}
                  style={{ marginTop: 10 }}
                />
              ) : null}
            </Animated.View>
          ) : null}

          {listing.status !== 'active' ? (
            <Card style={{ marginTop: 16, backgroundColor: colors.warnBg, borderColor: colors.warn }}>
              <Text style={{ color: colors.warn, textAlign: 'center', fontWeight: '700' }}>
                This listing is {listing.status}.
              </Text>
            </Card>
          ) : null}

          {/* Reviews section */}
          <Text style={[styles.section, { marginTop: 32 }]}>
            Reviews {agg && agg.count > 0 ? `(${agg.count})` : ''}
          </Text>

          {agg && agg.count > 0 ? (
            <>
              {/* Tag filter chips */}
              {tagCounts.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <FilterChip
                    label="All"
                    count={agg.count}
                    active={!activeTag && !withPhotosOnly}
                    onPress={() => { setActiveTag(null); setWithPhotosOnly(false); }}
                  />
                  {agg.withPhotos > 0 ? (
                    <FilterChip
                      label="📷 With photos"
                      count={agg.withPhotos}
                      active={withPhotosOnly}
                      onPress={() => { setWithPhotosOnly(true); setActiveTag(null); }}
                    />
                  ) : null}
                  {tagCounts.map((tc) => (
                    <FilterChip
                      key={tc.tag}
                      label={tc.tag}
                      count={tc.count}
                      active={activeTag === tc.tag}
                      onPress={() => { setActiveTag(tc.tag); setWithPhotosOnly(false); }}
                    />
                  ))}
                </ScrollView>
              ) : null}

              {/* Sort tabs */}
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>Sort by</Text>
                <View style={styles.sortTabs}>
                  {SORT_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.key}
                      onPress={() => setSort(opt.key)}
                      style={[styles.sortTab, sort === opt.key && styles.sortTabActive]}
                    >
                      <Text style={[styles.sortTabText, sort === opt.key && { color: colors.primary }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          ) : null}

          {revs.length === 0 ? (
            <EmptyState
              icon="🌟"
              title={activeTag || withPhotosOnly ? 'No reviews match the filter' : 'Be the first to review'}
              message={activeTag || withPhotosOnly ? 'Try a different filter.' : "Reviews appear here after a customer's order is delivered."}
            />
          ) : (
            revs.map((r, i) => (
              <ReviewCard
                key={r._id}
                review={r}
                index={i}
                user={user}
                isAdmin={isAdmin}
                onEdit={() => navigation.navigate('EditReview', { review: r })}
                onDelete={() => deleteReview(r._id)}
                onPhotoTap={openLightbox}
                replyEditingId={replyTo === r._id ? r._id : null}
                replyText={replyText}
                onReplyTextChange={setReplyText}
                onReplyOpen={() => { setReplyTo(r._id); setReplyText(r.adminReply?.text || ''); }}
                onReplyCancel={() => { setReplyTo(null); setReplyText(''); }}
                onReplySubmit={() => submitReply(r)}
                onReplyRemove={() => removeReply(r)}
              />
            ))
          )}
        </View>
      </Animated.ScrollView>

      <PhotoLightbox
        visible={lightboxPhotos !== null}
        photos={lightboxPhotos || []}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxPhotos(null)}
      />
    </View>
  );
}

function FilterChip({ label, count, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
      <Text style={[styles.chipLabel, { color: active ? colors.primary : colors.text }]}>{label}</Text>
      <Text style={[styles.chipCount, { color: active ? colors.primary : colors.textDim }]}>{count}</Text>
    </Pressable>
  );
}

function ReviewCard({
  review: r, index, user, isAdmin,
  onEdit, onDelete, onPhotoTap,
  replyEditingId, replyText, onReplyTextChange,
  onReplyOpen, onReplyCancel, onReplySubmit, onReplyRemove,
}) {
  const isMine = r.customer?._id && user?.id && String(r.customer._id) === String(user.id);
  const wasEdited = new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 60_000;
  const editing = replyEditingId === r._id;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(360)}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewer}>
              {r.customer?.name || 'Anonymous'}
              {isMine ? <Text style={{ color: colors.primary, fontWeight: '700' }}>  · you</Text> : null}
            </Text>
            <Text style={styles.verified}>✓ Verified buyer</Text>
          </View>
          <StarRating value={r.rating} size={14} readonly />
        </View>

        {r.tags?.length ? (
          <View style={styles.tagRow}>
            {r.tags.map((t) => (
              <View key={t} style={styles.tagPill}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}

        {r.photos?.length ? (
          <View style={styles.photosRow}>
            {r.photos.map((p, i) => (
              <Pressable key={i} onPress={() => onPhotoTap(r.photos, i)}>
                <Image source={{ uri: p }} style={styles.reviewPhoto} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.date}>
          {new Date(r.createdAt).toLocaleDateString()}{wasEdited ? ' · edited' : ''}
        </Text>

        {/* Admin reply */}
        {r.adminReply ? (
          <View style={styles.replyBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.replyHead}>
                ↳ Reply from {r.adminReply.by?.name || 'Admin'}
              </Text>
              {isAdmin ? (
                <Pressable onPress={onReplyRemove} hitSlop={8}>
                  <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.replyText}>{r.adminReply.text}</Text>
            <Text style={styles.replyDate}>
              {new Date(r.adminReply.repliedAt).toLocaleDateString()}
            </Text>
          </View>
        ) : null}

        {/* Customer's own controls */}
        {isMine ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Button title="Edit" variant="secondary" size="sm" style={{ flex: 1 }} onPress={onEdit} />
            <Button title="Delete" variant="outline" size="sm" style={{ flex: 1 }} textStyle={{ color: colors.danger }} onPress={onDelete} />
          </View>
        ) : null}

        {/* Admin reply controls */}
        {isAdmin && !r.adminReply && !editing ? (
          <Button title="Reply" variant="secondary" size="sm" onPress={onReplyOpen} style={{ marginTop: 12 }} icon="↩" />
        ) : null}

        {isAdmin && editing ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            <View style={styles.replyEditor}>
              <Text style={styles.replyEditorLabel}>Public reply (visible to all customers)</Text>
              <TextInputBoxed value={replyText} onChange={onReplyTextChange} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Cancel" variant="outline" size="sm" style={{ flex: 1 }} onPress={onReplyCancel} />
              <GradientButton title="Post reply" icon="✓" size="sm" style={{ flex: 1 }} onPress={onReplySubmit} />
            </View>
          </View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

// Tiny inline reply editor — using bare TextInput to avoid the Input wrapper margins
function TextInputBoxed({ value, onChange }) {
  const { TextInput } = require('react-native');
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      multiline
      placeholder="Thanks for the kind words…"
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
      style={{
        minHeight: 80,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        padding: 12,
        color: colors.text,
        fontSize: 14,
        textAlignVertical: 'top',
      }}
    />
  );
}

function Spec({ label, value }) {
  return (
    <View style={styles.spec}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: { width: SCREEN_W, height: HERO_H, backgroundColor: colors.surfaceMuted },
  heroImage: { width: SCREEN_W, height: HERO_H },
  body: {
    backgroundColor: colors.bg,
    marginTop: -24,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: 20,
    paddingTop: 24,
  },
  name: { ...type.h1, color: colors.text, fontSize: 26 },
  meta: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  price: { color: colors.accent, fontSize: 30, fontWeight: '900' },
  desc: { color: colors.text, fontSize: 15, lineHeight: 22, marginTop: 16 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 8 },
  spec: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    minWidth: '47%',
    flexGrow: 1,
  },
  specLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  specValue: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 2, textTransform: 'capitalize' },
  section: { ...type.h2, color: colors.text, marginBottom: 12 },

  // Filter chips
  chipScroll: { marginBottom: 12, paddingVertical: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: radii.pill, borderWidth: 1, marginRight: 8,
  },
  chipInactive: { backgroundColor: colors.bg, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  chipCount: { fontSize: 12, fontWeight: '500' },

  // Sort
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sortLabel: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  sortTabs: { flexDirection: 'row', gap: 6 },
  sortTab: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radii.sm },
  sortTabActive: { backgroundColor: colors.primaryGlow },
  sortTabText: { fontSize: 13, fontWeight: '600', color: colors.textDim },

  // Review
  reviewer: { color: colors.text, fontSize: 14, fontWeight: '700' },
  verified: { color: colors.success, fontSize: 11, marginTop: 2, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tagPill: {
    backgroundColor: colors.surfaceAlt, paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  tagText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  comment: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 10 },
  photosRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reviewPhoto: { width: 72, height: 72, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 8 },

  // Admin reply
  replyBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  replyHead: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  replyText: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 6 },
  replyDate: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  replyEditor: {},
  replyEditorLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', marginBottom: 6 },
});
