import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal } from 'react-native';
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

// --- Inline Calendar Component ---
function InlineCalendar({
  selectedDate,
  onSelect,
  minDate,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
  minDate: Date;
}) {
  const { t } = useTranslation();
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const weekDays = useMemo(() => {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(2024, 0, i); // Jan 2024 starts on Monday
      days.push(d.toLocaleDateString(undefined, { weekday: 'narrow' }));
    }
    return days;
  }, []);

  const calendarDays = useMemo(() => {
    const { year, month } = viewMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const days: (string | null)[] = [];
    // Fill empty slots before first day
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  }, [viewMonth]);

  const monthLabel = new Date(viewMonth.year, viewMonth.month).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const canGoPrev = () => {
    const prev = new Date(viewMonth.year, viewMonth.month - 1);
    const minMonth = new Date(minDate.getFullYear(), minDate.getMonth());
    return prev >= minMonth;
  };

  const isDisabled = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  };

  return (
    <View style={calStyles.container}>
      {/* Month nav */}
      <View style={calStyles.monthRow}>
        <Pressable
          onPress={() => canGoPrev() && setViewMonth((v) => {
            const d = new Date(v.year, v.month - 1);
            return { year: d.getFullYear(), month: d.getMonth() };
          })}
          style={calStyles.navBtn}
        >
          <Ionicons name="chevron-back" size={20} color={canGoPrev() ? colors.text : colors.border} />
        </Pressable>
        <Text style={calStyles.monthLabel}>{monthLabel}</Text>
        <Pressable
          onPress={() => setViewMonth((v) => {
            const d = new Date(v.year, v.month + 1);
            return { year: d.getFullYear(), month: d.getMonth() };
          })}
          style={calStyles.navBtn}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={calStyles.weekRow}>
        {weekDays.map((d, i) => (
          <Text key={i} style={calStyles.weekDay}>{d}</Text>
        ))}
      </View>

      {/* Days grid */}
      <View style={calStyles.daysGrid}>
        {calendarDays.map((dateStr, i) => {
          if (!dateStr) return <View key={`empty-${i}`} style={calStyles.dayCell} />;
          const dayNum = new Date(dateStr + 'T00:00:00').getDate();
          const selected = dateStr === selectedDate;
          const disabled = isDisabled(dateStr);
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          return (
            <Pressable
              key={dateStr}
              style={[calStyles.dayCell, selected && calStyles.dayCellSelected]}
              onPress={() => !disabled && onSelect(dateStr)}
              disabled={disabled}
            >
              <Text
                style={[
                  calStyles.dayText,
                  disabled && calStyles.dayTextDisabled,
                  selected && calStyles.dayTextSelected,
                  isToday && !selected && calStyles.dayTextToday,
                ]}
              >
                {dayNum}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: { backgroundColor: colors.white, borderRadius: radii.xl, padding: spacing.md, elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  navBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text, textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekDay: { flex: 1, textAlign: 'center', fontSize: typography.sizes.xs, fontWeight: typography.weights.medium, color: colors.textSecondary },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 999 },
  dayCellSelected: { backgroundColor: colors.primary },
  dayText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text },
  dayTextDisabled: { color: colors.border },
  dayTextSelected: { color: colors.white, fontWeight: typography.weights.bold },
  dayTextToday: { color: colors.primary, fontWeight: typography.weights.bold },
});

// --- Booking Screen ---
export default function BookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<StaffMember | undefined>(undefined); // undefined = auto
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(() => today.toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Quick date shortcuts (next 7 days)
  const quickDates = useMemo(() => {
    const result: { date: string; day: string; num: string; month: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      result.push({
        date: d.toISOString().split('T')[0],
        day: d.toLocaleDateString(undefined, { weekday: 'short' }),
        num: String(d.getDate()),
        month: d.toLocaleDateString(undefined, { month: 'short' }),
      });
    }
    return result;
  }, [today]);

  // Fetch professional, services, and members
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const profRes = await professionalsApi.getById(id);
        setProfessional(profRes.data);

        const [servRes, membRes] = await Promise.allSettled([
          servicesApi.getByProfessional(id),
          membersApi.listByProfessional(id),
        ]);
        const servData = servRes.status === 'fulfilled' ? servRes.value.data : [];
        setServices(servData);
        if (servData.length > 0) setSelectedService(servData[0]);
        setMembers(membRes.status === 'fulfilled' ? (membRes.value.data || []) : []);
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

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const canConfirm = !!selectedTime && !!selectedService;
  const [showCalendar, setShowCalendar] = useState(false);

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

        {/* Step 1: Service Selection */}
        <Animated.View entering={FadeInDown.delay(50)}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
            <Text style={styles.sectionTitle}>{t('booking.selectService')}</Text>
          </View>
          {services.length === 0 ? (
            <Text style={styles.emptyText}>{t('search.noResults')}</Text>
          ) : (
            services.map((service) => (
              <Pressable key={service.id} onPress={() => setSelectedService(service)}>
                <Card style={[styles.serviceCard, selectedService?.id === service.id && styles.serviceCardActive]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.serviceName, selectedService?.id === service.id && styles.serviceNameActive]}>
                      {service.name}
                    </Text>
                    <View style={styles.serviceMetaRow}>
                      <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.serviceMeta}>{service.durationMinutes} min</Text>
                    </View>
                  </View>
                  <Text style={[styles.servicePrice, selectedService?.id === service.id && styles.servicePriceActive]}>
                    {formatPrice(service.price, service.currency)}
                  </Text>
                  {selectedService?.id === service.id && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} style={{ marginLeft: spacing.sm }} />
                  )}
                </Card>
              </Pressable>
            ))
          )}
        </Animated.View>

        <View style={styles.divider} />

        {/* Step 2: Date Selection */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
            <Text style={styles.sectionTitle}>{t('booking.selectDate')}</Text>
          </View>

          {/* Quick date row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickDateRow}>
            {quickDates.map((item) => (
              <Pressable
                key={item.date}
                style={[styles.quickDateItem, selectedDate === item.date && styles.quickDateItemActive]}
                onPress={() => { setSelectedDate(item.date); setShowCalendar(false); }}
              >
                <Text style={[styles.quickDateDay, selectedDate === item.date && styles.quickDateTextActive]}>{item.day}</Text>
                <Text style={[styles.quickDateNum, selectedDate === item.date && styles.quickDateTextActive]}>{item.num}</Text>
                <Text style={[styles.quickDateMonth, selectedDate === item.date && styles.quickDateTextActive]}>{item.month}</Text>
              </Pressable>
            ))}
            {/* Calendar button */}
            <Pressable
              style={[styles.quickDateItem, styles.calendarBtn]}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Ionicons name="calendar" size={22} color={colors.primary} />
              <Text style={styles.calendarBtnText}>{t('booking.moreDate')}</Text>
            </Pressable>
          </ScrollView>

          {/* Full calendar */}
          {showCalendar && (
            <View style={{ marginTop: spacing.md }}>
              <InlineCalendar
                selectedDate={selectedDate}
                onSelect={(date) => { setSelectedDate(date); setShowCalendar(false); }}
                minDate={today}
              />
            </View>
          )}

          {/* Selected date display */}
          <View style={styles.selectedDateRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.selectedDateText}>{formatDateDisplay(selectedDate)}</Text>
          </View>
        </Animated.View>

        <View style={styles.divider} />

        {/* Step 3: Time Selection */}
        <Animated.View entering={FadeInDown.delay(250)}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
            <Text style={styles.sectionTitle}>{t('booking.selectTime')}</Text>
          </View>
          {slotsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: spacing.lg }} />
          ) : timeSlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <Ionicons name="time-outline" size={32} color={colors.border} />
              <Text style={styles.emptyText}>{t('booking.noSlots')}</Text>
            </View>
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

        {/* Step 4: Staff (only if members exist, shown after time selected) */}
        {members.length > 0 && selectedTime && (
          <>
            <View style={styles.divider} />
            <Animated.View entering={FadeInDown.delay(100)}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>4</Text></View>
                <Text style={styles.sectionTitle}>{t('booking.selectStaff')}</Text>
              </View>
              <Text style={styles.staffHint}>{t('booking.staffHint')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {/* "Any" option */}
                <Pressable
                  style={[styles.staffCard, !selectedMember && styles.staffCardActive]}
                  onPress={() => setSelectedMember(undefined)}
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
          </>
        )}

        {/* Summary */}
        {canConfirm && (
          <>
            <View style={styles.divider} />
            <Animated.View entering={FadeInDown.delay(100)}>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('booking.summary')}</Text>

                <View style={styles.summaryItem}>
                  <Ionicons name="cut-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.summaryItemText}>{selectedService?.name}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.summaryItemText}>{formatDateDisplay(selectedDate)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.summaryItemText}>{selectedTime}</Text>
                </View>
                {selectedMember && (
                  <View style={styles.summaryItem}>
                    <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.summaryItemText}>{selectedMember.name}</Text>
                  </View>
                )}

                <View style={styles.summaryDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('booking.total')}</Text>
                  <Text style={styles.totalPrice}>
                    {selectedService ? formatPrice(selectedService.price, selectedService.currency) : ''}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          </>
        )}

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

  // Steps
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  stepBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  stepBadgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.white },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text },
  divider: { height: 1, backgroundColor: colors.borderLight || '#F0F0F0', marginVertical: spacing.lg },
  emptyText: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },

  // Services
  serviceCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, backgroundColor: colors.white },
  serviceCardActive: { borderColor: colors.primary, backgroundColor: '#FDF5F3' },
  serviceName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  serviceNameActive: { color: colors.primary },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  serviceMeta: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  servicePrice: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  servicePriceActive: { color: colors.primary },

  // Quick dates
  quickDateRow: { gap: spacing.sm, paddingBottom: spacing.xs },
  quickDateItem: { alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: radii.xl, backgroundColor: colors.white, minWidth: 60, borderWidth: 1, borderColor: colors.border },
  quickDateItemActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickDateDay: { fontSize: 10, fontWeight: typography.weights.medium, color: colors.textSecondary, textTransform: 'capitalize' },
  quickDateNum: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text, marginVertical: 2 },
  quickDateMonth: { fontSize: 10, fontWeight: typography.weights.medium, color: colors.textSecondary, textTransform: 'capitalize' },
  quickDateTextActive: { color: colors.white },
  calendarBtn: { borderColor: colors.primary, borderStyle: 'dashed' },
  calendarBtnText: { fontSize: 10, fontWeight: typography.weights.medium, color: colors.primary, marginTop: 4 },
  selectedDateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, paddingVertical: spacing.sm },
  selectedDateText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, textTransform: 'capitalize' },

  // No slots
  noSlotsContainer: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },

  // Time
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeSlot: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  timeSlotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text },
  timeTextActive: { color: colors.white },

  // Staff
  staffHint: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: spacing.md },
  staffCard: { alignItems: 'center', marginRight: spacing.md, width: 72 },
  staffCardActive: {},
  staffAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border, overflow: 'hidden' },
  staffAvatarActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  staffName: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.medium, marginTop: 6, textAlign: 'center' },
  staffNameActive: { color: colors.primary, fontWeight: typography.weights.semibold },

  // Summary
  summaryCard: { padding: spacing.lg },
  summaryLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.md },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  summaryItemText: { fontSize: typography.sizes.sm, color: colors.text },
  summaryDivider: { height: 1, backgroundColor: colors.borderLight || '#F0F0F0', marginVertical: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  totalPrice: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.primary },

  floatingBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 34, borderTopWidth: 1, borderTopColor: colors.border },
});
