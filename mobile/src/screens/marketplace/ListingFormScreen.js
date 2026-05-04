import { useEffect, useState } from 'react';
import { Text, View, ScrollView, Pressable, StyleSheet, Switch, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Input from '../../components/Input';
import GradientButton from '../../components/GradientButton';
import GemPicker from '../../components/GemPicker';
import { marketplace, inventory } from '../../api';
import { useToast } from '../../components/Toast';
import { pickerAssetToFile } from '../../utils/upload';
import { colors, radii, type } from '../../theme';

export default function ListingFormScreen({ navigation, route }) {
  const editing = route.params?.listing || null;
  const [gem, setGem] = useState(editing?.gem || null);
  const [price, setPrice] = useState(editing?.price?.toString() || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [openForOffers, setOpenForOffers] = useState(!!editing?.openForOffers);
  const [video, setVideo] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // When editing, ensure we have the populated gem (might be just an id)
  useEffect(() => {
    if (editing && editing.gem && typeof editing.gem === 'string') {
      inventory.get(editing.gem).then(setGem).catch(() => {});
    }
  }, [editing]);

  const pickVideo = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (!r.canceled && r.assets?.[0]) setVideo(r.assets[0]);
  };

  const submit = async () => {
    const e = {};
    if (!editing && !gem) e.gem = 'Pick a gem';
    if (!(Number(price) > 0)) e.price = 'Required';
    if (!description.trim()) e.description = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;

    if (gem && (!gem.photos || gem.photos.length === 0)) {
      toast.warn(`This gem has no photos yet — add some in Inventory first so customers can see it.`);
    }

    const fd = new FormData();
    if (!editing) fd.append('gemId', gem._id);
    fd.append('price', String(Number(price)));
    fd.append('description', description.trim());
    fd.append('openForOffers', String(openForOffers));
    if (video) fd.append('video', pickerAssetToFile(video, 'video/mp4'));

    try {
      setLoading(true);
      if (editing) await marketplace.update(editing._id, fd);
      else await marketplace.create(fd);
      toast.success(editing ? 'Listing updated' : 'Listing published');
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
        <Text style={styles.h1}>{editing ? 'Edit listing' : 'New listing'}</Text>
        <Text style={styles.sub}>Photos come from the gem in inventory — no need to upload again here.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(360)} style={{ marginTop: 24 }}>
        {!editing ? (
          <GemPicker selectedGem={gem} onSelect={setGem} />
        ) : (
          <View style={styles.lockedGemCard}>
            {gem?.photos?.[0] ? (
              <Image source={{ uri: gem.photos[0] }} style={styles.lockedThumb} />
            ) : (
              <View style={[styles.lockedThumb, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 22 }}>💎</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.lockedName}>{gem?.name}</Text>
              <Text style={styles.lockedMeta}>{gem?.type} · {gem?.carats}ct</Text>
              <Text style={styles.lockedHint}>Gem locked — change in Inventory</Text>
            </View>
          </View>
        )}
        {errors.gem ? <Text style={styles.err}>{errors.gem}</Text> : null}

        {gem?.photos?.length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionLabel}>Photos from inventory ({gem.photos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {gem.photos.map((p, i) => (
                <Image key={i} source={{ uri: p }} style={styles.gemPhoto} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <Input label="Price ($)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" leftIcon="$" error={errors.price} />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ minHeight: 100 }}
          placeholder="Tell the story of this piece…"
          error={errors.description}
        />

        <View style={styles.toggleRow}>
          <View>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>Open for negotiation</Text>
            <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 2 }}>Allow customers to send offers</Text>
          </View>
          <Switch
            value={openForOffers}
            onValueChange={setOpenForOffers}
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={styles.sectionLabel}>Video (optional)</Text>
        <Pressable onPress={pickVideo} style={styles.picker}>
          <Text style={{ fontSize: 22 }}>🎬</Text>
          <Text style={{ color: colors.textDim, marginTop: 4 }}>{video ? 'Change video…' : 'Tap to choose'}</Text>
        </Pressable>

        <GradientButton title={editing ? 'Save changes' : 'Publish listing'} icon="✦" onPress={submit} loading={loading} style={{ marginTop: 20 }} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, color: colors.text, fontSize: 28 },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 6 },
  err: { color: colors.danger, fontSize: 12, marginBottom: 8 },
  sectionLabel: { color: colors.textDim, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  gemPhoto: { width: 80, height: 80, borderRadius: radii.md, marginRight: 8, backgroundColor: colors.surfaceMuted },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, padding: 14, marginBottom: 16,
  },
  picker: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: radii.md, paddingVertical: 24, alignItems: 'center', marginBottom: 8,
  },
  lockedGemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md, padding: 12, marginBottom: 16,
  },
  lockedThumb: { width: 56, height: 56, borderRadius: 10 },
  lockedName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  lockedMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  lockedHint: { color: colors.textMuted, fontSize: 11, marginTop: 4, fontWeight: '600' },
});
