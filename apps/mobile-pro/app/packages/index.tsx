import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, spacing, radii } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

/* ─── Types ────────────────────────────────── */

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

interface ServicePackage {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  sessionsTotal: number;
  intervalDays?: number;
  priceTotal: number;
  currency: string;
  active: boolean;
  service?: Service;
}

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface ClientPackage {
  id: string;
  totalSessions: number;
  sessionsUsed: number;
  status: string;
  user?: { id: string; name: string };
  servicePackage?: { name: string; service?: { name: string } };
  bookings?: Array<{
    id: string;
    date: string;
    startTime: string;
    status: string;
    sessionNumber: number;
  }>;
}

/* ─── Component ─────────────────────────────── */

export default function PackagesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [clientPkgs, setClientPkgs] = useState<ClientPackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'packages' | 'sold'>('packages');

  // Create/edit package
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formServiceId, setFormServiceId] = useState('');
  const [formSessions, setFormSessions] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formInterval, setFormInterval] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sell package
  const [sellVisible, setSellVisible] = useState(false);
  const [sellPkg, setSellPkg] = useState<ServicePackage | null>(null);
  const [sellClientId, setSellClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [sessionDates, setSessionDates] = useState<Array<{ date: string; startTime: string }>>([]);

  // Service picker
  const [servicePickerVisible, setServicePickerVisible] = useState(false);

  /* ─── Fetchers ───────────────────────────── */

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgRes, cpRes, svcRes, cliRes] = await Promise.all([
        api.get<{ data: ServicePackage[] }>('/service-packages'),
        api.get<{ data: ClientPackage[] }>('/client-packages/professional'),
        api.get<{ data: Service[] }>('/services'),
        api.get<{ data: Client[] }>('/users?role=customer'),
      ]);
      setPackages(pkgRes.data || []);
      setClientPkgs(cpRes.data || []);
      setServices(svcRes.data || []);
      setClients(cliRes.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  /* ─── Package CRUD ───────────────────────── */

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormServiceId('');
    setFormSessions('');
    setFormPrice('');
    setFormInterval('');
    setFormVisible(true);
  };

  const openEdit = (pkg: ServicePackage) => {
    setEditingId(pkg.id);
    setFormName(pkg.name);
    setFormServiceId(pkg.serviceId);
    setFormSessions(String(pkg.sessionsTotal));
    setFormPrice(String(pkg.priceTotal));
    setFormInterval(pkg.intervalDays ? String(pkg.intervalDays) : '');
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formServiceId || !formSessions || !formPrice) {
      toast.error(t('validation.required'));
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: formName,
        serviceId: formServiceId,
        sessionsTotal: parseInt(formSessions),
        priceTotal: parseFloat(formPrice),
        currency: 'BRL',
        intervalDays: formInterval ? parseInt(formInterval) : undefined,
      };
      if (editingId) {
        await api.put(`/service-packages/${editingId}`, body);
        toast.success(t('proDashboard.packages.updated'));
      } else {
        await api.post('/service-packages', body);
        toast.success(t('proDashboard.packages.created'));
      }
      setFormVisible(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pkg: ServicePackage) => {
    try {
      await api.delete(`/service-packages/${pkg.id}`);
      toast.success(t('proDashboard.packages.deleted'));
      fetchAll();
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    }
  };

  /* ─── Sell Package ───────────────────────── */

  const openSell = (pkg: ServicePackage) => {
    setSellPkg(pkg);
    setSellClientId('');
    setClientSearch('');
    setSessionDates(
      Array.from({ length: pkg.sessionsTotal }, () => ({ date: '', startTime: '' }))
    );
    setSellVisible(true);
  };

  const updateSessionDate = (idx: number, field: 'date' | 'startTime', value: string) => {
    setSessionDates((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSell = async () => {
    if (!sellPkg || !sellClientId) {
      toast.error(t('validation.required'));
      return;
    }
    const filled = sessionDates.filter((s) => s.date && s.startTime);
    if (filled.length === 0) {
      toast.error(t('proDashboard.packages.fillAtLeastOneSession'));
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/client-packages', {
        servicePackageId: sellPkg.id,
        userId: sellClientId,
        sessions: filled,
      });
      toast.success(t('proDashboard.packages.sold'));
      setSellVisible(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clientSearch
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.phone?.includes(clientSearch) ||
          c.email?.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  /* ─── Render ─────────────────────────────── */

  const statusColor: Record<string, string> = {
    ACTIVE: colors.success || '#22c55e',
    COMPLETED: colors.primary,
    EXPIRED: '#9ca3af',
    CANCELLED: colors.error || '#ef4444',
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('proDashboard.packages.title')}</Text>
        <Pressable onPress={openCreate} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.white} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'packages' && styles.tabActive]}
          onPress={() => setTab('packages')}
        >
          <Text style={[styles.tabText, tab === 'packages' && styles.tabTextActive]}>
            {t('proDashboard.packages.myPackages')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'sold' && styles.tabActive]}
          onPress={() => setTab('sold')}
        >
          <Text style={[styles.tabText, tab === 'sold' && styles.tabTextActive]}>
            {t('proDashboard.packages.soldPackages')} ({clientPkgs.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {tab === 'packages' ? (
          packages.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>{t('proDashboard.packages.noPackages')}</Text>
              <Pressable onPress={openCreate} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>{t('proDashboard.packages.newPackage')}</Text>
              </Pressable>
            </View>
          ) : (
            packages.map((pkg) => (
              <Card key={pkg.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{pkg.name}</Text>
                    <Text style={styles.cardSub}>
                      {pkg.service?.name} · {pkg.sessionsTotal}x
                    </Text>
                  </View>
                  <Badge
                    label={pkg.active ? t('proDashboard.services.active') : t('proDashboard.services.inactive')}
                    variant={pkg.active ? 'success' : 'default'}
                  />
                </View>
                <View style={styles.cardPrices}>
                  <Text style={styles.priceLabel}>
                    {t('proDashboard.packages.totalPrice')}: R$ {Number(pkg.priceTotal).toFixed(2)}
                  </Text>
                  <Text style={styles.priceLabel}>
                    {t('proDashboard.packages.perSession')}: R$ {(Number(pkg.priceTotal) / pkg.sessionsTotal).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => openSell(pkg)} style={styles.actionBtn}>
                    <Ionicons name="cart-outline" size={18} color={colors.success || '#22c55e'} />
                    <Text style={[styles.actionText, { color: colors.success || '#22c55e' }]}>
                      {t('proDashboard.packages.sell')}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => openEdit(pkg)} style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(pkg)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.error || '#ef4444'} />
                  </Pressable>
                </View>
              </Card>
            ))
          )
        ) : clientPkgs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{t('proDashboard.packages.noSoldPackages')}</Text>
          </View>
        ) : (
          clientPkgs.map((cp) => (
            <Card key={cp.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{cp.servicePackage?.name}</Text>
                  <Text style={styles.cardSub}>
                    {t('proDashboard.packages.client')}: {cp.user?.name || '—'}
                  </Text>
                </View>
                <Badge
                  label={cp.status}
                  variant={cp.status === 'ACTIVE' ? 'success' : 'default'}
                />
              </View>
              <Text style={styles.priceLabel}>
                {cp.sessionsUsed}/{cp.totalSessions} {t('proDashboard.packages.sessionsCompleted')}
              </Text>
              {cp.bookings && cp.bookings.length > 0 && (
                <View style={styles.sessionList}>
                  {cp.bookings.map((bk) => (
                    <View
                      key={bk.id}
                      style={[
                        styles.sessionChip,
                        {
                          backgroundColor:
                            bk.status === 'COMPLETED' ? '#dcfce7'
                            : bk.status === 'CANCELLED' ? '#fee2e2'
                            : '#dbeafe',
                        },
                      ]}
                    >
                      <Text style={styles.sessionText}>
                        #{bk.sessionNumber} {new Date(bk.date).toLocaleDateString()} {bk.startTime}
                        {bk.status === 'COMPLETED' ? ' ✓' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* ─── Create/Edit Modal ────────────── */}
      <Modal visible={formVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? t('proDashboard.packages.editPackage') : t('proDashboard.packages.newPackage')}
              </Text>
              <Pressable onPress={() => setFormVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.label}>{t('proDashboard.packages.name')} *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="Ex: Pacote Hidratação 5x"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>{t('proDashboard.packages.service')} *</Text>
              <Pressable
                style={styles.input}
                onPress={() => setServicePickerVisible(true)}
              >
                <Text style={{ color: formServiceId ? colors.text : colors.textSecondary }}>
                  {formServiceId
                    ? services.find((s) => s.id === formServiceId)?.name || t('proDashboard.agenda.selectService')
                    : t('proDashboard.agenda.selectService')}
                </Text>
              </Pressable>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t('proDashboard.packages.sessions')} *</Text>
                  <TextInput
                    style={styles.input}
                    value={formSessions}
                    onChangeText={setFormSessions}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t('proDashboard.packages.interval')}</Text>
                  <TextInput
                    style={styles.input}
                    value={formInterval}
                    onChangeText={setFormInterval}
                    keyboardType="numeric"
                    placeholder="dias"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <Text style={styles.label}>{t('proDashboard.packages.totalPrice')} (R$) *</Text>
              <TextInput
                style={styles.input}
                value={formPrice}
                onChangeText={setFormPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />

              {formSessions && formPrice && parseInt(formSessions) >= 2 && parseFloat(formPrice) > 0 && (
                <Text style={styles.hint}>
                  {t('proDashboard.packages.perSession')}: R$ {(parseFloat(formPrice) / parseInt(formSessions)).toFixed(2)}
                </Text>
              )}
            </ScrollView>

            <Pressable
              style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {editingId ? t('common.save') : t('common.confirm')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── Service Picker Modal ─────────── */}
      <Modal visible={servicePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('proDashboard.packages.service')}</Text>
              <Pressable onPress={() => setServicePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {services.map((svc) => (
                <Pressable
                  key={svc.id}
                  style={[
                    styles.pickerItem,
                    formServiceId === svc.id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setFormServiceId(svc.id);
                    setServicePickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{svc.name}</Text>
                  <Text style={styles.pickerItemSub}>
                    R$ {Number(svc.price).toFixed(2)} · {svc.durationMinutes}min
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Sell Package Modal ───────────── */}
      <Modal visible={sellVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('proDashboard.packages.sellPackage')}</Text>
              <Pressable onPress={() => setSellVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 450 }}>
              {/* Package info */}
              {sellPkg && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>{sellPkg.name}</Text>
                  <Text style={styles.infoSub}>
                    {sellPkg.sessionsTotal}x {sellPkg.service?.name} — R$ {Number(sellPkg.priceTotal).toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Client search */}
              <Text style={styles.label}>{t('proDashboard.packages.client')} *</Text>
              <TextInput
                style={styles.input}
                value={clientSearch}
                onChangeText={(v) => { setClientSearch(v); setSellClientId(''); }}
                placeholder={t('proDashboard.agenda.searchClient')}
                placeholderTextColor={colors.textSecondary}
              />
              {sellClientId ? (
                <View style={styles.selectedClient}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success || '#22c55e'} />
                  <Text style={styles.selectedClientText}>
                    {clients.find((c) => c.id === sellClientId)?.name}
                  </Text>
                  <Pressable onPress={() => setSellClientId('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ) : clientSearch ? (
                <View style={styles.clientList}>
                  {filteredClients.slice(0, 5).map((c) => (
                    <Pressable
                      key={c.id}
                      style={styles.clientItem}
                      onPress={() => { setSellClientId(c.id); setClientSearch(''); }}
                    >
                      <Text style={styles.clientName}>{c.name}</Text>
                      {c.phone && <Text style={styles.clientPhone}>{c.phone}</Text>}
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {/* Session dates */}
              <Text style={[styles.label, { marginTop: 12 }]}>
                {t('proDashboard.packages.sessionDates')}
              </Text>
              {sessionDates.map((s, idx) => (
                <View key={idx} style={styles.sessionRow}>
                  <Text style={styles.sessionNum}>#{idx + 1}</Text>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={s.date}
                    onChangeText={(v) => updateSessionDate(idx, 'date', v)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { width: 80, marginBottom: 0, marginLeft: 8 }]}
                    value={s.startTime}
                    onChangeText={(v) => updateSessionDate(idx, 'startTime', v)}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              ))}
              <Text style={styles.hint}>
                {t('proDashboard.packages.sessionDatesHint')}
              </Text>
            </ScrollView>

            <Pressable
              style={[styles.primaryBtn, (submitting || !sellClientId) && { opacity: 0.6 }]}
              onPress={handleSell}
              disabled={submitting || !sellClientId}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {t('proDashboard.packages.confirmSell')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ─── Styles ──────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: { padding: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text, marginLeft: 8 },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.text },
  tabTextActive: { color: colors.white },
  content: { flex: 1, paddingHorizontal: spacing.md },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 12 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardPrices: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  priceLabel: { fontSize: 13, color: colors.textSecondary },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  actionText: { fontSize: 13, fontWeight: '600' },
  sessionList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  sessionChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sessionText: { fontSize: 11, fontWeight: '500' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  row: { flexDirection: 'row' },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },

  // Picker
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemActive: { backgroundColor: '#f0e8e7' },
  pickerItemText: { fontSize: 14, fontWeight: '600', color: colors.text },
  pickerItemSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Client
  selectedClient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: radii.md,
    marginBottom: 8,
  },
  selectedClientText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  clientList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    marginBottom: 8,
  },
  clientItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clientName: { fontSize: 14, fontWeight: '600', color: colors.text },
  clientPhone: { fontSize: 12, color: colors.textSecondary },

  // Session dates
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionNum: {
    width: 30,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#f5f0ef',
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 12,
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  infoSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
