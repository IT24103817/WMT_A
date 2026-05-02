import { useState, useCallback } from 'react';
import { Text, FlatList, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import { inventory } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, type } from '../../theme';

export default function AdminInventoryScreen({ navigation }) {
  const [gems, setGems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setGems(await inventory.list());
    } catch (e) {
      toast.error(e.userMessage || 'Failed to load');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (gem) => {
    try {
      await inventory.remove(gem._id);
      toast.success(`${gem.name} deleted`);
      load();
    } catch (e) { toast.error(e.userMessage); }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>Inventory</Text>
          <Text style={styles.sub}>{gems.length} gem{gems.length === 1 ? '' : 's'} in stock</Text>
        </View>
        <GradientButton title="Add" icon="+" size="sm" onPress={() => navigation.navigate('InventoryForm', {})} />
      </View>
      <FlatList
        data={gems}
        keyExtractor={(g) => g._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={<EmptyState icon="💎" title="No gems yet" message="Add your first gem to start building your inventory." />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.type} · {item.colour} · {item.carats}ct
                  </Text>
                </View>
                <Badge
                  label={`${item.stockQty} in stock`}
                  variant={item.stockQty > 0 ? 'success' : 'danger'}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button
                  title="Edit"
                  variant="secondary"
                  size="sm"
                  onPress={() => navigation.navigate('InventoryForm', { gem: item })}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Delete"
                  variant="outline"
                  size="sm"
                  onPress={() => remove(item)}
                  style={{ flex: 1 }}
                  textStyle={{ color: colors.danger }}
                />
              </View>
            </Card>
          </AnimatedListItem>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  h1: { ...type.display, color: colors.text },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: 13, marginTop: 4 },
});
