import { useEffect, useState, useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import Badge from '../../components/Badge';
import CountdownTimer from '../../components/CountdownTimer';
import AnimatedListItem from '../../components/AnimatedListItem';
import { bids } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { colors, formatPrice, type, radii } from '../../theme';

export default function BidDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const toast = useToast();
  const [bid, setBid] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setBid(await bids.get(id));
    } catch (e) {
      toast.error(e.userMessage);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!bid) return <Screen><Text style={{ color: colors.textDim }}>Loading…</Text></Screen>;

  const currentMax = bid.currentHighest?.amount || bid.startPrice;
  const isWinner = bid.status === 'closed' && bid.winner && String(bid.winner._id || bid.winner) === String(user?.id);
  const userIsHighest = bid.currentHighest?.customer?._id && String(bid.currentHighest.customer._id) === String(user?.id);

  const place = async () => {
    const n = Number(amount);
    if (!(n > currentMax)) {
      toast.warn(`Bid must exceed ${formatPrice(currentMax)}`);
      return;
    }
    try {
      setLoading(true);
      await bids.place(bid._id, n);
      toast.success('Bid placed!');
      setAmount('');
      load();
    } catch (e) {
      toast.error(e.userMessage || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(420)}>
        <View style={styles.gemHero}>
          <Text style={{ fontSize: 56 }}>💎</Text>
          <Text style={styles.name}>{bid.gem?.name}</Text>
          <Text style={styles.meta}>
            {bid.gem?.type} · {bid.gem?.colour} · {bid.gem?.carats}ct
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(120).duration(420)}>
        <Card style={[
          styles.headlineCard,
          bid.status === 'active' && styles.headlineActive,
          bid.status === 'closed' && styles.headlineClosed,
        ]}>
          {bid.status === 'active' ? (
            <Badge label="LIVE AUCTION" variant="danger" style={{ alignSelf: 'center', marginBottom: 8 }} />
          ) : (
            <Badge label={bid.status.toUpperCase()} variant="neutral" style={{ alignSelf: 'center', marginBottom: 8 }} />
          )}
          <Text style={styles.label}>Highest bid</Text>
          <Text style={styles.bigAmount}>{formatPrice(currentMax)}</Text>
          {bid.currentHighest?.customer ? (
            <Text style={styles.bidder}>
              by {userIsHighest ? <Text style={{ color: colors.success, fontWeight: '700' }}>you</Text> : bid.currentHighest.customer.name || 'Customer'}
            </Text>
          ) : (
            <Text style={styles.bidder}>No bids yet</Text>
          )}
          <View style={styles.divider} />
          <Text style={styles.label}>{bid.status === 'active' ? 'Ends in' : 'Status'}</Text>
          {bid.status === 'active' ? (
            <CountdownTimer endTime={bid.endTime} style={{ fontSize: 22, marginTop: 4 }} />
          ) : (
            <Text style={{ color: colors.textDim, fontSize: 18, fontWeight: '700' }}>{bid.status}</Text>
          )}
        </Card>
      </Animated.View>

      {isWinner ? (
        <Animated.View entering={FadeInDown.delay(200).duration(420)}>
          <Card style={{ backgroundColor: colors.successBg, borderColor: colors.success }}>
            <Text style={{ color: colors.success, fontWeight: '800', fontSize: 17 }}>🎉 You won this auction!</Text>
            <Text style={{ color: colors.text, marginTop: 6 }}>
              Complete your purchase to receive your gem.
            </Text>
            <GradientButton
              title={`Pay ${formatPrice(currentMax)}`}
              icon="✦"
              style={{ marginTop: 12 }}
              onPress={() => navigation.navigate('Payment', {
                source: 'bid',
                sourceId: bid._id,
                amount: currentMax,
                label: bid.gem?.name,
              })}
            />
          </Card>
        </Animated.View>
      ) : null}

      {bid.status === 'active' && user?.role === 'customer' ? (
        <Animated.View entering={FadeInDown.delay(280).duration(420)}>
          <Text style={styles.section}>Place your bid</Text>
          <Input
            label={`Must exceed ${formatPrice(currentMax)}`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder={`${currentMax + 50}`}
            leftIcon="$"
          />
          <GradientButton title="Place bid" icon="🔨" onPress={place} loading={loading} />
        </Animated.View>
      ) : null}

      {bid.history?.length ? (
        <>
          <Text style={styles.section}>Bid history</Text>
          {bid.history.slice().reverse().map((h, i) => (
            <AnimatedListItem key={i} index={i}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>
                    {h.customer?.name || 'Anonymous'}
                  </Text>
                  <Text style={{ color: colors.accent, fontWeight: '800' }}>{formatPrice(h.amount)}</Text>
                </View>
              </Card>
            </AnimatedListItem>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gemHero: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.xl,
    marginBottom: 16,
  },
  name: { ...type.h1, color: colors.text, marginTop: 8 },
  meta: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  headlineCard: { alignItems: 'center', paddingVertical: 20 },
  headlineActive: { borderColor: colors.primary, backgroundColor: colors.bg },
  headlineClosed: { backgroundColor: colors.surface },
  label: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  bigAmount: { color: colors.accent, fontSize: 44, fontWeight: '900', marginTop: 4, letterSpacing: -1 },
  bidder: { color: colors.textDim, fontSize: 13, marginTop: 4 },
  divider: { height: 1, width: '100%', backgroundColor: colors.divider, marginVertical: 16 },
  section: { ...type.h2, color: colors.text, marginTop: 24, marginBottom: 12 },
});
