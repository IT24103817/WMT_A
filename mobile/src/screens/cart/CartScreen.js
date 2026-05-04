import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import GradientButton from '../../components/GradientButton';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import { useCart } from '../../context/CartContext';
import { colors, formatPrice, type, radii } from '../../theme';

export default function CartScreen({ navigation }) {
  const { items, remove, subtotal, count, updateQty } = useCart();

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>Your cart</Text>
        <Text style={styles.sub}>
          {count === 0 ? 'No items yet' : `${count} item${count === 1 ? '' : 's'} ready for checkout`}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.listingId}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            message="Browse the marketplace and tap Add to cart on any listing."
            action={
              <GradientButton title="Browse marketplace" icon="✦" onPress={() => navigation.navigate('Market')} />
            }
          />
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 24 }}>💎</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.gemName}</Text>
                  <Text style={styles.meta}>{item.gemMeta}</Text>
                  <Text style={styles.price}>{formatPrice(item.unitPrice)}</Text>
                  <View style={styles.qtyRow}>
                    <View style={styles.qtyStepper}>
                      <Pressable
                        onPress={() => updateQty(item.listingId, (item.qty || 1) - 1)}
                        disabled={(item.qty || 1) <= 1}
                        style={[styles.qtyBtn, (item.qty || 1) <= 1 && styles.qtyBtnDisabled]}
                        hitSlop={6}
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.qtyValue}>{item.qty || 1}</Text>
                      <Pressable
                        onPress={() => updateQty(item.listingId, (item.qty || 1) + 1)}
                        disabled={(item.qty || 1) >= (item.stockQty || 1)}
                        style={[styles.qtyBtn, (item.qty || 1) >= (item.stockQty || 1) && styles.qtyBtnDisabled]}
                        hitSlop={6}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </Pressable>
                    </View>
                    <Pressable onPress={() => remove(item.listingId)} hitSlop={6}>
                      <Text style={styles.removeText}>Remove</Text>
                    </Pressable>
                  </View>
                  {item.stockQty && (item.qty || 1) >= item.stockQty ? (
                    <Text style={styles.stockHint}>Only {item.stockQty} in stock</Text>
                  ) : null}
                </View>
              </View>
            </Card>
          </AnimatedListItem>
        )}
      />

      {count > 0 ? (
        <Animated.View entering={FadeInDown.duration(360)} style={styles.summaryBar}>
          <View>
            <Text style={styles.summaryLabel}>Subtotal · {count} item{count === 1 ? '' : 's'}</Text>
            <Text style={styles.summaryAmount}>{formatPrice(subtotal)}</Text>
          </View>
          <GradientButton
            title="Checkout"
            icon="→"
            onPress={() => navigation.navigate('Checkout', { source: 'cart' })}
            style={{ flex: 1, marginLeft: 16 }}
          />
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  h1: { ...type.display, color: colors.text },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  thumb: { width: 80, height: 80, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  price: { color: colors.accent, fontSize: 18, fontWeight: '900', marginTop: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  qtyStepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: radii.sm,
  },
  qtyBtnDisabled: { opacity: 0.35 },
  qtyBtnText: { fontSize: 20, color: colors.primary, fontWeight: '900', lineHeight: 22 },
  qtyValue: { color: colors.text, fontSize: 15, fontWeight: '800', minWidth: 28, textAlign: 'center' },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  stockHint: { color: colors.warn, fontSize: 11, fontWeight: '600', marginTop: 6 },
  summaryBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
  },
  summaryLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  summaryAmount: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 2 },
});
