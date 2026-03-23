import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { bookingsApi } from '../../services/api';
import type { Booking } from '@beauty/shared-types';

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'default' | 'error'; key: string }> = {
  confirmed: { variant: 'success', key: 'booking.confirmed' },
  pending: { variant: 'warning', key: 'booking.pending' },
  completed: { variant: 'default', key: 'booking.completed' },
  cancelled: { variant: 'error', key: 'booking.cancelled' },
  no_show: { variant: 'error', key: 'booking.cancelled' },
};

export default function BookingsScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list();
      setBookings(res.data);
    } catch (error: any) {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const upcoming = bookings.filter((b) => {
    const status = (b.status || '').toLowerCase();
    return status === 'confirmed' || status === 'pending';
  });
  const past = bookings.filter((b) => {
    const status = (b.status || '').toLowerCase();
    return status === 'completed' || status === 'cancelled' || status === 'no_show';
  });
  const data = tab === 'upcoming' ? upcoming : past;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'BRL') return `R$ ${price.toFixed(2).replace('.', ',')}`;
    if (currency === 'EUR') return `${price.toFixed(2).replace('.', ',')} \u20AC`;
    return `${price.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{t('profile.myBookings')}</Text>

      {/* Tab toggle */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.tabRow}>
        <Pressable
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
            {t('booking.upcoming')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'past' && styles.tabActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>
            {t('booking.past')}
          </Text>
        </Pressable>
      </Animated.View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>{t('booking.noBookings')}</Text>
          <Text style={styles.emptyMessage}>{t('booking.noBookingsMessage')}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const statusKey = (item.status || '').toLowerCase();
            const status = statusConfig[statusKey] || statusConfig.pending;
            const professionalName = item.professional?.businessName || '';
            const serviceName = item.service?.name || '';
            const price = item.totalPrice ?? item.service?.price ?? 0;
            const currency = item.currency || item.service?.currency || 'BRL';
            return (
              <Animated.View entering={FadeInDown.delay(200 + index * 80)}>
                <Card style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingProfessional}>{professionalName}</Text>
                    <Badge label={t(status.key)} variant={status.variant} />
                  </View>
                  <Text style={styles.bookingService}>{serviceName}</Text>
                  <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{formatDate(item.date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{item.startTime}</Text>
                    </View>
                    <Text style={styles.bookingPrice}>{formatPrice(price, currency)}</Text>
                  </View>
                </Card>
              </Animated.View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  tabRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.lg, backgroundColor: colors.white, borderRadius: radii.lg, padding: 4 },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  list: { padding: spacing.lg, paddingBottom: 100 },
  bookingCard: { marginBottom: spacing.md, padding: spacing.lg },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingProfessional: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  bookingService: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: spacing.xs },
  bookingDetails: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.lg },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  bookingPrice: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.primary, marginLeft: 'auto' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl },
  emptyTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginTop: spacing.lg },
  emptyMessage: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});
