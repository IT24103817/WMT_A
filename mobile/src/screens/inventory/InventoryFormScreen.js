import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Input from '../../components/Input';
import GradientButton from '../../components/GradientButton';
import { inventory } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, type } from '../../theme';

export default function InventoryFormScreen({ navigation, route }) {
  const editing = route.params?.gem || null;
  const [name, setName] = useState(editing?.name || '');
  const [type_, setType] = useState(editing?.type || '');
  const [colour, setColour] = useState(editing?.colour || '');
  const [carats, setCarats] = useState(editing?.carats?.toString() || '');
  const [stockQty, setStockQty] = useState(editing?.stockQty?.toString() || '1');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

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
      const payload = { name: name.trim(), type: type_.trim(), colour: colour.trim(), carats: c, stockQty: s };
      if (editing) await inventory.update(editing._id, payload);
      else await inventory.create(payload);
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
        <Text style={styles.sub}>Inventory is internal — customers don't see it directly.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(360)} style={{ marginTop: 24 }}>
        <Input label="Name" value={name} onChangeText={setName} placeholder="Royal Sapphire" error={errors.name} />
        <Input label="Type" value={type_} onChangeText={setType} placeholder="Sapphire / Ruby / Emerald" autoCapitalize="words" error={errors.type} />
        <Input label="Colour" value={colour} onChangeText={setColour} placeholder="Royal blue" error={errors.colour} />
        <Input label="Carats" value={carats} onChangeText={setCarats} keyboardType="decimal-pad" placeholder="2.4" error={errors.carats} />
        <Input label="Stock quantity" value={stockQty} onChangeText={setStockQty} keyboardType="number-pad" error={errors.stockQty} hint="Set to 0 to mark unavailable" />

        <GradientButton title={editing ? 'Save changes' : 'Add gem'} icon="✓" onPress={submit} loading={loading} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, color: colors.text, fontSize: 28 },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 6 },
});
