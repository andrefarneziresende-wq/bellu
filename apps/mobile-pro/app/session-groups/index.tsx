import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, spacing, radii } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';

interface SessionGroupBooking {
  id: string;
  date: string;
  startTime: string;
  status: string;
  sessionNumber: number;
  notes?: string;
}

interface SessionGroup {
  id: string;
  customServiceName?: string;
  clientName?: string;
  totalSessions: number;
  priceType: string;
  totalPrice: number;
  sessionPrice: number;
  currency: string;
  status: string;
  createdAt: string;
  service?: { id: string; name: string; durationMinutes: number };
  bookings: SessionGroupBooking[];
}

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  ACTIVE: { variant: 'success', label: 'Ativo' },
  COMPLETED: { variant: 'default', label: 'Concluído' },
  CANCELLED: { variant: 'error', label: 'Cancelado' },
};

export default function SessionGroupsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [groups, setGroups] = useState<SessionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: SessionGroup[] }>('/session-groups');
      setGroups(res.data || []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  const completedCount = (g: SessionGroup) => g.bookings.filter(b => b.status === 'COMPLETED').length;
  const scheduledCount = (g: SessionGroup) => g.bookings.filter(b => b.date).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('pro.sessionGroups.title', 'Grupos de Sessões')}</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="layers-outline" size={48} color={colors.border} />
          <Text style={styles.emptyText}>{t('pro.sessionGroups.noGroups', 'Nenhum grupo de sessões')}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {groups.map((group, index) => {
            const sConfig = statusConfig[group.status] || statusConfig.ACTIVE;
            return (
              <Animated.View key={group.id} entering={FadeInDown.delay(100 + index * 60)}>
                <Pressable onPress={() => router.push(`/session-groups/${group.id}`)}>
                  <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.clientName}>{group.clientName || '—'}</Text>
                        <Text style={styles.serviceName}>
                          {group.service?.name || group.customServiceName || '—'}
                        </Text>
                      </View>
                      <Badge text={sConfig.label} variant={sConfig.variant} />
                    </View>

                    <View style={styles.cardMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>
                          {group.totalSessions} sessões
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                        <Text style={styles.metaText}>
                          {completedCount(group)}/{group.totalSessions}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>
                          {group.priceType === 'PER_SESSION'
                            ? `R$ ${Number(group.sessionPrice).toFixed(2)}/sessão`
                            : `R$ ${Number(group.totalPrice).toFixed(2)} total`
                          }
                        </Text>
                      </View>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${(completedCount(group) / group.totalSessions) * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </Animated.View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  backBtn: { padding: spacing.xs },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, marginTop: spacing.md, fontSize: 15 },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  clientName: { fontSize: 15, fontWeight: '600', color: colors.text },
  serviceName: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  progressContainer: { marginTop: spacing.md },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: colors.success },
});
