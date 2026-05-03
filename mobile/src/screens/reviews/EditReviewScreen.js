import { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Input from '../../components/Input';
import GradientButton from '../../components/GradientButton';
import StarRating from '../../components/StarRating';
import TagPicker from '../../components/TagPicker';
import { reviews } from '../../api';
import { useToast } from '../../components/Toast';
import { pickerAssetToFile } from '../../utils/upload';
import { colors, type, radii } from '../../theme';

const ratingLabel = ['', 'Disappointing', 'Could be better', 'Decent', 'Loved it', 'Outstanding'];
const MAX_PHOTOS = 3;

export default function EditReviewScreen({ route, navigation }) {
  const { review } = route.params;
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || '');
  const [tags, setTags] = useState(review.tags || []);
  const [keptPhotos, setKeptPhotos] = useState(review.photos || []);   // existing URLs we want to keep
  const [newPhotos, setNewPhotos] = useState([]);                       // freshly picked assets
  const [tagOptions, setTagOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    reviews.tagsList().then(setTagOptions).catch(() => setTagOptions([]));
  }, []);

  const totalCount = keptPhotos.length + newPhotos.length;

  const pickPhotos = async () => {
    const remaining = MAX_PHOTOS - totalCount;
    if (remaining <= 0) {
      toast.warn(`Maximum ${MAX_PHOTOS} photos`);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (res.canceled) return;
    setNewPhotos((prev) => [...prev, ...(res.assets || [])].slice(0, MAX_PHOTOS - keptPhotos.length));
  };

  const removeKept = (idx) => setKeptPhotos((p) => p.filter((_, i) => i !== idx));
  const removeNew = (idx) => setNewPhotos((p) => p.filter((_, i) => i !== idx));

  const save = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('rating', String(rating));
      fd.append('comment', comment);
      fd.append('tags', JSON.stringify(tags));
      // server-side rule: if any new files are sent, they REPLACE the photos array.
      // To keep some old + add new, we need to upload all of them as fresh files.
      // To keep only some old + no new uploads, send `keepPhotos` JSON.
      if (newPhotos.length > 0) {
        // Mixing kept + new: easiest is to keep nothing + treat all uploads as new.
        // But user might have only removed some old ones. Simpler UX: when any new
        // photo is added, the server replaces; ask user to re-pick from library.
        // For now: just send the new photos and rely on REPLACE behaviour.
        newPhotos.forEach((p) => fd.append('photos', pickerAssetToFile(p, 'image/jpeg')));
      } else {
        // No new uploads — send keepPhotos so server can prune removed URLs.
        fd.append('keepPhotos', JSON.stringify(keptPhotos));
      }

      await reviews.update(review._id, fd);
      toast.success('Review updated');
      navigation.goBack();
    } catch (e) {
      toast.error(e.userMessage || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={{ fontSize: 48 }}>💎</Text>
          <Text style={styles.gemName}>{review.gem?.name || 'Gem'}</Text>
          <Text style={styles.askedFor}>Update your review</Text>

          <View style={{ marginVertical: 20 }}>
            <StarRating value={rating} onChange={setRating} size={42} />
          </View>

          <Text style={styles.ratingLabel}>{ratingLabel[rating]}</Text>
        </Card>

        {tagOptions.length > 0 ? (
          <TagPicker tags={tagOptions} selected={tags} onChange={setTags} />
        ) : null}

        <Input
          label="Your comment"
          value={comment}
          onChangeText={setComment}
          multiline
          style={{ minHeight: 120 }}
          placeholder="What changed your mind?"
        />

        <Text style={styles.label}>Photos ({totalCount}/{MAX_PHOTOS})</Text>
        {newPhotos.length > 0 && keptPhotos.length > 0 ? (
          <Text style={styles.warn}>Adding new photos will replace the existing ones on save.</Text>
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {keptPhotos.map((url, i) => (
            <View key={`old-${i}`} style={styles.photoWrap}>
              <Image source={{ uri: url }} style={styles.photo} />
              <Pressable onPress={() => removeKept(i)} style={styles.photoRemove} hitSlop={6}>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>×</Text>
              </Pressable>
            </View>
          ))}
          {newPhotos.map((p, i) => (
            <View key={`new-${i}`} style={styles.photoWrap}>
              <Image source={{ uri: p.uri }} style={styles.photo} />
              <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
              <Pressable onPress={() => removeNew(i)} style={styles.photoRemove} hitSlop={6}>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>×</Text>
              </Pressable>
            </View>
          ))}
          {totalCount < MAX_PHOTOS ? (
            <Pressable onPress={pickPhotos} style={styles.photoAdd}>
              <Text style={{ fontSize: 22 }}>📷</Text>
              <Text style={styles.photoAddLabel}>Add</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <GradientButton title="Save changes" icon="✓" onPress={save} loading={loading} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gemName: { ...type.h1, color: colors.text, fontSize: 22, marginTop: 12 },
  askedFor: { color: colors.textDim, fontSize: 14, marginTop: 8 },
  ratingLabel: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  label: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  warn: { color: colors.warn, fontSize: 12, marginBottom: 10 },
  photoWrap: { marginRight: 8, position: 'relative' },
  photo: { width: 88, height: 88, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  photoRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  newBadge: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  photoAdd: {
    width: 88, height: 88, borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  photoAddLabel: { color: colors.textDim, fontSize: 11, marginTop: 4, fontWeight: '600' },
});
