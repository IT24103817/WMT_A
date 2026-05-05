import { View, Pressable, Text, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

export default function StarRating({ value = 0, onChange, size = 28, readonly, color = colors.accent }) {
  const handlePress = (n) => {
    if (Platform.OS !== 'web') { try { Haptics.selectionAsync(); } catch {} }
    onChange?.(n);
  };
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const Component = readonly ? View : Pressable;
        return (
          <Component key={n} onPress={readonly ? undefined : () => handlePress(n)} hitSlop={6}>
            <Text style={{
              fontSize: size,
              color: filled ? color : colors.borderStrong,
              marginRight: 2,
            }}>
              {filled ? '★' : '☆'}
            </Text>
          </Component>
        );
      })}
    </View>
  );
}
