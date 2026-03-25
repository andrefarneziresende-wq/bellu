import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { bookingsApi } from '../../services/api';

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'default' | 'error'; key: string }> = {
  confirmed: { variant: 'success', key: 'booking.confirmed' },
  pending: { variant: 'warning', key: 'booking.pending' },
  completed: { variant: 'default', key: 'booking.completed' },
  cancelled: { variant: 'error', key: 'booking.cancelled' },
  no_show: { variant: 'error', key: 'booking.cancelled' },
};

export default function BookingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list();
      // API returns { bookings: [], pagination: {} }
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.bookings ?? [];
      setBookings(list);
    } catch (error: any) {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh bookings when tab gains focus
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings]),
  );

  const upcoming = bookings.filter((b) => {
    const status = (b.status || '').toLowerCase();
    if (status !== 'confirmed' && status !== 'pending') return false;
    // Only show as upcoming if the booking date is today or in the future
    try {
      const bookingDate = new Date(b.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    } catch {
      return true;
    }
  });
  const past = bookings.filter((b) => {
    const status = (b.status || '').toLowerCase();
    // Completed, cancelled, no_show always go to past
    if (status === 'completed' || status === 'cancelled' || status === 'no_show') return true;
    // Pending/confirmed with past date also go to past
    try {
      const bookingDate = new Date(b.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate < today;
    } catch {
      return false;
    }
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
            const memberName = item.member?.name || null;
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
                  {memberName && (
                    <View style={styles.memberRow}>
                      <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.memberText}>{memberName}</Text>
                    </View>
                  )}
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
                  {(statusKey === 'confirmed' || statusKey === 'pending') && (
                    <View style={styles.actionRow}>
                      <Pressable
                        style={styles.rescheduleBtn}
                        onPress={() => router.push(`/booking/${item.professionalId}`)}
                      >
                        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                        <Text style={styles.rescheduleText}>{t('booking.reschedule')}</Text>
                      </Pressable>
                      <Pressable
                        style={styles.cancelBtn}
                        onPress={() => {
                          Alert.alert(
                            t('booking.cancelConfirmTitle'),
                            t('booking.cancelConfirmMessage'),
                            [
                              { text: t('common.no'), style: 'cancel' },
                              {
                                text: t('common.yes'),
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    await bookingsApi.cancel(item.id);
                                    fetchBookings();
                                  } catch (err: any) {
                                    Alert.alert('Erro', err.message || 'Nao foi possivel cancelar');
                                  }
                                },
                              },
                            ],
                          );
                        }}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={colors.error || '#E74C3C'} />
                        <Text style={styles.cancelText}>{t('booking.cancelBooking')}</Text>
                      </Pressable>
                    </View>
                  )}
                  {statusKey === 'completed' && !item.review && (
                    <Pressable
                      style={styles.reviewBtn}
                      onPress={() => router.push(`/review/${item.id}`)}
                    >
                      <Ionicons name="star-outline" size={16} color={colors.primary} />
                      <Text style={styles.reviewText}>{t('review.leaveReview')}</Text>
                    </Pressable>
                  )}
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
  bookingService: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: spacing.xs } as const,
  memberRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginTop: 4 },
  memberText: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontStyle: 'italic' as const },
  bookingDetails: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.lg },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  bookingPrice: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.primary, marginLeft: 'auto' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl },
  actionRow: { flexDirection: 'row' as const, gap: spacing.sm, marginTop: spacing.md },
  rescheduleBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.md, backgroundColor: '#E0F2FE' },
  rescheduleText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.primary },
  cancelBtn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.md, backgroundColor: '#FEE2E2' },
  cancelText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.error || '#E74C3C' },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md, alignSelf: 'flex-start', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.md, backgroundColor: '#FEF3C7' },
  reviewText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.accent },
  emptyTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginTop: spacing.lg },
  emptyMessage: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});
