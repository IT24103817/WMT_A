/**
 * MakeOfferScreen — Offers (M3)
 * Customer submits an offer amount on a listing where openForOffers=true.
 * POSTs to /api/offers. The amount must be ≥ 0 (server validates).
 */
import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Input from '../../components/Input';
import Card from '../../components/Card';
import GradientButton from '../../components/GradientButton';
import { offers } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, formatPrice, type } from '../../theme';

export default function MakeOfferScreen({ route, navigation }) {
  const { listingId, listingPrice, gemName } = route.params;
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async () => {
    const n = Number(amount);
    if (!(n > 0)) {
      toast.warn('Enter an amount greater than 0');
      return;
    }
    if (!(n > Number(listingPrice) * 0.6)) {
      toast.warn('Offer must be greater than 60% of the current price.');
      return;
    }
    try {
      setLoading(true);
      await offers.create({ listingId, amount: n });
      toast.success('Offer submitted');
      navigation.goBack();
    } catch (e) {
      toast.error(e.userMessage || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={{ fontSize: 48 }}>💎</Text>
          <Text style={styles.gemName}>{gemName}</Text>
          <Text style={styles.listed}>Listed at {formatPrice(listingPrice)}</Text>
        </Card>

        <Text style={styles.h2}>Your offer</Text>
        <Input
          label="Amount you'd like to pay"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder={`${Math.floor(Number(listingPrice) * 0.85)}`}
          leftIcon="$"
          hint="The seller will review and respond"
        />
        <GradientButton title="Send offer" icon="💬" onPress={submit} loading={loading} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gemName: { ...type.h1, color: colors.text, fontSize: 22, marginTop: 12 },
  listed: { color: colors.textDim, fontSize: 14, marginTop: 6 },
  h2: { ...type.h2, color: colors.text, marginTop: 20, marginBottom: 12 },
});
