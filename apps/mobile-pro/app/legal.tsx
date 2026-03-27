import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/colors';

export default function LegalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.termsOfUse', 'Termos e Políticas')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, activeTab === 'terms' && styles.tabActive]} onPress={() => setActiveTab('terms')}>
          <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
            {t('legal.terms', 'Termos de Uso')}
          </Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'privacy' && styles.tabActive]} onPress={() => setActiveTab('privacy')}>
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
            {t('legal.privacy', 'Privacidade')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'terms' ? (
          <Text style={styles.legalText}>
            {t('legal.termsContent', 'Os Termos de Uso do Bellu regulam o uso da plataforma por profissionais e clientes. Ao utilizar nossos serviços, você concorda com estes termos.\n\nO Bellu é uma plataforma de agendamento que conecta profissionais de beleza a clientes. Não nos responsabilizamos pela qualidade dos serviços prestados pelos profissionais.\n\nO profissional é responsável por manter seus dados atualizados, incluindo horários de funcionamento, preços e serviços oferecidos.\n\nReservas canceladas com menos de 2 horas de antecedência podem estar sujeitas a penalidades conforme política do profissional.')}
          </Text>
        ) : (
          <Text style={styles.legalText}>
            {t('legal.privacyContent', 'A Política de Privacidade do Bellu descreve como coletamos, usamos e protegemos seus dados pessoais.\n\nColetamos dados necessários para o funcionamento da plataforma: nome, e-mail, telefone, localização e dados de agendamento.\n\nSeus dados são usados exclusivamente para:\n• Permitir o agendamento de serviços\n• Enviar notificações relevantes\n• Melhorar a experiência do usuário\n\nNão compartilhamos seus dados com terceiros sem seu consentimento, exceto quando exigido por lei.\n\nVocê pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato conosco.')}
          </Text>
        )}
      </ScrollView>
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
  tabRow: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.lg,
    backgroundColor: colors.white, borderRadius: radii.lg, padding: 4,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  content: { padding: spacing.lg, paddingBottom: 100 },
  legalText: { fontSize: 14, color: colors.text, lineHeight: 22 },
});
