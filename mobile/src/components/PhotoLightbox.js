import { Modal, View, Image, ScrollView, Pressable, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

export default function PhotoLightbox({ photos = [], initialIndex = 0, visible, onClose }) {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  useEffect(() => {
    if (visible && scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: initialIndex * width, animated: false });
      });
    }
  }, [visible, initialIndex]);

  if (!photos.length) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(160)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ flex: 1 }}
        >
          {photos.map((p, i) => (
            <View key={i} style={styles.page}>
              <Image source={{ uri: p }} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        <Pressable onPress={onClose} hitSlop={20} style={styles.close}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>

        {photos.length > 1 ? (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{index + 1} / {photos.length}</Text>
          </View>
        ) : null}

        <View style={styles.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  page: { width, height, justifyContent: 'center', alignItems: 'center' },
  image: { width, height: height * 0.85 },
  close: {
    position: 'absolute', top: 50, right: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', lineHeight: 30 },
  counter: { position: 'absolute', top: 60, alignSelf: 'center' },
  counterText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  dots: {
    position: 'absolute', bottom: 60, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 18 },
});
