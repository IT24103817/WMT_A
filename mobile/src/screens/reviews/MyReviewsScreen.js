/**
 * MyReviewsScreen — Reviews (M4)
 * Customer-owned list. Calls reviews.mine(). Each row links to
 * EditReviewScreen (within 30-day window) or Delete.
 */
import { useState, useCallback } from 'react';
import { Text, FlatList, View, StyleSheet, Alert, Platform, Pressable, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import StarRating from '../../components/StarRating';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import PhotoLightbox from '../../components/PhotoLightbox';
import { reviews as reviewsApi } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, type, radii } from '../../theme';

export default function MyReviewsScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setList(await reviewsApi.mine());
    } catch (e) {
      toast.error(e.userMessage || 'Failed to load');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (review) => {
    const proceed = async () => {
      try {
        await reviewsApi.remove(review._id);
        toast.success('Review deleted');
        load();
      } catch (e) {
        toast.error(e.userMessage || 'Delete failed');
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Delete this review?')) proceed();
    } else {
      Alert.alert('Delete review?', `Your review of ${review.gem?.name} will be removed.`, [
        { text: 'Keep', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: proceed },
      ]);
    }
  };

  const openLightbox = (photos, index = 0) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>My Reviews</Text>
        <Text style={styles.sub}>Edit, add photos, or delete your reviews</Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(r) => r._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={<EmptyState icon="🌟" title="No reviews yet" message="Once an order is delivered you can leave a review from your Orders." />}
        renderItem={({ item, index }) => {
          const wasEdited = new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 60_000;
          return (
            <AnimatedListItem index={index}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gem}>{item.gem?.name}</Text>
                    <Text style={styles.meta}>
                      {item.gem?.type} · {item.order?.orderNumber}
                    </Text>
                  </View>
                  <StarRating value={item.rating} size={16} readonly />
                </View>

                {item.tags?.length ? (
                  <View style={styles.tagRow}>
                    {item.tags.map((t) => <Badge key={t} label={t} variant="primary" />)}
                  </View>
                ) : null}

                {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}

                {item.photos?.length ? (
                  <View style={styles.photosRow}>
                    {item.photos.map((p, i) => (
                      <Pressable key={i} onPress={() => openLightbox(item.photos, i)}>
                        <Image source={{ uri: p }} style={styles.photo} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString()}{wasEdited ? ' · edited' : ''}
                </Text>

                {item.adminReply ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyHead}>↳ Reply from {item.adminReply.by?.name || 'Admin'}</Text>
                    <Text style={styles.replyText}>{item.adminReply.text}</Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Button
                    title="Edit"
                    variant="secondary"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate('EditReview', { review: item })}
                  />
                  <Button
                    title="Delete"
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    textStyle={{ color: colors.danger }}
                    onPress={() => remove(item)}
                  />
                </View>
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
  gem: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  comment: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 10 },
  photosRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  photo: { width: 72, height: 72, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 8 },

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
});
