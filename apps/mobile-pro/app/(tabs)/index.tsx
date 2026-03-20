import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, radii, shadows } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api, Booking } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Card>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { professional } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekRevenue: 0,
    totalClients: 0,
    occupancyRate: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's bookings
      const bookingsRes = await api.get<{ data: Booking[] }>(
        `/bookings/professional?date=${today}`
      );
      const todayBookings = bookingsRes.data || [];
      setBookings(todayBookings);

      // Calculate stats from bookings
      const confirmedBookings = todayBookings.filter(
        (b) => b.status === 'confirmed' || b.status === 'completed'
      );
      const weekRevenue = confirmedBookings.reduce((sum, b) => sum + (b.price || 0), 0);

      setStats({
        todayBookings: todayBookings.length,
        weekRevenue,
        totalClients: todayBookings.length,
        occupancyRate: todayBookings.length > 0 ? Math.round((confirmedBookings.length / todayBookings.length) * 100) : 0,
      });
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.greeting}>{t('pro.dashboard.title')}</Text>
          <Text style={styles.subtitle}>{professional?.salonName || professional?.name || ''}</Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsGrid}>
          <StatCard
            title={t('pro.dashboard.todayBookings')}
            value={String(stats.todayBookings)}
            icon="calendar"
            color={colors.primary}
          />
          <StatCard
            title={t('pro.dashboard.weekRevenue')}
            value={`R$ ${stats.weekRevenue.toLocaleString('pt-BR')}`}
            icon="trending-up"
            color={colors.success}
          />
          <StatCard
            title={t('pro.dashboard.totalClients')}
            value={String(stats.totalClients)}
            icon="people"
            color={colors.accent}
          />
          <StatCard
            title={t('pro.dashboard.occupancyRate')}
            value={`${stats.occupancyRate}%`}
            icon="stats-chart"
            color="#6C7CE0"
          />
        </Animated.View>

        {/* Today's Bookings */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>{t('pro.dashboard.todayBookings')}</Text>
          {bookings.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg }}>
              {t('pro.agenda.noBookings')}
            </Text>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingTime}>
                  <Text style={styles.timeText}>{booking.startTime || booking.time || ''}</Text>
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.clientName}>{booking.client?.name || booking.clientName || ''}</Text>
                  <Text style={styles.serviceName}>{booking.serviceDetails?.name || booking.service || ''}</Text>
                </View>
                <Badge
                  text={booking.status === 'confirmed' ? t('booking.confirmed') : booking.status === 'completed' ? t('booking.completed') : t('booking.pending')}
                  variant={booking.status === 'confirmed' || booking.status === 'completed' ? 'success' : 'warning'}
                />
              </Card>
            ))
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg },
  greeting: { fontSize: 28, fontWeight: '700', color: colors.text, paddingTop: spacing.lg },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: spacing.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
  statCard: { width: '47%', padding: spacing.lg, alignItems: 'flex-start' },
  statIcon: { width: 40, height: 40, borderRadius: radii.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  statTitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: spacing.xxl, marginBottom: spacing.md },
  bookingCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, marginBottom: spacing.sm },
  bookingTime: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  timeText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  bookingInfo: { flex: 1, marginLeft: spacing.md },
  clientName: { fontSize: 15, fontWeight: '600', color: colors.text },
  serviceName: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
