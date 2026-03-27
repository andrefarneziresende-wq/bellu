import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/colors';
import { api } from '../services/api';

interface WorkingHour {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function WorkingHoursScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>('/working-hours');
        const existing = res.data || [];
        const full: WorkingHour[] = Array.from({ length: 7 }, (_, i) => {
          const found = existing.find((h: any) => h.dayOfWeek === i);
          return found
            ? { id: found.id, dayOfWeek: i, startTime: found.startTime, endTime: found.endTime, enabled: true }
            : { dayOfWeek: i, startTime: '09:00', endTime: '18:00', enabled: false };
        });
        setHours(full);
      } catch {
        const defaults: WorkingHour[] = Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i, startTime: '09:00', endTime: '18:00', enabled: i >= 1 && i <= 5,
        }));
        setHours(defaults);
      } finally {
        setLoading(false);
      }
    };
    fetchHours();
  }, []);

  const toggleDay = (dayOfWeek: number) => {
    setHours((prev) => prev.map((h) =>
      h.dayOfWeek === dayOfWeek ? { ...h, enabled: !h.enabled } : h
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = hours
        .filter((h) => h.enabled)
        .map((h) => ({ dayOfWeek: h.dayOfWeek, startTime: h.startTime, endTime: h.endTime }));
      await api.put('/working-hours', payload);
      Alert.alert(t('common.save', 'Salvo'), t('pro.workingHours.saved', 'Horários atualizados!'));
    } catch {
      Alert.alert(t('common.error', 'Erro'), t('pro.workingHours.saveError', 'Não foi possível salvar.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('professional.workingHours', 'Horários de trabalho')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {hours.map((h) => (
          <View key={h.dayOfWeek} style={styles.dayRow}>
            <View style={styles.dayInfo}>
              <Text style={[styles.dayName, !h.enabled && styles.dayDisabled]}>{DAY_NAMES[h.dayOfWeek]}</Text>
              {h.enabled && (
                <Text style={styles.dayTime}>{h.startTime} - {h.endTime}</Text>
              )}
            </View>
            <Switch
              value={h.enabled}
              onValueChange={() => toggleDay(h.dayOfWeek)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>{t('common.save', 'Salvar')}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  list: { padding: spacing.lg },
  dayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  dayInfo: { flex: 1 },
  dayName: { fontSize: 16, fontWeight: '600', color: colors.text },
  dayDisabled: { color: colors.textSecondary },
  dayTime: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  footer: { padding: spacing.lg },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
