import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { categoriesApi, professionalsApi, notificationsApi, conversationsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { wsManager } from '../../services/websocket';
import type { Category, Professional } from '@beauty/shared-types';

// Map category icon names (stored as lowercase in DB) to Ionicons names
const CATEGORY_ICON_MAP: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  scissors: 'cut-outline',
  paintbrush: 'brush-outline',
  eye: 'eye-outline',
  hand: 'hand-left-outline',
  sparkles: 'sparkles-outline',
  heart: 'heart-outline',
  smile: 'happy-outline',
  zap: 'flash-outline',
  star: 'star-outline',
  flower: 'flower-outline',
  droplet: 'water-outline',
  sun: 'sunny-outline',
};

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const getCategoryName = useCallback((cat: Category) => {
    const tr = cat.translations?.find((t) => t.locale === i18n.language);
    return tr?.name || cat.translations?.[0]?.name || cat.slug;
  }, [i18n.language]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catRes = await categoriesApi.list();
        setCategories(catRes.data);

        // Try to get GPS location for "near you"
        let lat: number | undefined;
        let lng: number | undefined;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
          }
        } catch {}

        if (lat && lng) {
          // Search by real GPS location
          const profRes = await professionalsApi.list({ lat, lng, page: 1 });
          setProfessionals(profRes.data?.slice(0, 10) || []);
        } else {
          // Fallback to country-based featured
          const countryId = user?.countryId;
          if (countryId) {
            const profRes = await professionalsApi.getFeatured(countryId);
            setProfessionals(profRes.data);
          } else {
            const profRes = await professionalsApi.list({});
            setProfessionals(profRes.data?.slice(0, 10) || []);
          }
        }
      } catch (error: any) {
        // Silently handle — show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Refresh unread count every time the screen gains focus
  useFocusEffect(
    useCallback(() => {
      notificationsApi.unreadCount()
        .then((res) => setUnreadCount(res.data?.count || 0))
        .catch(() => {});
      conversationsApi.unreadCount()
        .then((res) => setUnreadMessages(res.data?.unreadCount || 0))
        .catch(() => {});
    }, []),
  );

  // Real-time badge updates via WebSocket
  useEffect(() => {
    const unsubMsg = wsManager.on('unread_update', (data) => {
      if (typeof data?.unreadMessages === 'number') {
        setUnreadMessages(data.unreadMessages);
      }
    });
    const unsubNotif = wsManager.on('notification', (data) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    });
    return () => { unsubMsg(); unsubNotif(); };
  }, []);

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
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>
                {user?.name ? t('home.greetingDefault').replace('!', `, ${user.name}!`) : t('home.greetingDefault')}
              </Text>
              <Text style={styles.subtitle}>{t('home.featured')}</Text>
            </View>
            <View style={styles.headerIcons}>
              <Pressable style={styles.bellBtn} onPress={() => router.push('/chat')}>
                <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
                {unreadMessages > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Text>
                  </View>
                )}
              </Pressable>
              <Pressable style={styles.bellBtn} onPress={() => router.push('/notifications')}>
                <Ionicons name="notifications-outline" size={24} color={colors.text} />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Categories */}
        {categories.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
              <Pressable onPress={() => router.push('/(tabs)/search')}><Text style={styles.seeAll}>{t('home.seeAll')}</Text></Pressable>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => {
                const iconName = CATEGORY_ICON_MAP[(item.icon || '').toLowerCase()] || 'grid-outline';
                return (
                  <Pressable style={styles.categoryItem} onPress={() => router.push({ pathname: '/(tabs)/search', params: { categoryId: item.id } })}>
                    <View style={styles.categoryIcon}>
                      <Ionicons name={iconName} size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.categoryName}>{getCategoryName(item)}</Text>
                  </Pressable>
                );
              }}
            />
          </Animated.View>
        )}

        {/* Featured */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.nearYou')}</Text>
            <Pressable onPress={() => router.push('/(tabs)/search')}><Text style={styles.seeAll}>{t('home.seeAll')}</Text></Pressable>
          </View>
        </Animated.View>

        {/* Professional cards */}
        {professionals.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xxxl }}>
            <Text style={{ color: colors.textSecondary }}>{t('search.noResults')}</Text>
          </View>
        ) : (
          professionals.map((prof, index) => (
            <Animated.View key={prof.id} entering={FadeInDown.delay(400 + index * 100)}>
              <Pressable onPress={() => router.push(`/professional/${prof.id}`)}>
                <Card style={styles.profCard}>
                  <Image
                    source={{ uri: prof.coverPhoto || 'https://picsum.photos/seed/default/400/500' }}
                    style={styles.profImage}
                    contentFit="cover"
                    transition={300}
                  />
                  <View style={styles.profInfo}>
                    <View style={styles.profHeader}>
                      <Text style={styles.profName}>{prof.businessName}</Text>
                    </View>
                    <Text style={styles.profCategory}>{prof.address}</Text>
                    <View style={styles.profFooter}>
                      <View style={styles.ratingRow}>
                        <Text style={styles.star}>&#9733;</Text>
                        <Text style={styles.rating}>{prof.rating?.toFixed(1) ?? '0.0'}</Text>
                        <Text style={styles.reviewCount}>({prof.totalReviews ?? 0})</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg },
  header: { paddingTop: spacing.lg, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bellBtn: { padding: spacing.sm, position: 'relative' },
  bellBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  greeting: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
  subtitle: { fontSize: typography.sizes.md, color: colors.textSecondary, marginTop: spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.xl },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text },
  seeAll: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium },
  categoryList: { paddingRight: spacing.lg, gap: spacing.md },
  categoryItem: { alignItems: 'center', width: 72 },
  categoryIcon: { width: 56, height: 56, borderRadius: radii.lg, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
  categoryEmoji: { fontSize: 24 },
  categoryName: { fontSize: typography.sizes.xs, color: colors.text, marginTop: spacing.xs, textAlign: 'center' },
  profCard: { marginBottom: spacing.md, overflow: 'hidden' },
  profImage: { width: '100%', height: 200, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg },
  profInfo: { padding: spacing.lg },
  profHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, flex: 1 },
  profCategory: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: spacing.xs },
  profFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { color: colors.accent, fontSize: 16 },
  rating: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
  reviewCount: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  profPrice: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.primary },
});
