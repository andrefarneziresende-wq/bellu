import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Image } from 'expo-image';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import {
  professionalsApi,
  servicesApi,
  bookingsApi,
  membersApi,
} from '../../services/api';
import type { Professional, Service } from '@beauty/shared-types';

interface StaffMember {
  id: string;
  name: string;
  avatar: string | null;
  specialties: string | null;
  role: string;
}

export default function BookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const dates = useMemo(() => {
    const result: { date: string; day: string; num: string; full: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      result.push({
        date: d.toISOString().split('T')[0],
        day: d.toLocaleDateString(undefined, { weekday: 'short' }),
        num: String(d.getDate()),
        full: d.toISOString().split('T')[0],
      });
    }
    return result;
  }, []);

  const [selectedDate, setSelectedDate] = useState(dates[0]?.full || '');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Fetch professional, services, and members
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profRes, servRes, membRes] = await Promise.all([
          professionalsApi.getById(id),
          servicesApi.getByProfessional(id),
          membersApi.listByProfessional(id),
        ]);
        setProfessional(profRes.data);
        setServices(servRes.data);
        if (servRes.data.length > 0) {
          setSelectedService(servRes.data[0]);
        }
        setMembers(membRes.data || []);
      } catch (error: any) {
        toast(error.message || t('common.error'), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch available time slots
  useEffect(() => {
    if (!id || !selectedDate) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedTime(null);
      try {
        const res = await bookingsApi.availableSlots(id, selectedDate);
        setTimeSlots(res.data);
      } catch {
        setTimeSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [id, selectedDate]);

  const handleConfirm = async () => {
    if (!id || !selectedService || !selectedTime) return;

    setSubmitting(true);
    try {
      await bookingsApi.create({
        professionalId: id,
        serviceId: selectedService.id,
        date: selectedDate,
        startTime: selectedTime,
        ...(selectedMember ? { memberId: selectedMember.id } : {}),
      });
      toast(t('booking.bookingSuccess'), 'success');
      router.back();
    } catch (error: any) {
      toast(error.message || t('common.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'BRL') return `R$ ${price.toFixed(2).replace('.', ',')}`;
    if (currency === 'EUR') return `${price.toFixed(2).replace('.', ',')} \u20AC`;
    return `${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const canConfirm = !!selectedTime && !!selectedService;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('booking.scheduleButton')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Service Selection */}
        {services.length > 1 && (
          <Animated.View entering={FadeInDown.delay(50)}>
            <Text style={styles.sectionTitle}>{t('professional.services')}</Text>
            {services.map((service) => (
              <Pressable key={service.id} onPress={() => setSelectedService(service)}>
                <Card style={[styles.serviceSelectCard, selectedService?.id === service.id && styles.serviceSelectActive]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryTitle}>{service.name}</Text>
                    <Text style={styles.summaryText}>{service.durationMinutes} min</Text>
                  </View>
                  <Text style={styles.summaryPrice}>{formatPrice(service.price, service.currency)}</Text>
                </Card>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Service Summary */}
        {selectedService && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{selectedService.name}</Text>
              <Text style={styles.summaryPro}>{professional?.businessName || ''}</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryDetail}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.summaryText}>{t('booking.duration')}: {t('booking.minutes', { count: selectedService.durationMinutes })}</Text>
                </View>
                <Text style={styles.summaryPrice}>{formatPrice(selectedService.price, selectedService.currency)}</Text>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Staff Member Selection */}
        {members.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150)}>
            <Text style={styles.sectionTitle}>{t('booking.selectStaff')}</Text>
            <Text style={styles.staffHint}>{t('booking.staffHint')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffScroll}>
              <Pressable
                style={[styles.staffCard, !selectedMember && styles.staffCardActive]}
                onPress={() => setSelectedMember(null)}
              >
                <View style={[styles.staffAvatar, !selectedMember && styles.staffAvatarActive]}>
                  <Ionicons name="shuffle" size={22} color={!selectedMember ? colors.white : colors.primary} />
                </View>
                <Text style={[styles.staffName, !selectedMember && styles.staffNameActive]} numberOfLines={1}>
                  {t('booking.anyStaff')}
                </Text>
              </Pressable>
              {members.map((member) => (
                <Pressable
                  key={member.id}
                  style={[styles.staffCard, selectedMember?.id === member.id && styles.staffCardActive]}
                  onPress={() => setSelectedMember(member)}
                >
                  {member.avatar ? (
                    <Image source={{ uri: member.avatar }} style={[styles.staffAvatar, selectedMember?.id === member.id && styles.staffAvatarActive]} />
                  ) : (
                    <View style={[styles.staffAvatar, selectedMember?.id === member.id && styles.staffAvatarActive]}>
                      <Ionicons name="person" size={22} color={selectedMember?.id === member.id ? colors.white : colors.textSecondary} />
                    </View>
                  )}
                  <Text style={[styles.staffName, selectedMember?.id === member.id && styles.staffNameActive]} numberOfLines={1}>
                    {member.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Date Selection */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle}>{t('booking.selectDate')}</Text>
          <View style={styles.dateRow}>
            {dates.slice(0, 7).map((date) => (
              <Pressable
                key={date.full}
                style={[styles.dateItem, selectedDate === date.full && styles.dateItemActive]}
                onPress={() => setSelectedDate(date.full)}
              >
                <Text style={[styles.dateDay, selectedDate === date.full && styles.dateDayActive]}>{date.day}</Text>
                <Text style={[styles.dateNum, selectedDate === date.full && styles.dateNumActive]}>{date.num}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Time Selection */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>{t('booking.selectTime')}</Text>
          {slotsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: spacing.lg }} />
          ) : timeSlots.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg }}>{t('booking.noSlots')}</Text>
          ) : (
            <View style={styles.timeGrid}>
              {timeSlots.map((time) => (
                <Pressable
                  key={time}
                  style={[styles.timeSlot, selectedTime === time && styles.timeSlotActive]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>
                    {time}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Total */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Card style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('booking.total')}</Text>
              <Text style={styles.totalPrice}>
                {selectedService
                  ? formatPrice(selectedService.price, selectedService.currency)
                  : ''}
              </Text>
            </View>
            {selectedTime && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('booking.date')}</Text>
                <Text style={styles.totalValue}>{selectedDate} {'\u00B7'} {selectedTime}</Text>
              </View>
            )}
          </Card>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.floatingBtn}>
        {submitting ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Button
            label={t('booking.confirmBooking')}
            onPress={handleConfirm}
            disabled={!canConfirm}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text },
  scroll: { paddingHorizontal: spacing.lg },
  summaryCard: { padding: spacing.lg },
  summaryTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text },
  summaryPro: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  summaryDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryText: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  summaryPrice: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  serviceSelectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  serviceSelectActive: { borderColor: colors.primary, borderWidth: 2 },

  // Staff
  staffHint: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: spacing.md },
  staffScroll: { marginBottom: spacing.sm },
  staffCard: { alignItems: 'center', marginRight: spacing.md, width: 72 },
  staffCardActive: {},
  staffAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border, overflow: 'hidden' },
  staffAvatarActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  staffName: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.medium, marginTop: 6, textAlign: 'center' },
  staffNameActive: { color: colors.primary, fontWeight: typography.weights.semibold },

  // Dates
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.lg, backgroundColor: colors.white },
  dateItemActive: { backgroundColor: colors.primary },
  dateDay: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.medium },
  dateDayActive: { color: colors.white },
  dateNum: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text, marginTop: 4 },
  dateNumActive: { color: colors.white },

  // Time
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeSlot: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  timeSlotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text },
  timeTextActive: { color: colors.white },

  // Total
  totalCard: { padding: spacing.lg, marginTop: spacing.xl },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  totalLabel: { fontSize: typography.sizes.md, color: colors.textSecondary },
  totalPrice: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.primary },
  totalValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.text },
  floatingBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 34, borderTopWidth: 1, borderTopColor: colors.border },
});
