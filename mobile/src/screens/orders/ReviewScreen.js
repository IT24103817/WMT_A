/**
 * ReviewScreen — Reviews (M4)
 * Customer posts a new review for a delivered order. Validations (client):
 * rating 1-5 (integer), comment 10-500 chars OR empty, no URLs, no
 * all-caps shouting, max 3 photos, max 3 tags from 8 predefined.
 * Server (reviewController.create) re-validates the same rules.
 */
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

const URL_RE = /\b(?:https?:\/\/|www\.)\S+/i;

export default function ReviewScreen({ route, navigation }) {
  const { orderId, gemId, gemName, gemPhoto, gemMeta } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    reviews.tagsList().then(setTagOptions).catch(() => setTagOptions([]));
  }, []);

  const pickPhotos = async () => {
    const remaining = MAX_PHOTOS - photos.length;
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
    setPhotos((prev) => [...prev, ...(res.assets || [])].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (idx) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const validate = () => {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return 'Please pick a rating from 1 to 5 stars';
    }
    const trimmed = (comment || '').trim();
    if (trimmed.length > 0 && trimmed.length < 10) {
      return 'Comment must be at least 10 characters (or leave it blank)';
    }
    if (trimmed.length > 500) return 'Comment is too long (max 500)';
    if (URL_RE.test(trimmed)) return 'Please don\'t include links in your review';
    const letters = trimmed.replace(/[^A-Za-z]/g, '');
    if (letters.length >= 8 && letters === letters.toUpperCase()) {
      return 'Please don\'t shout — avoid all-caps comments';
    }
    if (tags.length > 3) return 'Pick up to 3 tags';
    if (photos.length > 3) return 'Up to 3 photos only';
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      toast.warn(err);
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('orderId', orderId);
      if (gemId) fd.append('gemId', gemId);
      fd.append('rating', String(rating));
      fd.append('comment', comment);
      fd.append('tags', JSON.stringify(tags));
      photos.forEach((p) => fd.append('photos', pickerAssetToFile(p, 'image/jpeg')));

      await reviews.create(fd);
      toast.success('Thanks for your review!');
      navigation.goBack();
    } catch (e) {
      toast.error(e.userMessage || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  const remaining = 500 - (comment || '').length;

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          {gemPhoto ? (
            <Image source={{ uri: gemPhoto }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }]}>
              <Text style={{ fontSize: 48 }}>💎</Text>
            </View>
          )}
          <Text style={styles.gemName}>{gemName}</Text>
          {gemMeta ? <Text style={styles.gemSpec}>{gemMeta}</Text> : null}
          <Text style={styles.askedFor}>How was your experience?</Text>

          <View style={{ marginVertical: 20 }}>
            <StarRating value={rating} onChange={setRating} size={42} />
          </View>

          <Text style={styles.ratingLabel}>{ratingLabel[rating]}</Text>
        </Card>

        {tagOptions.length > 0 ? (
          <TagPicker tags={tagOptions} selected={tags} onChange={setTags} />
        ) : null}

        <Input
          label="Tell us more (optional)"
          value={comment}
          onChangeText={(v) => setComment(v.slice(0, 500))}
          multiline
          style={{ minHeight: 100 }}
          placeholder="What made it special? (10–500 characters)"
        />
        <Text style={[styles.counter, remaining < 30 && { color: colors.warn }]}>
          {remaining} characters left
        </Text>

        <Text style={styles.label}>Photos {photos.length > 0 ? `(${photos.length}/${MAX_PHOTOS})` : `(up to ${MAX_PHOTOS})`}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {photos.map((p, i) => (
            <View key={i} style={styles.photoWrap}>
              <Image source={{ uri: p.uri }} style={styles.photo} />
              <Pressable onPress={() => removePhoto(i)} style={styles.photoRemove} hitSlop={6}>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>×</Text>
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <Pressable onPress={pickPhotos} style={styles.photoAdd}>
              <Text style={{ fontSize: 22 }}>📷</Text>
              <Text style={styles.photoAddLabel}>Add</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <GradientButton title="Submit review" icon="✦" onPress={submit} loading={loading} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroImage: { width: 140, height: 140, borderRadius: radii.lg, backgroundColor: colors.surfaceMuted },
  gemName: { ...type.h1, color: colors.text, fontSize: 22, marginTop: 16 },
  gemSpec: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  askedFor: { color: colors.textDim, fontSize: 14, marginTop: 8 },
  counter: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: -6, marginBottom: 12, fontWeight: '600' },
  ratingLabel: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  label: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  photoWrap: { marginRight: 8, position: 'relative' },
  photo: { width: 88, height: 88, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  photoRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: {
    width: 88, height: 88, borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  photoAddLabel: { color: colors.textDim, fontSize: 11, marginTop: 4, fontWeight: '600' },
});
