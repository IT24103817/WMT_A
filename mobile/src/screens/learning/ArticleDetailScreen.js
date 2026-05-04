/**
 * ArticleDetailScreen — Learning Hub (M2)
 * Full article render with cover image. "View related gems" CTA navigates
 * to Marketplace prefilled with a search term derived from the article.
 */
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeInDown,
} from 'react-native-reanimated';
import Button from '../../components/Button';
import { learning } from '../../api';
import { useToast } from '../../components/Toast';
import { colors, type } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 260;

export default function ArticleDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [article, setArticle] = useState(null);
  const toast = useToast();
  const scrollY = useSharedValue(0);

  useEffect(() => {
    learning.get(id).then(setArticle).catch((e) => toast.error(e.userMessage));
  }, [id]);

  const onScroll = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-200, 0, HERO_H], [-60, 0, HERO_H * 0.4], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-200, 0], [1.3, 1], Extrapolation.CLAMP) },
    ],
  }));

  if (!article) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}><Text style={{ color: colors.textDim, padding: 20 }}>Loading…</Text></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {article.coverImageUrl ? (
          <Animated.View style={[styles.heroWrap, heroStyle]}>
            <Image source={{ uri: article.coverImageUrl }} style={styles.hero} />
          </Animated.View>
        ) : null}

        <View style={styles.body}>
          <Animated.Text entering={FadeInDown.duration(400)} style={styles.cat}>
            {article.category}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={styles.title}>
            {article.title}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(160).duration(400)} style={styles.bodyText}>
            {article.body}
          </Animated.Text>

          {article.category === 'Gem Types' ? (
            <Button
              title="View related gems"
              icon="💎"
              onPress={() => navigation.navigate('Home', { screen: 'Market', params: { presetSearch: article.title } })}
              style={{ marginTop: 28 }}
            />
          ) : null}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: { width: SCREEN_W, height: HERO_H, backgroundColor: colors.surfaceMuted },
  hero: { width: SCREEN_W, height: HERO_H },
  body: { padding: 20, marginTop: -20, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 28 },
  cat: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { ...type.h1, color: colors.text, fontSize: 28, marginTop: 8, lineHeight: 32 },
  bodyText: { color: colors.text, fontSize: 16, lineHeight: 26, marginTop: 16 },
});
