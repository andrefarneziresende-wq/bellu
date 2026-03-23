'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus, Pencil, Trash2, Loader2, Package, CalendarPlus,
  Search, UserPlus, Check, X, Calendar,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

/* ─── Types ─────────────────────────────────────────────── */

interface Service {
  id: string;
  name: string;
  price: number;
  currency: string;
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
  userId: string;
  servicePackageId: string;
  professionalId: string;
  totalSessions: number;
  sessionsUsed: number;
  status: string;
  expiryDate?: string;
  user?: { id: string; name: string; avatar?: string };
  servicePackage?: ServicePackage & { service?: Service };
  bookings?: Array<{
    id: string;
    date: string;
    startTime: string;
    status: string;
    sessionNumber: number;
    completedAt?: string;
  }>;
}

interface PackageFieldErrors {
  name?: string;
  serviceId?: string;
  sessionsTotal?: string;
  priceTotal?: string;
}

/* ─── Empty forms ───────────────────────────────────────── */

const emptyPackageForm = {
  serviceId: '',
  name: '',
  description: '',
  sessionsTotal: '',
  intervalDays: '',
  priceTotal: '',
  currency: 'BRL',
};

const emptySessionForm = { date: '', startTime: '' };

/* ─── Component ─────────────────────────────────────────── */

export default function PackagesPage() {
  const toast = useToast();
  const { t } = useTranslation();

  // Data
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [clientPackages, setClientPackages] = useState<ClientPackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Package CRUD dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPackageForm);
  const [fieldErrors, setFieldErrors] = useState<PackageFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPkg, setDeletingPkg] = useState<ServicePackage | null>(null);

  // Sell package dialog
  const [sellOpen, setSellOpen] = useState(false);
  const [sellPkg, setSellPkg] = useState<ServicePackage | null>(null);
  const [sellClientId, setSellClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [sessions, setSessions] = useState<Array<{ date: string; startTime: string }>>([]);

  // Tab
  const [tab, setTab] = useState<'templates' | 'sold'>('templates');

  /* ─── Fetchers ──────────────────────────────────────────── */

  const fetchPackages = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: ServicePackage[] }>('/api/service-packages');
      setPackages(res.data || []);
    } catch {
      setPackages([]);
    }
  }, []);

  const fetchClientPackages = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: ClientPackage[] }>('/api/client-packages/professional');
      setClientPackages(res.data || []);
    } catch {
      setClientPackages([]);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Service[] }>('/api/services');
      setServices(res.data || []);
    } catch {
      setServices([]);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Client[] }>('/api/users?role=customer');
      setClients(res.data || []);
    } catch {
      setClients([]);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPackages(), fetchClientPackages(), fetchServices(), fetchClients()])
      .finally(() => setLoading(false));
  }, [fetchPackages, fetchClientPackages, fetchServices, fetchClients]);

  /* ─── Package CRUD ──────────────────────────────────────── */

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyPackageForm);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (pkg: ServicePackage) => {
    setEditingId(pkg.id);
    setForm({
      serviceId: pkg.serviceId,
      name: pkg.name,
      description: pkg.description || '',
      sessionsTotal: String(pkg.sessionsTotal),
      intervalDays: pkg.intervalDays ? String(pkg.intervalDays) : '',
      priceTotal: String(pkg.priceTotal),
      currency: pkg.currency,
    });
    setFieldErrors({});
    setFormOpen(true);
  };

  const validateForm = (): PackageFieldErrors => {
    const errors: PackageFieldErrors = {};
    if (!form.name.trim()) errors.name = t('validation.required');
    if (!form.serviceId) errors.serviceId = t('validation.required');
    if (!form.sessionsTotal || parseInt(form.sessionsTotal) < 2) errors.sessionsTotal = t('validation.minValue', { min: '2' });
    if (!form.priceTotal || parseFloat(form.priceTotal) <= 0) errors.priceTotal = t('validation.positiveNumber');
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const body = {
        serviceId: form.serviceId,
        name: form.name,
        description: form.description || undefined,
        sessionsTotal: parseInt(form.sessionsTotal),
        intervalDays: form.intervalDays ? parseInt(form.intervalDays) : undefined,
        priceTotal: parseFloat(form.priceTotal),
        currency: form.currency,
      };

      if (editingId) {
        await apiFetch(`/api/service-packages/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
        toast.success(t('proDashboard.packages.updated'));
      } else {
        await apiFetch('/api/service-packages', { method: 'POST', body: JSON.stringify(body) });
        toast.success(t('proDashboard.packages.created'));
      }
      setFormOpen(false);
      fetchPackages();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPkg) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/service-packages/${deletingPkg.id}`, { method: 'DELETE' });
      toast.success(t('proDashboard.packages.deleted'));
      setDeleteOpen(false);
      fetchPackages();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (pkg: ServicePackage) => {
    try {
      await apiFetch(`/api/service-packages/${pkg.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !pkg.active }),
      });
      fetchPackages();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  /* ─── Sell Package ──────────────────────────────────────── */

  const openSell = (pkg: ServicePackage) => {
    setSellPkg(pkg);
    setSellClientId('');
    setClientSearch('');
    setSessions(
      Array.from({ length: pkg.sessionsTotal }, () => ({ ...emptySessionForm }))
    );
    setSellOpen(true);
  };

  const updateSession = (idx: number, field: 'date' | 'startTime', value: string) => {
    setSessions((prev) => {
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

    const filledSessions = sessions.filter((s) => s.date && s.startTime);
    if (filledSessions.length === 0) {
      toast.error(t('proDashboard.packages.fillAtLeastOneSession'));
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/api/client-packages', {
        method: 'POST',
        body: JSON.stringify({
          servicePackageId: sellPkg.id,
          userId: sellClientId,
          sessions: filledSessions,
        }),
      });
      toast.success(t('proDashboard.packages.sold'));
      setSellOpen(false);
      fetchClientPackages();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('errors.generic'));
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

  /* ─── Helpers ───────────────────────────────────────────── */

  const statusColors: Record<string, string> = {
    ACTIVE: 'default',
    COMPLETED: 'success',
    EXPIRED: 'secondary',
    CANCELLED: 'destructive',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: t('proDashboard.packages.statusActive'),
    COMPLETED: t('proDashboard.packages.statusCompleted'),
    EXPIRED: t('proDashboard.packages.statusExpired'),
    CANCELLED: t('proDashboard.packages.statusCancelled'),
  };

  /* ─── Render ────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('proDashboard.packages.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('proDashboard.packages.subtitle')}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('proDashboard.packages.newPackage')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tab === 'templates' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('templates')}
        >
          <Package className="mr-2 h-4 w-4" />
          {t('proDashboard.packages.myPackages')}
        </Button>
        <Button
          variant={tab === 'sold' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('sold')}
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          {t('proDashboard.packages.soldPackages')} ({clientPackages.length})
        </Button>
      </div>

      {/* Templates Tab */}
      {tab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('proDashboard.packages.myPackages')} ({packages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : packages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Package className="h-12 w-12" />
                <p className="mt-4 text-sm">{t('proDashboard.packages.noPackages')}</p>
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('proDashboard.packages.newPackage')}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('proDashboard.packages.name')}</TableHead>
                    <TableHead>{t('proDashboard.packages.service')}</TableHead>
                    <TableHead>{t('proDashboard.packages.sessions')}</TableHead>
                    <TableHead>{t('proDashboard.packages.totalPrice')}</TableHead>
                    <TableHead>{t('proDashboard.packages.perSession')}</TableHead>
                    <TableHead>{t('booking.status')}</TableHead>
                    <TableHead className="w-[160px]">{t('common.edit')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{pkg.service?.name || '—'}</TableCell>
                      <TableCell>{pkg.sessionsTotal}x</TableCell>
                      <TableCell>R$ {Number(pkg.priceTotal).toFixed(2)}</TableCell>
                      <TableCell>
                        R$ {(Number(pkg.priceTotal) / pkg.sessionsTotal).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={pkg.active ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(pkg)}
                        >
                          {pkg.active ? t('proDashboard.services.active') : t('proDashboard.services.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openSell(pkg)} title={t('proDashboard.packages.sell')}>
                            <CalendarPlus className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setDeletingPkg(pkg); setDeleteOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 text-brand-error" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sold Packages Tab */}
      {tab === 'sold' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('proDashboard.packages.soldPackages')} ({clientPackages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : clientPackages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Package className="h-12 w-12" />
                <p className="mt-4 text-sm">{t('proDashboard.packages.noSoldPackages')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientPackages.map((cp) => (
                  <Card key={cp.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{cp.servicePackage?.name || '—'}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('proDashboard.packages.client')}: {cp.user?.name || '—'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('proDashboard.packages.service')}: {cp.servicePackage?.service?.name || '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={(statusColors[cp.status] || 'secondary') as any}>
                            {statusLabels[cp.status] || cp.status}
                          </Badge>
                          <p className="mt-1 text-sm font-medium">
                            {cp.sessionsUsed}/{cp.totalSessions} {t('proDashboard.packages.sessionsCompleted')}
                          </p>
                        </div>
                      </div>

                      {/* Sessions timeline */}
                      {cp.bookings && cp.bookings.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {cp.bookings.map((bk) => (
                            <div
                              key={bk.id}
                              className={`rounded-lg border px-3 py-1.5 text-xs ${
                                bk.status === 'COMPLETED'
                                  ? 'border-green-200 bg-green-50 text-green-700'
                                  : bk.status === 'CANCELLED'
                                  ? 'border-red-200 bg-red-50 text-red-700'
                                  : 'border-blue-200 bg-blue-50 text-blue-700'
                              }`}
                            >
                              <span className="font-medium">#{bk.sessionNumber}</span>{' '}
                              {new Date(bk.date).toLocaleDateString()}{' '}
                              {bk.startTime}
                              {bk.status === 'COMPLETED' && <Check className="ml-1 inline h-3 w-3" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Create/Edit Package Dialog ──────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('proDashboard.packages.editPackage') : t('proDashboard.packages.newPackage')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('proDashboard.packages.name')} *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Pacote Hidratação 5 sessões"
                className={fieldErrors.name ? 'border-brand-error' : ''}
              />
              {fieldErrors.name && <p className="text-xs text-brand-error">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('proDashboard.packages.service')} *</Label>
              <Select value={form.serviceId} onValueChange={(v) => setForm((p) => ({ ...p, serviceId: v }))}>
                <SelectTrigger className={fieldErrors.serviceId ? 'border-brand-error' : ''}>
                  <SelectValue placeholder={t('proDashboard.agenda.selectService')} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((svc) => (
                    <SelectItem key={svc.id} value={svc.id}>
                      {svc.name} — R$ {Number(svc.price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.serviceId && <p className="text-xs text-brand-error">{fieldErrors.serviceId}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('proDashboard.packages.description')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={t('proDashboard.packages.description')}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('proDashboard.packages.sessions')} *</Label>
                <Input
                  type="number"
                  min="2"
                  value={form.sessionsTotal}
                  onChange={(e) => setForm((p) => ({ ...p, sessionsTotal: e.target.value }))}
                  className={fieldErrors.sessionsTotal ? 'border-brand-error' : ''}
                />
                {fieldErrors.sessionsTotal && <p className="text-xs text-brand-error">{fieldErrors.sessionsTotal}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('proDashboard.packages.interval')}</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.intervalDays}
                  onChange={(e) => setForm((p) => ({ ...p, intervalDays: e.target.value }))}
                  placeholder="dias"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('proDashboard.packages.totalPrice')} (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.priceTotal}
                  onChange={(e) => setForm((p) => ({ ...p, priceTotal: e.target.value }))}
                  className={fieldErrors.priceTotal ? 'border-brand-error' : ''}
                />
                {fieldErrors.priceTotal && <p className="text-xs text-brand-error">{fieldErrors.priceTotal}</p>}
              </div>
            </div>

            {form.sessionsTotal && form.priceTotal && parseInt(form.sessionsTotal) >= 2 && parseFloat(form.priceTotal) > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('proDashboard.packages.perSession')}: R$ {(parseFloat(form.priceTotal) / parseInt(form.sessionsTotal)).toFixed(2)}
              </p>
            )}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? t('common.save') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ───────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('proDashboard.packages.deletePackage')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('proDashboard.packages.confirmDelete')} <strong>{deletingPkg?.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Sell Package Dialog (Multi-date booking) ────── */}
      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('proDashboard.packages.sellPackage')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Package info */}
            {sellPkg && (
              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium">{sellPkg.name}</p>
                <p className="text-sm text-muted-foreground">
                  {sellPkg.sessionsTotal}x {sellPkg.service?.name} — R$ {Number(sellPkg.priceTotal).toFixed(2)}
                </p>
              </div>
            )}

            {/* Client search */}
            <div className="space-y-2">
              <Label>{t('proDashboard.packages.client')} *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t('proDashboard.agenda.searchClient')}
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setSellClientId(''); }}
                />
              </div>
              {sellClientId && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{clients.find((c) => c.id === sellClientId)?.name}</span>
                  <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setSellClientId('')}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {!sellClientId && clientSearch && (
                <div className="max-h-32 overflow-y-auto rounded-lg border">
                  {filteredClients.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">{t('proDashboard.clients.noClients')}</p>
                  ) : (
                    filteredClients.slice(0, 5).map((c) => (
                      <button
                        key={c.id}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => { setSellClientId(c.id); setClientSearch(''); }}
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Session dates */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('proDashboard.packages.sessionDates')}
              </Label>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {sessions.map((session, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-8 text-center text-sm font-medium text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <DatePicker
                      value={session.date}
                      onChange={(v) => updateSession(idx, 'date', v)}
                      minDate={new Date()}
                      className="flex-1"
                    />
                    <TimePicker
                      value={session.startTime}
                      onChange={(v) => updateSession(idx, 'startTime', v)}
                      className="w-36"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('proDashboard.packages.sessionDatesHint')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSell} disabled={submitting || !sellClientId}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('proDashboard.packages.confirmSell')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
