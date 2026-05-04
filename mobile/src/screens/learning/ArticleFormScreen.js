/**
 * ArticleFormScreen — Learning Hub (M2)
 * Multipart form with cover image picker. Validations: title/category/body
 * required; category from the 4-enum.
 */
import { useState } from 'react';
import { Text, View, Image, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Input from '../../components/Input';
import GradientButton from '../../components/GradientButton';
import Chip from '../../components/Chip';
import { learning } from '../../api';
import { useToast } from '../../components/Toast';
import { pickerAssetToFile } from '../../utils/upload';
import { colors, radii, type } from '../../theme';

const CATEGORIES = ['Gem Types', 'Buying Guide', 'Grading & Quality', 'Care & Maintenance'];

export default function ArticleFormScreen({ navigation, route }) {
  const editing = route.params?.article || null;
  const [title, setTitle] = useState(editing?.title || '');
  const [category, setCategory] = useState(editing?.category || CATEGORIES[0]);
  const [body, setBody] = useState(editing?.body || '');
  const [cover, setCover] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.[0]) setCover(res.assets[0]);
  };

  const submit = async () => {
    const e = {};
    if (!title.trim()) e.title = 'Required';
    if (!body.trim()) e.body = 'Required';
    if (!editing && !cover) e.cover = 'Cover image required';
    setErrors(e);
    if (Object.keys(e).length) return;

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('category', category);
    fd.append('body', body.trim());
    if (cover) fd.append('cover', pickerAssetToFile(cover, 'image/jpeg'));

    try {
      setLoading(true);
      if (editing) await learning.update(editing._id, fd);
      else await learning.create(fd);
      toast.success(editing ? 'Article updated' : 'Article published');
      navigation.goBack();
    } catch (err) {
      toast.error(err.userMessage || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(360)}>
        <Text style={styles.h1}>{editing ? 'Edit article' : 'Publish article'}</Text>

        <Input label="Title" value={title} onChangeText={setTitle} placeholder="What customers should know about…" error={errors.title} />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>

        <Input label="Body" value={body} onChangeText={setBody} multiline numberOfLines={6} style={{ minHeight: 140 }} placeholder="Share knowledge, stories, and tips." error={errors.body} />

        <Text style={styles.label}>Cover image</Text>
        <Pressable onPress={pick} style={styles.coverBox}>
          {cover ? (
            <Image source={{ uri: cover.uri }} style={styles.coverImg} />
          ) : editing?.coverImageUrl ? (
            <Image source={{ uri: editing.coverImageUrl }} style={styles.coverImg} />
          ) : (
            <>
              <Text style={{ fontSize: 32 }}>📷</Text>
              <Text style={{ color: colors.textDim, marginTop: 8 }}>Tap to choose…</Text>
            </>
          )}
        </Pressable>
        {errors.cover ? <Text style={styles.err}>{errors.cover}</Text> : null}

        <GradientButton title={editing ? 'Save changes' : 'Publish article'} icon="✦" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, color: colors.text, fontSize: 28, marginBottom: 24 },
  label: { color: colors.textDim, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  err: { color: colors.danger, fontSize: 12, marginTop: -8, marginBottom: 8 },
  coverBox: {
    height: 180, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 16,
  },
  coverImg: { width: '100%', height: '100%' },
});
