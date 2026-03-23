import { useState, useEffect, useRef, useCallback } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  type: ToastType;
  text: string;
  duration?: number;
}

let showToastFn: ((msg: ToastMessage) => void) | null = null;

export function toast(text: string, type: ToastType = 'error', duration = 3000) {
  showToastFn?.({ type, text, duration });
}

const iconMap: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
};

const bgMap: Record<ToastType, string> = {
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  info: colors.primary,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const hide = useCallback(() => {
    translateY.value = withTiming(-120, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
  }, [translateY, opacity]);

  const show = useCallback((msg: ToastMessage) => {
    setMessage(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    translateY.value = withTiming(0, { duration: 350 });
    opacity.value = withTiming(1, { duration: 350 });
    timeoutRef.current = setTimeout(() => {
      hide();
    }, msg.duration ?? 3000);
  }, [translateY, opacity, hide]);

  useEffect(() => {
    showToastFn = show;
    return () => { showToastFn = null; };
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const type = message?.type ?? 'error';

  return (
    <>
      {children}
      <Animated.View
        style={[
          styles.container,
          { top: insets.top + 8, backgroundColor: bgMap[type] },
          animatedStyle,
        ]}
        pointerEvents="box-none"
      >
        <Pressable style={styles.inner} onPress={hide}>
          <Ionicons name={iconMap[type]} size={20} color={colors.white} />
          <Text style={styles.text} numberOfLines={2}>
            {message?.text ?? ''}
          </Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radii.lg,
    zIndex: 9999,
    elevation: 10,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  text: {
    flex: 1,
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
