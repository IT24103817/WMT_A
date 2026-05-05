import { View, StyleSheet, ScrollView, RefreshControl, StatusBar as RNStatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

export default function Screen({
  children,
  scroll = false,
  padded = true,
  refreshing,
  onRefresh,
  contentStyle,
  background = colors.bg,
}) {
  const content = <View style={[padded && styles.padded, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          style={{ backgroundColor: background }}
          contentContainerStyle={{ flexGrow: 1, backgroundColor: background }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl tintColor={colors.primary} refreshing={!!refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0 },
  padded: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, flex: 1 },
});
