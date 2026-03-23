import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { reviewsApi } from '../../services/api';

export default function ReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    if (!bookingId) {
      toast(t('common.error'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsApi.create({
        bookingId,
        rating,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      toast(t('review.submitSuccess'), 'success');
      router.back();
    } catch (error: any) {
      toast(error.message || t('common.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('review.leaveReview')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Rating */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>{t('review.ratingLabel')}</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? colors.accent : colors.border}
                />
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Comment */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.commentCard}>
            <TextInput
              style={styles.commentInput}
              placeholder={t('review.commentPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </Card>
        </Animated.View>

        {/* Add Photo */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Pressable style={styles.photoBtn}>
            <Ionicons name="camera-outline" size={22} color={colors.primary} />
            <Text style={styles.photoBtnText}>{t('review.addPhoto')}</Text>
          </Pressable>
        </Animated.View>

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.submitSection}>
          {submitting ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Button
              label={t('review.submit')}
              onPress={handleSubmit}
              disabled={rating === 0}
            />
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  ratingSection: { alignItems: 'center', paddingVertical: spacing.xxl },
  ratingLabel: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginBottom: spacing.lg },
  starRow: { flexDirection: 'row', gap: spacing.md },
  commentCard: { padding: spacing.lg },
  commentInput: { fontSize: typography.sizes.md, color: colors.text, minHeight: 120, lineHeight: 22 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg, paddingVertical: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed' },
  photoBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.primary },
  submitSection: { marginTop: 'auto', paddingBottom: spacing.xxxl },
});
