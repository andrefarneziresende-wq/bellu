import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, radii } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api, Booking } from '../../services/api';

function getWeekDays(): { label: string; date: string; fullDate: string }[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1));

  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const days: { label: string; date: string; fullDate: string }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      label: labels[i],
      date: String(d.getDate()).padStart(2, '0'),
      fullDate: d.toISOString().split('T')[0],
    });
  }

  return days;
}

export default function AgendaScreen() {
  const { t } = useTranslation();
  const weekDays = getWeekDays();
  const todayFull = new Date().toISOString().split('T')[0];
  const todayEntry = weekDays.find((d) => d.fullDate === todayFull);
  const [selectedDay, setSelectedDay] = useState(todayEntry?.date || weekDays[0].date);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedFullDate = weekDays.find((d) => d.date === selectedDay)?.fullDate || todayFull;

  const fetchBookings = async (date: string) => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Booking[] }>(
        `/bookings/professional?date=${date}`
      );
      setBookings(res.data || []);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings(selectedFullDate);
    }, [selectedFullDate])
  );

  useEffect(() => {
    fetchBookings(selectedFullDate);
  }, [selectedDay]);

  const handleConfirm = async (bookingId: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: 'confirmed' });
      Alert.alert(t('common.success'), t('booking.confirmed'));
      fetchBookings(selectedFullDate);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to confirm booking');
    }
  };

  const handleCancel = async (bookingId: string) => {
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
              await api.patch(`/bookings/${bookingId}/status`, { status: 'cancelled' });
              Alert.alert(t('common.success'), t('booking.cancelled'));
              fetchBookings(selectedFullDate);
            } catch (error: any) {
              Alert.alert(t('common.error'), error?.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{t('pro.agenda.title')}</Text>

      {/* Week selector */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.weekRow}>
        {weekDays.map((day) => (
          <Pressable
            key={day.fullDate}
            style={[styles.dayItem, selectedDay === day.date && styles.dayItemActive]}
            onPress={() => setSelectedDay(day.date)}
          >
            <Text style={[styles.dayLabel, selectedDay === day.date && styles.dayLabelActive]}>{day.label}</Text>
            <Text style={[styles.dayNum, selectedDay === day.date && styles.dayNumActive]}>{day.date}</Text>
          </Pressable>
        ))}
      </Animated.View>

      {/* Time slots */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.slotList}>
          {bookings.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: spacing.xxxl }}>
              <Ionicons name="calendar-outline" size={48} color={colors.border} />
              <Text style={{ color: colors.textSecondary, marginTop: spacing.md, fontSize: 15 }}>
                {t('pro.agenda.noBookings')}
              </Text>
            </View>
          ) : (
            bookings.map((booking, index) => (
              <Animated.View key={booking.id} entering={FadeInDown.delay(200 + index * 60)}>
                <View style={styles.slotRow}>
                  <Text style={styles.slotTime}>{booking.startTime || booking.time || ''}</Text>
                  <Card style={styles.bookedSlot}>
                    <View style={styles.bookedInfo}>
                      <Text style={styles.bookedClient}>{booking.client?.name || booking.clientName || ''}</Text>
                      <Text style={styles.bookedService}>{booking.serviceDetails?.name || booking.service || ''}</Text>
                      {booking.status === 'pending' && (
                        <View style={styles.actionRow}>
                          <Pressable style={styles.confirmBtn} onPress={() => handleConfirm(booking.id)}>
                            <Ionicons name="checkmark" size={14} color={colors.white} />
                            <Text style={styles.confirmBtnText}>{t('booking.confirm')}</Text>
                          </Pressable>
                          <Pressable style={styles.cancelActionBtn} onPress={() => handleCancel(booking.id)}>
                            <Ionicons name="close" size={14} color={colors.error} />
                            <Text style={styles.cancelActionText}>{t('booking.cancelBooking')}</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                    <Badge
                      text={
                        booking.status === 'confirmed' ? t('booking.confirmed') :
                        booking.status === 'completed' ? t('booking.completed') :
                        booking.status === 'cancelled' ? t('booking.cancelled') :
                        t('booking.pending')
                      }
                      variant={
                        booking.status === 'confirmed' || booking.status === 'completed' ? 'success' :
                        booking.status === 'cancelled' ? 'error' :
                        'warning'
                      }
                    />
                  </Card>
                </View>
              </Animated.View>
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  weekRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.xs },
  dayItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.lg, backgroundColor: colors.card },
  dayItemActive: { backgroundColor: colors.primary },
  dayLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  dayLabelActive: { color: colors.white },
  dayNum: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 },
  dayNumActive: { color: colors.white },
  slotList: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  slotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  slotTime: { width: 50, fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  bookedSlot: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  bookedInfo: { flex: 1 },
  bookedClient: { fontSize: 14, fontWeight: '600', color: colors.text },
  bookedService: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm },
  confirmBtnText: { fontSize: 11, fontWeight: '600', color: colors.white },
  cancelActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.error, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm },
  cancelActionText: { fontSize: 11, fontWeight: '600', color: colors.error },
});
