import { useEffect, useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Input from '../../components/Input';
import GradientButton from '../../components/GradientButton';
import Chip from '../../components/Chip';
import { bids, inventory } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, type } from '../../theme';

export default function BidFormScreen({ navigation }) {
  const [gems, setGems] = useState([]);
  const [gemId, setGemId] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [hours, setHours] = useState('24');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { inventory.list().then(setGems).catch(() => {}); }, []);

  const submit = async () => {
    const e = {};
    if (!gemId) e.gemId = 'Pick a gem';
    if (!(Number(startPrice) > 0)) e.startPrice = 'Required';
    const h = Number(hours);
    if (!(h > 0)) e.hours = 'Hours > 0';
    setErrors(e);
    if (Object.keys(e).length) return;

    const endTime = new Date(Date.now() + h * 3600 * 1000).toISOString();
    try {
      setLoading(true);
      await bids.create({ gemId, startPrice: Number(startPrice), endTime });
      toast.success('Auction live!');
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
        <Text style={styles.h1}>New auction</Text>

        <Text style={styles.label}>Gem</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {gems.filter((g) => g.stockQty > 0).map((g) => (
            <Chip key={g._id} label={g.name} active={gemId === g._id} onPress={() => setGemId(g._id)} />
          ))}
        </ScrollView>
        {errors.gemId ? <Text style={styles.err}>{errors.gemId}</Text> : null}

        <Input label="Starting price ($)" value={startPrice} onChangeText={setStartPrice} keyboardType="decimal-pad" leftIcon="$" error={errors.startPrice} />
        <Input label="Duration" value={hours} onChangeText={setHours} keyboardType="number-pad" hint="Hours from now" error={errors.hours} />

        <GradientButton title="Start auction" icon="🔨" onPress={submit} loading={loading} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, color: colors.text, fontSize: 28, marginBottom: 24 },
  label: { color: colors.textDim, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  err: { color: colors.danger, fontSize: 12, marginBottom: 8 },
});
