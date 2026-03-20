import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, radii } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api, FinanceSummary, Booking } from '../../services/api';

export default function FinancesScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [transactions, setTransactions] = useState<{ id: string; description: string; amount: string; date: string; type: string }[]>([]);

  const fetchFinances = async () => {
    try {
      setLoading(true);

      // Fetch recent bookings to compute finances
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);

      // Fetch bookings for the past 30 days to compute finances
      const dates: string[] = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }

      // Fetch today + recent dates for transaction list
      const todayStr = today.toISOString().split('T')[0];
      let allBookings: Booking[] = [];

      try {
        const res = await api.get<{ data: Booking[] }>(`/bookings/professional?date=${todayStr}`);
        allBookings = res.data || [];
      } catch {
        // If no date-based endpoint, try without date
        try {
          const res = await api.get<{ data: Booking[] }>('/bookings/professional');
          allBookings = res.data || [];
        } catch {
          allBookings = [];
        }
      }

      // Compute financials from completed/confirmed bookings
      const completedBookings = allBookings.filter(
        (b) => b.status === 'completed' || b.status === 'confirmed'
      );
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);

      setBalance(totalRevenue);
      setWeekEarnings(totalRevenue);
      setMonthEarnings(totalRevenue);

      // Build transaction list from bookings
      const txList = allBookings.map((b) => {
        const isCancelled = b.status === 'cancelled';
        const clientName = b.client?.name || b.clientName || '';
        const serviceName = b.serviceDetails?.name || b.service || '';
        return {
          id: b.id,
          description: isCancelled
            ? `Cancelamento - ${clientName}`
            : `${serviceName} — ${clientName}`,
          amount: isCancelled
            ? `-R$ ${(b.price || 0).toFixed(2).replace('.', ',')}`
            : `R$ ${(b.price || 0).toFixed(2).replace('.', ',')}`,
          date: b.date ? new Date(b.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '',
          type: isCancelled ? 'refund' : 'income',
        };
      });

      setTransactions(txList);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to load finances');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFinances();
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
        <Text style={styles.title}>{t('pro.finances.title')}</Text>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{t('pro.finances.balance')}</Text>
            <Text style={styles.balanceValue}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
            <Button label={t('pro.finances.withdraw')} onPress={() => {}} />
          </Card>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('pro.dashboard.weekRevenue')}</Text>
            <Text style={styles.statValue}>
              R$ {weekEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('pro.dashboard.monthRevenue')}</Text>
            <Text style={styles.statValue}>
              R$ {monthEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </Text>
          </Card>
        </Animated.View>

        {/* Transactions */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>{t('pro.finances.transactions')}</Text>
          {transactions.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg }}>
              {t('pro.finances.noTransactions')}
            </Text>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? colors.success + '20' : tx.type === 'fee' ? colors.accent + '20' : colors.error + '20' }]}>
                  <Ionicons
                    name={tx.type === 'income' ? 'arrow-down' : tx.type === 'fee' ? 'remove' : 'arrow-up'}
                    size={16}
                    color={tx.type === 'income' ? colors.success : tx.type === 'fee' ? colors.accent : colors.error}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? colors.success : colors.error }]}>
                  {tx.amount}
                </Text>
              </View>
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
  title: { fontSize: 28, fontWeight: '700', color: colors.text, paddingTop: spacing.lg },
  balanceCard: { padding: spacing.xxl, alignItems: 'center', marginTop: spacing.xl },
  balanceLabel: { fontSize: 14, color: colors.textSecondary },
  balanceValue: { fontSize: 36, fontWeight: '700', color: colors.text, marginVertical: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  statCard: { flex: 1, padding: spacing.lg },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: spacing.xxl, marginBottom: spacing.md },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: spacing.md },
  txDesc: { fontSize: 14, fontWeight: '500', color: colors.text },
  txDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600' },
});
