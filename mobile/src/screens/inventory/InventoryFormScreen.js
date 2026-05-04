/**
 * InventoryFormScreen — Inventory (M1)
 * Create-or-edit form. Posts multipart FormData to inventory.create() or
 * inventory.update(). Photo picker supports up to 6 images, distinguishes
 * "kept" existing URLs from freshly picked device files.
 * Validations (client): name/type/colour/carats/stockQty required;
 * carats > 0; stockQty ≥ 0. Server enforces the same.
 */
import { useState } from 'react';
import { Text, View, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Input from '../../components/Input';
import GradientButton from '../../components/GradientButton';
import { inventory } from '../../api';
import { useToast } from '../../components/Toast';
import { pickerAssetToFile } from '../../utils/upload';
import { colors, type, radii } from '../../theme';

const MAX_PHOTOS = 6;

export default function InventoryFormScreen({ navigation, route }) {
  const editing = route.params?.gem || null;
  const [name, setName] = useState(editing?.name || '');
  const [type_, setType] = useState(editing?.type || '');
  const [colour, setColour] = useState(editing?.colour || '');
  const [carats, setCarats] = useState(editing?.carats?.toString() || '');
  const [stockQty, setStockQty] = useState(editing?.stockQty?.toString() || '1');
  const [keptPhotos, setKeptPhotos] = useState(editing?.photos || []);
  const [newPhotos, setNewPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const totalPhotos = keptPhotos.length + newPhotos.length;

  const pickPhotos = async () => {
    const remaining = MAX_PHOTOS - totalPhotos;
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

  const removeKept = (i) => setKeptPhotos((p) => p.filter((_, idx) => idx !== i));
  const removeNew = (i) => setNewPhotos((p) => p.filter((_, idx) => idx !== i));

  const submit = async () => {
    const e = {};
    if (!name.trim()) e.name = 'Required';
    if (!type_.trim()) e.type = 'Required';
    if (!colour.trim()) e.colour = 'Required';
    const c = Number(carats);
    if (!(c > 0)) e.carats = 'Must be greater than 0';
    const s = Number(stockQty);
    if (!(s >= 0)) e.stockQty = 'Must be 0 or more';
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('type', type_.trim());
      fd.append('colour', colour.trim());
      fd.append('carats', String(c));
      fd.append('stockQty', String(s));

      if (newPhotos.length > 0) {
        // New uploads REPLACE the photo array on the server.
        newPhotos.forEach((p) => fd.append('photos', pickerAssetToFile(p, 'image/jpeg')));
      } else if (editing) {
        fd.append('keepPhotos', JSON.stringify(keptPhotos));
      }

      if (editing) await inventory.update(editing._id, fd);
      else await inventory.create(fd);
      toast.success(editing ? 'Saved' : 'Gem added');
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
        <Text style={styles.h1}>{editing ? 'Edit gem' : 'New gem'}</Text>
        <Text style={styles.sub}>Photos here become the gem's identity — they show up on listings, offers, and orders.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(360)} style={{ marginTop: 24 }}>
        <Input label="Name" value={name} onChangeText={setName} placeholder="Royal Sapphire" error={errors.name} />
        <Input label="Type" value={type_} onChangeText={setType} placeholder="Sapphire / Ruby / Emerald" autoCapitalize="words" error={errors.type} />
        <Input label="Colour" value={colour} onChangeText={setColour} placeholder="Royal blue" error={errors.colour} />
        <Input label="Carats" value={carats} onChangeText={setCarats} keyboardType="decimal-pad" placeholder="2.4" error={errors.carats} />
        <Input label="Stock quantity" value={stockQty} onChangeText={setStockQty} keyboardType="number-pad" error={errors.stockQty} hint="Set to 0 to mark unavailable" />

        <Text style={styles.label}>Photos ({totalPhotos}/{MAX_PHOTOS})</Text>
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
          {totalPhotos < MAX_PHOTOS ? (
            <Pressable onPress={pickPhotos} style={styles.photoAdd}>
              <Text style={{ fontSize: 22 }}>📷</Text>
              <Text style={styles.photoAddLabel}>Add</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <GradientButton title={editing ? 'Save changes' : 'Add gem'} icon="✓" onPress={submit} loading={loading} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, color: colors.text, fontSize: 28 },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 6 },
  label: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  warn: { color: colors.warn, fontSize: 12, marginBottom: 10 },
  photoWrap: { marginRight: 8, position: 'relative' },
  photo: { width: 96, height: 96, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
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
    width: 96, height: 96, borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  photoAddLabel: { color: colors.textDim, fontSize: 11, marginTop: 4, fontWeight: '600' },
});
