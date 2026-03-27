import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/colors';
import { api } from '../services/api';

interface Service {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationMinutes: number;
  active: boolean;
}

export default function ServicesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Service[] }>('/services/my');
      setServices(res.data || []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchServices(); }, [fetchServices]));

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'BRL') return `R$ ${price.toFixed(2).replace('.', ',')}`;
    if (currency === 'EUR') return `${price.toFixed(2).replace('.', ',')} €`;
    return `${price.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('pro.services.title', 'Serviços')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : services.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cut-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>{t('pro.services.empty', 'Nenhum serviço cadastrado')}</Text>
          <Text style={styles.emptyText}>{t('pro.services.emptyMessage', 'Adicione serviços pelo painel web.')}</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60)}>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <Text style={styles.serviceDetail}>
                      {item.durationMinutes} min • {formatPrice(item.price, item.currency)}
                    </Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: item.active ? colors.success : colors.error }]} />
                </View>
              </View>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: spacing.xl },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  list: { padding: spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  serviceName: { fontSize: 16, fontWeight: '600', color: colors.text },
  serviceDetail: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
