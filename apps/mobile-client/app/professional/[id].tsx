import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { professionalsApi, servicesApi, reviewsApi, portfolioApi } from '../../services/api';
import type { Professional, Service, Review, PortfolioItem } from '@beauty/shared-types';

type TabKey = 'services' | 'portfolio' | 'reviews' | 'about';

export default function ProfessionalScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('services');
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch professional first — this is required
        const profRes = await professionalsApi.getById(id);
        setProfessional(profRes.data);

        // Fetch related data separately so failures don't block the page
        const [servRes, revRes, portRes] = await Promise.allSettled([
          servicesApi.getByProfessional(id),
          reviewsApi.getByProfessional(id),
          portfolioApi.getByProfessional(id),
        ]);
        setServices(servRes.status === 'fulfilled' ? servRes.value.data : []);
        setReviews(revRes.status === 'fulfilled' ? revRes.value.data : []);
        setPortfolio(portRes.status === 'fulfilled' ? portRes.value.data : []);
      } catch (error: any) {
        // Professional fetch failed
        setProfessional(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'services', label: t('professional.services') },
    { key: 'portfolio', label: t('professional.portfolio') },
    { key: 'reviews', label: t('professional.reviews') },
    { key: 'about', label: t('professional.about') },
  ];

  // Check if professional is currently open based on workingHours
  const isOpenNow = (() => {
    if (!professional?.workingHours || professional.workingHours.length === 0) return false;
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun, 1=Mon, etc.
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayHours = (professional.workingHours as any[]).find(
      (wh: any) => wh.dayOfWeek === currentDay && wh.isOpen !== false,
    );
    if (!todayHours) return false;
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  })();

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'BRL') return `R$ ${price.toFixed(2).replace('.', ',')}`;
    if (currency === 'EUR') return `${price.toFixed(2).replace('.', ',')} \u20AC`;
    return `${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!professional) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Professional not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <Animated.View entering={FadeIn}>
          {professional.coverPhoto ? (
            <Image
              source={{ uri: professional.coverPhoto }}
              style={styles.coverImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Ionicons name="image-outline" size={48} color={colors.border} />
            </View>
          )}
          <SafeAreaView style={styles.backBtn} edges={['top']}>
            <Pressable onPress={() => router.back()} style={styles.backCircle}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          </SafeAreaView>
        </Animated.View>

        {/* Profile Info */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.profileSection}>
          {professional.avatarPhoto ? (
            <Image
              source={{ uri: professional.avatarPhoto }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={36} color={colors.white} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.businessName}>{professional.businessName}</Text>
              {professional.verified && <Badge label={t('professional.verified')} variant="success" />}
            </View>
            <Text style={styles.category}>{professional.description || ''}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>&#9733;</Text>
              <Text style={styles.rating}>{professional.rating?.toFixed(1) ?? '0.0'}</Text>
              <Text style={styles.reviewCount}>{t('professional.reviewCount', { count: professional.totalReviews ?? 0 })}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{professional.address}</Text>
            </View>
            {isOpenNow && <Badge label={t('professional.openNow')} variant="success" />}
            {!isOpenNow && professional.active && <Badge label={t('professional.closedNow')} variant="default" />}
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.tabRow}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Tab Content */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.tabContent}>
          {activeTab === 'services' && (
            <View>
              {services.length === 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl }}>{t('search.noResults')}</Text>
              ) : (
                services.map((service) => (
                  <Card key={service.id} style={styles.serviceCard}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceDuration}>{service.durationMinutes} min</Text>
                    </View>
                    <Text style={styles.servicePrice}>{formatPrice(service.price, service.currency)}</Text>
                  </Card>
                ))
              )}
            </View>
          )}

          {activeTab === 'portfolio' && (
            <View style={styles.portfolioGrid}>
              {portfolio.length === 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl, width: '100%' }}>{t('search.noResults')}</Text>
              ) : (
                portfolio.map((item, i) => (
                  <Image key={item.id || i} source={{ uri: item.afterPhoto }} style={styles.portfolioItem} contentFit="cover" transition={200} />
                ))
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View>
              {reviews.length === 0 ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl }}>{t('search.noResults')}</Text>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewName}>{(review as any).user?.name || ''}</Text>
                      <View style={styles.reviewRating}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Text key={i} style={{ color: i < review.rating ? colors.accent : colors.border, fontSize: 14 }}>&#9733;</Text>
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment || ''}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  </Card>
                ))
              )}
            </View>
          )}

          {activeTab === 'about' && (
            <Card style={styles.aboutCard}>
              <Text style={styles.aboutText}>
                {professional.description || ''}
              </Text>
              <View style={styles.aboutRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.aboutMeta}>{professional.address}</Text>
              </View>
            </Card>
          )}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Book Button */}
      <View style={styles.floatingBtn}>
        <Button label={t('booking.scheduleButton')} onPress={() => router.push(`/booking/${id}`)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  coverImage: { width: '100%', height: 220 },
  coverPlaceholder: { backgroundColor: colors.borderLight || '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 0, left: spacing.lg },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
  profileSection: { flexDirection: 'row', paddingHorizontal: spacing.lg, marginTop: -30 },
  avatar: { width: 80, height: 80, borderRadius: radii.xl, borderWidth: 3, borderColor: colors.white },
  avatarPlaceholder: { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1, marginLeft: spacing.md, marginTop: 34, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  businessName: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text },
  category: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { color: colors.accent, fontSize: 16 },
  rating: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text },
  reviewCount: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  tabRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.xl, backgroundColor: colors.white, borderRadius: radii.lg, padding: 4 },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  tabContent: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, marginBottom: spacing.sm },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.text },
  serviceDuration: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  servicePrice: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.primary },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  portfolioItem: { width: '31.5%', aspectRatio: 4 / 5, borderRadius: radii.md },
  reviewCard: { padding: spacing.lg, marginBottom: spacing.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  reviewRating: { flexDirection: 'row' },
  reviewComment: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  reviewDate: { fontSize: typography.sizes.xs, color: colors.textTertiary, marginTop: spacing.sm },
  aboutCard: { padding: spacing.lg },
  aboutText: { fontSize: typography.sizes.sm, color: colors.text, lineHeight: 22 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  aboutMeta: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  floatingBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 34, borderTopWidth: 1, borderTopColor: colors.border },
});
