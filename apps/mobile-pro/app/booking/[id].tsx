import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api, Booking } from '../../services/api';

export default function BookingDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Booking }>(`/bookings/${id}`);
      setBooking(res.data);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      await api.patch(`/bookings/${id}/status`, { status: 'confirmed' });
      Alert.alert(t('common.success'), t('booking.confirmed'));
      fetchBooking();
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to confirm booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      t('booking.cancelBooking'),
      t('booking.cancelConfirmation'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await api.patch(`/bookings/${id}/status`, { status: 'cancelled' });
              Alert.alert(t('common.success'), t('booking.cancelled'));
              fetchBooking();
            } catch (error: any) {
              Alert.alert(t('common.error'), error?.message || 'Failed to cancel booking');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      await api.patch(`/bookings/${id}/status`, { status: 'completed' });
      Alert.alert(t('common.success'), t('booking.completed'));
      router.back();
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to complete booking');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('booking.status')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('booking.status')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>{t('common.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const clientName = booking.client?.name || booking.clientName || '';
  const clientPhone = booking.client?.phone || '';
  const serviceName = booking.serviceDetails?.name || booking.service || '';
  const servicePrice = booking.serviceDetails?.price || booking.price || 0;
  const serviceDuration = booking.serviceDetails?.duration || booking.duration || 0;
  const bookingDate = booking.date ? new Date(booking.date).toLocaleDateString('pt-BR') : '';
  const startTime = booking.startTime || booking.time || '';
  const endTime = booking.endTime || '';
  const timeDisplay = endTime ? `${startTime} - ${endTime}` : startTime;

  const statusVariant = booking.status === 'confirmed' || booking.status === 'completed'
    ? 'success'
    : booking.status === 'cancelled'
    ? 'error'
    : 'warning';

  const statusText = booking.status === 'confirmed'
    ? t('booking.confirmed')
    : booking.status === 'completed'
    ? t('booking.completed')
    : booking.status === 'cancelled'
    ? t('booking.cancelled')
    : t('booking.pending');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('booking.status')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Status */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statusSection}>
          <Badge text={statusText} variant={statusVariant} />
        </Animated.View>

        {/* Client */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.card}>
            <View style={styles.clientRow}>
              <View style={styles.clientAvatar}>
                <Ionicons name="person" size={24} color={colors.white} />
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{clientName}</Text>
                {clientPhone ? <Text style={styles.clientPhone}>{clientPhone}</Text> : null}
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Service Details */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{t('professional.services')}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{serviceName}</Text>
              <Text style={styles.detailValue}>R$ {servicePrice.toFixed(2).replace('.', ',')}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('booking.duration')}</Text>
              <Text style={styles.detailValue}>{t('booking.minutes', { count: serviceDuration })}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('booking.date')}</Text>
              <Text style={styles.detailValue}>{bookingDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('booking.time')}</Text>
              <Text style={styles.detailValue}>{timeDisplay}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.detailRow}>
              <Text style={styles.totalLabel}>{t('booking.total')}</Text>
              <Text style={styles.totalValue}>R$ {servicePrice.toFixed(2).replace('.', ',')}</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.actions}>
          {actionLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              {booking.status === 'pending' && (
                <Button label={t('booking.confirm')} onPress={handleConfirm} />
              )}
              {(booking.status === 'confirmed') && (
                <Button label={t('booking.completed')} onPress={handleComplete} />
              )}
              {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelText}>{t('booking.cancelBooking')}</Text>
                </Pressable>
              )}
            </>
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  scroll: { paddingHorizontal: spacing.lg },
  statusSection: { alignItems: 'center', paddingVertical: spacing.lg },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  clientRow: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  clientInfo: { marginLeft: spacing.md },
  clientName: { fontSize: 16, fontWeight: '600', color: colors.text },
  clientPhone: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  detailLabel: { fontSize: 14, color: colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '500', color: colors.text },
  separator: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.sm },
  totalLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  actions: { marginTop: spacing.lg, gap: spacing.md },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.lg },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.error },
});
