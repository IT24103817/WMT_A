import { createContext, useContext, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { colors, radii, shadows } from '../theme';

const ToastContext = createContext(null);

const palette = {
  success: { bg: colors.success, icon: '✓' },
  error: { bg: colors.danger, icon: '!' },
  warn: { bg: colors.warn, icon: '⚠' },
  info: { bg: colors.primary, icon: 'i' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, opts = {}) => {
    const id = ++idRef.current;
    const toast = { id, message, type: opts.type || 'info', duration: opts.duration ?? 2800 };
    setToasts((prev) => [...prev, toast]);
    if (toast.duration > 0) {
      setTimeout(() => dismiss(id), toast.duration);
    }
    return id;
  }, [dismiss]);

  const api = {
    show,
    success: (m, o) => show(m, { ...o, type: 'success' }),
    error: (m, o) => show(m, { ...o, type: 'error' }),
    warn: (m, o) => show(m, { ...o, type: 'warn' }),
    info: (m, o) => show(m, { ...o, type: 'info' }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View pointerEvents="box-none" style={styles.host}>
        {toasts.map((t) => {
          const p = palette[t.type] || palette.info;
          return (
            <Animated.View
              key={t.id}
              entering={FadeInDown.springify().damping(18)}
              exiting={FadeOutUp.duration(180)}
              style={[styles.toast, shadows.md, { borderLeftColor: p.bg }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: p.bg }]}>
                <Text style={styles.iconText}>{p.icon}</Text>
              </View>
              <Text style={styles.message}>{t.message}</Text>
              <Pressable onPress={() => dismiss(t.id)} hitSlop={10}>
                <Text style={styles.close}>×</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // fallback no-op so screens don't crash when used outside provider
    return { show: () => {}, success: () => {}, error: () => {}, warn: () => {}, info: () => {}, dismiss: () => {} };
  }
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 64,
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 10000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    gap: 12,
  },
  iconWrap: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  message: { color: colors.text, fontSize: 14, fontWeight: '500', flex: 1 },
  close: { color: colors.textDim, fontSize: 22, paddingHorizontal: 4 },
});
