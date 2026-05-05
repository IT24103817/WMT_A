import { useState, useCallback } from 'react';
import { Text, FlatList, View, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientButton from '../../components/GradientButton';
import EmptyState from '../../components/EmptyState';
import AnimatedListItem from '../../components/AnimatedListItem';
import { learning } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, type } from '../../theme';

export default function AdminArticlesScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setArticles(await learning.list());
    } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (a) => {
    try { await learning.remove(a._id); toast.success('Article removed'); load(); }
    catch (e) { toast.error(e.userMessage); }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>Articles</Text>
          <Text style={styles.sub}>Educate customers about gemstones</Text>
        </View>
        <GradientButton title="New" icon="+" size="sm" onPress={() => navigation.navigate('ArticleForm', {})} />
      </View>
      <FlatList
        data={articles}
        keyExtractor={(a) => a._id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshing={refreshing}
        onRefresh={load}
        ListEmptyComponent={<EmptyState icon="📚" title="No articles yet" message="Publish your first article to start the Learning Hub." />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card padded={false}>
              {item.coverImageUrl ? <Image source={{ uri: item.coverImageUrl }} style={styles.cover} /> : null}
              <View style={{ padding: 14 }}>
                <Text style={styles.cat}>{item.category}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Button title="Edit" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => navigation.navigate('ArticleForm', { article: item })} />
                  <Button title="Delete" variant="outline" size="sm" style={{ flex: 1 }} onPress={() => remove(item)} textStyle={{ color: colors.danger }} />
                </View>
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
  cover: { width: '100%', height: 140 },
  cat: { color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 4 },
});
