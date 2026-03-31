import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

interface SessionGroupBooking {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: string;
  sessionNumber: number;
  notes?: string;
  completedAt?: string;
}

interface SessionGroup {
  id: string;
  customServiceName?: string;
  clientName?: string;
  clientPhone?: string;
  totalSessions: number;
  priceType: string;
  totalPrice: number;
  sessionPrice: number;
  currency: string;
  notes?: string;
  status: string;
  service?: { id: string; name: string; durationMinutes: number; price?: number };
  user?: { id: string; name: string; phone?: string };
  bookings: SessionGroupBooking[];
}

const bookingStatusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  PENDING: { variant: 'warning', label: 'Pendente' },
  CONFIRMED: { variant: 'success', label: 'Confirmado' },
  COMPLETED: { variant: 'default', label: 'Concluído' },
  CANCELLED: { variant: 'error', label: 'Cancelado' },
  NO_SHOW: { variant: 'error', label: 'Não compareceu' },
};

export default function SessionGroupDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const [group, setGroup] = useState<SessionGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: SessionGroup }>(`/session-groups/${id}`);
      setGroup(res.data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroup(); }, [id]);

  const scheduledCount = group ? group.bookings.filter(b => b.date).length : 0;
  const pendingCount = group ? group.totalSessions - scheduledCount : 0;
  const completedCount = group ? group.bookings.filter(b => b.status === 'COMPLETED').length : 0;

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Preencha data e horário');
      return;
    }
    setScheduling(true);
    try {
      await api.post(`/session-groups/${id}/schedule`, {
        date: scheduleDate,
        startTime: scheduleTime,
        notes: scheduleNotes || undefined,
      });
      toast.success('Sessão agendada!');
      setScheduleModal(false);
      setScheduleDate('');
      setScheduleTime('');
      setScheduleNotes('');
      fetchGroup();
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setScheduling(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar grupo',
      'Tem certeza que deseja cancelar todas as sessões deste grupo?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/session-groups/${id}/cancel`, {});
              toast.success('Grupo cancelado');
              router.back();
            } catch (err: any) {
              toast.error(err?.message || t('common.error'));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Grupo não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Grupo de Sessões</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Group info card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>{group.user?.name || group.clientName || '—'}</Text>
              {(group.user?.phone || group.clientPhone) && (
                <Text style={styles.subValue}>{group.user?.phone || group.clientPhone}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Serviço</Text>
              <Text style={styles.value}>{group.service?.name || group.customServiceName || '—'}</Text>
            </View>
            <View style={styles.infoRowInline}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Sessões</Text>
                <Text style={styles.value}>{group.totalSessions}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Preço</Text>
                <Text style={styles.value}>
                  {group.priceType === 'PER_SESSION'
                    ? `R$ ${Number(group.sessionPrice).toFixed(2)}/sessão`
                    : `R$ ${Number(group.totalPrice).toFixed(2)} total`
                  }
                </Text>
              </View>
            </View>
            {group.notes && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Observações</Text>
                <Text style={styles.subValue}>{group.notes}</Text>
              </View>
            )}

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>{completedCount}/{group.totalSessions} concluídas</Text>
                {pendingCount > 0 && <Text style={styles.pendingText}>{pendingCount} a agendar</Text>}
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(completedCount / group.totalSessions) * 100}%` }]} />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Sessions */}
        <Text style={styles.sectionTitle}>Sessões</Text>

        {group.bookings.map((booking, index) => {
          const config = bookingStatusConfig[booking.status] || bookingStatusConfig.PENDING;
          return (
            <Animated.View key={booking.id} entering={FadeInDown.delay(200 + index * 60)}>
              <Card style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionNumber}>
                    <Text style={styles.sessionNumberText}>{booking.sessionNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.sessionDateRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.sessionDateText}>
                        {new Date(booking.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </Text>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                      <Text style={styles.sessionDateText}>
                        {booking.startTime}{booking.endTime ? `–${booking.endTime}` : ''}
                      </Text>
                    </View>
                    {booking.notes && <Text style={styles.sessionNotes}>{booking.notes}</Text>}
                  </View>
                  <Badge text={config.label} variant={config.variant} size="sm" />
                </View>
              </Card>
            </Animated.View>
          );
        })}

        {/* Unscheduled session placeholders */}
        {Array.from({ length: pendingCount }, (_, i) => (
          <Animated.View key={`pending-${i}`} entering={FadeInDown.delay(200 + (scheduledCount + i) * 60)}>
            <Card style={[styles.sessionCard, styles.sessionCardPending]}>
              <View style={styles.sessionHeader}>
                <View style={[styles.sessionNumber, styles.sessionNumberPending]}>
                  <Text style={[styles.sessionNumberText, { color: colors.textSecondary }]}>
                    {scheduledCount + i + 1}
                  </Text>
                </View>
                <Text style={styles.pendingLabel}>Agendar depois</Text>
              </View>
            </Card>
          </Animated.View>
        ))}

        {/* Actions */}
        <View style={styles.actions}>
          {group.status === 'ACTIVE' && pendingCount > 0 && (
            <Button
              title="Agendar sessão"
              onPress={() => setScheduleModal(true)}
              icon={<Ionicons name="add-circle-outline" size={18} color={colors.white} />}
              fullWidth
            />
          )}
          {group.status === 'ACTIVE' && (
            <Button
              title="Cancelar grupo"
              onPress={handleCancel}
              variant="outline"
              icon={<Ionicons name="close-circle-outline" size={18} color={colors.error} />}
              textStyle={{ color: colors.error }}
              style={{ borderColor: colors.error }}
              fullWidth
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Schedule Modal */}
      <Modal visible={scheduleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agendar sessão</Text>
              <Pressable onPress={() => setScheduleModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Data (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={scheduleDate}
              onChangeText={setScheduleDate}
              placeholder="2026-04-01"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Horário (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={scheduleTime}
              onChangeText={setScheduleTime}
              placeholder="14:00"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Observações</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={scheduleNotes}
              onChangeText={setScheduleNotes}
              placeholder="Observações da sessão..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <View style={{ marginTop: spacing.lg }}>
              <Button
                title={scheduling ? 'Agendando...' : 'Confirmar'}
                onPress={handleSchedule}
                loading={scheduling}
                disabled={scheduling || !scheduleDate || !scheduleTime}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  backBtn: { padding: spacing.xs },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
  infoCard: { padding: spacing.lg, marginBottom: spacing.lg },
  infoRow: { marginBottom: spacing.md },
  infoRowInline: { flexDirection: 'row', marginBottom: spacing.md },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '600', color: colors.text },
  subValue: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  progressSection: { marginTop: spacing.sm },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  progressText: { fontSize: 12, fontWeight: '600', color: colors.success },
  pendingText: { fontSize: 12, color: colors.accent },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.success },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  sessionCard: { padding: spacing.md, marginBottom: spacing.sm },
  sessionCardPending: { borderStyle: 'dashed', opacity: 0.5 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sessionNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  sessionNumberPending: { backgroundColor: colors.border },
  sessionNumberText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  sessionDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionDateText: { fontSize: 13, color: colors.text },
  sessionNotes: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  pendingLabel: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
  actions: { marginTop: spacing.xl, gap: spacing.md },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, color: colors.text, backgroundColor: colors.card },
});
