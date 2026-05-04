/**
 * LearningScreen — Learning Hub (M2)
 * Customer view: list of articles, optional category filter chips
 * (Gem Types / Buying Guide / Grading & Quality / Care & Maintenance).
 * Calls learning.list({ category }).
 */
import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import AnimatedListItem from '../../components/AnimatedListItem';
import { learning } from '../../api';
import { colors, type } from '../../theme';

export default function LearningScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async (cat) => {
    try {
      setRefreshing(true);
      const [list, cats] = await Promise.all([learning.list(cat || undefined), learning.categories()]);
      setArticles(list);
      setCategories(cats);
      setLoaded(true);
    } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(active); }, [load, active]));

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.h1}>Learning Hub</Text>
        <Text style={styles.sub}>Master the language of gemstones</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" active={!active} onPress={() => setActive(null)} />
        {categories.map((c) => (
          <Chip key={c} label={c} active={active === c} onPress={() => setActive(c)} />
        ))}
      </ScrollView>

      <FlatList
        data={articles}
        keyExtractor={(a) => a._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={() => load(active)}
        ListEmptyComponent={
          !loaded ? (<View>{[0, 1].map((i) => <SkeletonCard key={i} />)}</View>) : (
            <EmptyState icon="📚" title="No articles in this category" message="Try another filter — new content is added regularly." />
          )
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card padded={false} onPress={() => navigation.navigate('ArticleDetail', { id: item._id })}>
              {item.coverImageUrl ? (
                <Image source={{ uri: item.coverImageUrl }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, { backgroundColor: colors.surfaceAlt }]} />
              )}
              <View style={{ padding: 16 }}>
                <Text style={styles.cat}>{item.category}</Text>
                <Text style={styles.title}>{item.title}</Text>
              </View>
            </Card>
          </AnimatedListItem>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  h1: { ...type.display, color: colors.text },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  chips: { paddingHorizontal: 20, paddingVertical: 12 },
  cover: { width: '100%', height: 180 },
  cat: { color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 22 },
});
