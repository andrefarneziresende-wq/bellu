import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, radii } from '../../theme/colors';
import { api, PortfolioItem } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';

export default function PortfolioScreen() {
  const { t } = useTranslation();
  const { professional } = useAuthStore();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newService, setNewService] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const professionalId = professional?.id || '';
      const res = await api.get<{ data: PortfolioItem[] }>(
        `/portfolio?professionalId=${professionalId}`
      );
      setPortfolio(res.data || []);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPortfolio();
    }, [professional?.id])
  );

  const handleAdd = async () => {
    if (!newTitle.trim() || !newImageUrl.trim()) {
      Alert.alert(t('common.error'), t('pro.portfolio.fillRequired'));
      return;
    }

    try {
      setAdding(true);
      await api.post('/portfolio', {
        title: newTitle.trim(),
        description: newDescription.trim(),
        imageUrl: newImageUrl.trim(),
        service: newService.trim(),
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewImageUrl('');
      setNewService('');
      fetchPortfolio();
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || 'Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (item: PortfolioItem) => {
    Alert.alert(
      t('common.confirm'),
      t('pro.portfolio.deleteConfirmation'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/portfolio/${item.id}`);
              fetchPortfolio();
            } catch (error: any) {
              Alert.alert(t('common.error'), error?.message || 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>{t('pro.portfolio.title')}</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={22} color={colors.white} />
          <Text style={styles.addBtnText}>{t('pro.portfolio.addItem')}</Text>
        </Pressable>
      </View>

      {portfolio.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>{t('pro.portfolio.empty')}</Text>
          <Text style={styles.emptyMessage}>{t('pro.portfolio.emptyMessage')}</Text>
        </View>
      ) : (
        <FlatList
          data={portfolio}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(100 + index * 60)} style={styles.gridItem}>
              <Pressable onLongPress={() => handleDelete(item)}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" transition={200} />
                <Text style={styles.itemDesc} numberOfLines={1}>{item.title || item.description}</Text>
              </Pressable>
            </Animated.View>
          )}
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('pro.portfolio.addItem')}</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('pro.portfolio.titlePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.input}
              placeholder={t('pro.portfolio.descriptionPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={newDescription}
              onChangeText={setNewDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="URL da imagem"
              placeholderTextColor={colors.textSecondary}
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder={t('pro.portfolio.servicePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={newService}
              onChangeText={setNewService}
            />
            {adding ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />
            ) : (
              <Button label={t('common.save')} onPress={handleAdd} />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full },
  addBtnText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  grid: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 100 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  gridItem: { flex: 1 },
  image: { width: '100%', aspectRatio: 4 / 5, borderRadius: radii.lg },
  itemDesc: { fontSize: 13, fontWeight: '500', color: colors.text, marginTop: spacing.xs },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: spacing.lg },
  emptyMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl, gap: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  input: { backgroundColor: colors.background, borderRadius: radii.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
});
