'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Users, Search, Download } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { PhoneMaskedInput } from '@/components/ui/masked-input';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalVisits: number;
  lastVisit?: string;
  totalSpent: number;
}

interface ClientFieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  form?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const { t, locale } = useTranslation();

  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [fieldErrors, setFieldErrors] = useState<ClientFieldErrors>({});

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Client[] }>('/api/users?role=customer');
      setClients(res.data || []);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const clearFieldError = (field: keyof ClientFieldErrors) => {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', phone: '', email: '' });
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '' });
    setFieldErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const errors: ClientFieldErrors = {};
    if (!form.name.trim()) errors.name = t('validation.required');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t('validation.invalidEmail');
    if (form.phone && !/^\+?\d{8,15}$/.test(form.phone.replace(/[\s()-]/g, ''))) errors.phone = t('validation.invalidPhone');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await apiFetch<{ data: Client }>(`/api/users/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: form.name, phone: form.phone || undefined, email: form.email || undefined }),
        });
        setClients((prev) => prev.map((c) => c.id === editingId ? { ...c, ...res.data } : c));
        toast.success(t('common.save'));
      } else {
        const res = await apiFetch<{ success: boolean; data: Client }>('/api/users', {
          method: 'POST',
          body: JSON.stringify({ ...form, role: 'customer' }),
        });
        setClients((prev) => [{ ...res.data, totalVisits: 0, totalSpent: 0 }, ...prev]);
        toast.success(t('proDashboard.clients.newClient'));
      }
      setFormOpen(false);
      setForm({ name: '', phone: '', email: '' });
      setFieldErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('errors.generic');
      if (msg.includes('Email')) {
        setFieldErrors((prev) => ({ ...prev, email: t('validation.emailAlreadyRegistered') }));
      } else if (msg.includes('Phone')) {
        setFieldErrors((prev) => ({ ...prev, phone: t('validation.phoneAlreadyRegistered') }));
      } else {
        setFieldErrors((prev) => ({ ...prev, form: msg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/users/${deletingClient.id}`, { method: 'DELETE' });
      setClients((prev) => prev.filter((c) => c.id !== deletingClient.id));
      toast.success(t('common.delete'));
      setDeleteOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const escapeCsv = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;

  const exportCSV = () => {
    const header = `${t('proDashboard.clients.name')},${t('proDashboard.clients.phone')},${t('proDashboard.clients.email')},${t('proDashboard.clients.visits')},${t('proDashboard.clients.lastVisit')}\n`;
    const rows = filtered
      .map((c) => `${escapeCsv(c.name)},${escapeCsv(c.phone || '')},${escapeCsv(c.email || '')},${c.totalVisits || 0},${escapeCsv(c.lastVisit || '')}`)
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t('proDashboard.clients.title').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('proDashboard.clients.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('proDashboard.clients.searchPlaceholder')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            {t('proDashboard.clients.exportCsv')}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('proDashboard.clients.newClient')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder={t('proDashboard.clients.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('proDashboard.clients.title')} ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Users className="h-12 w-12" />
              <p className="mt-4 text-sm">{t('proDashboard.clients.noClients')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('proDashboard.clients.name')}</TableHead>
                  <TableHead>{t('proDashboard.clients.phone')}</TableHead>
                  <TableHead>{t('proDashboard.clients.email')}</TableHead>
                  <TableHead>{t('proDashboard.clients.visits')}</TableHead>
                  <TableHead>{t('proDashboard.clients.lastVisit')}</TableHead>
                  <TableHead className="w-[100px]">{t('common.edit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone || '—'}</TableCell>
                    <TableCell>{c.email || '—'}</TableCell>
                    <TableCell>{c.totalVisits || 0}</TableCell>
                    <TableCell>{c.lastVisit ? new Date(c.lastVisit).toLocaleDateString(locale) : '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingClient(c); setDeleteOpen(true); }}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t('common.edit') : t('proDashboard.clients.newClient')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('proDashboard.clients.name')} *</Label>
              <Input
                value={form.name}
                onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); clearFieldError('name'); }}
                placeholder={t('proDashboard.clients.name')}
                className={fieldErrors.name ? 'border-brand-error' : ''}
              />
              {fieldErrors.name && <p className="text-xs text-brand-error">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.clients.phone')}</Label>
              <PhoneMaskedInput
                value={form.phone}
                onChange={(v) => { setForm((p) => ({ ...p, phone: v })); clearFieldError('phone'); }}
                placeholder="(11) 99999-9999"
                error={!!fieldErrors.phone}
              />
              {fieldErrors.phone && <p className="text-xs text-brand-error">{fieldErrors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.clients.email')}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); clearFieldError('email'); }}
                placeholder="email@exemplo.com"
                className={fieldErrors.email ? 'border-brand-error' : ''}
              />
              {fieldErrors.email && <p className="text-xs text-brand-error">{fieldErrors.email}</p>}
            </div>
          </form>
          {fieldErrors.form && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-sm text-brand-error">{fieldErrors.form}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('common.delete')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('proDashboard.clients.name')}: <strong>{deletingClient?.name}</strong>?
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
    </div>
  );
}
