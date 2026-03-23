'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Camera, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

interface PortfolioItem {
  id: string;
  beforePhoto?: string;
  afterPhoto: string;
  description?: string;
  createdAt: string;
  service?: { name: string };
}

interface Service {
  id: string;
  name: string;
}

interface PortfolioFieldErrors {
  afterPhoto?: string;
  beforePhoto?: string;
}

function validatePortfolioForm(
  form: { beforePhoto: string; afterPhoto: string },
  t: (key: string, params?: Record<string, string>) => string,
): PortfolioFieldErrors {
  const errors: PortfolioFieldErrors = {};
  const urlPattern = /^https?:\/\/.+/;
  if (!form.afterPhoto.trim()) {
    errors.afterPhoto = t('validation.required');
  } else if (!urlPattern.test(form.afterPhoto.trim())) {
    errors.afterPhoto = t('validation.invalidUrl');
  }
  if (form.beforePhoto.trim() && !urlPattern.test(form.beforePhoto.trim())) {
    errors.beforePhoto = t('validation.invalidUrl');
  }
  return errors;
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PortfolioFieldErrors>({});
  const toast = useToast();
  const { t, locale } = useTranslation();

  const clearFieldError = (field: keyof PortfolioFieldErrors) => {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const [form, setForm] = useState({ beforePhoto: '', afterPhoto: '', description: '', serviceId: '' });

  const fetchProfessionalId = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { id: string } }>('/api/professionals/me');
      const id = res.data?.id;
      if (id) setProfessionalId(id);
      return id;
    } catch {
      return null;
    }
  }, []);

  const fetchItems = useCallback(async (profId?: string | null) => {
    const id = profId || professionalId;
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ data: PortfolioItem[] | { items: PortfolioItem[] } }>(`/api/portfolio?professionalId=${id}`);
      const data = res.data;
      // Handle both array and paginated response shapes
      const list = Array.isArray(data) ? data : (data as { items: PortfolioItem[] })?.items || [];
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  const fetchServices = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Service[] }>('/api/services');
      setServices(res.data || []);
    } catch {
      setServices([]);
    }
  }, []);

  useEffect(() => {
    fetchProfessionalId().then((id) => {
      fetchItems(id);
      fetchServices();
    });
  }, [fetchProfessionalId, fetchItems, fetchServices]);

  const handleCreate = async () => {
    const errors = validatePortfolioForm(form, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/portfolio', {
        method: 'POST',
        body: JSON.stringify({
          beforePhoto: form.beforePhoto || null,
          afterPhoto: form.afterPhoto,
          description: form.description,
          serviceId: form.serviceId || null,
        }),
      });
      toast.success(t('proDashboard.portfolio.addItem'));
      setCreateOpen(false);
      setForm({ beforePhoto: '', afterPhoto: '', description: '', serviceId: '' });
      fetchItems();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/portfolio/${deletingId}`, { method: 'DELETE' });
      toast.success(t('common.delete'));
      setDeleteOpen(false);
      setDeletingId(null);
      fetchItems();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">{t('proDashboard.portfolio.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('proDashboard.portfolio.emptyMessage')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('proDashboard.portfolio.addItem')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Camera className="h-16 w-16" />
            <p className="mt-4 text-sm">{t('proDashboard.portfolio.noItems')}</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('proDashboard.portfolio.addItem')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="aspect-[4/5] bg-muted">
                  {item.beforePhoto ? (
                    <img src={item.beforePhoto} alt={t('proDashboard.portfolio.beforePhoto')} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{t('proDashboard.portfolio.beforePhoto')}</div>
                  )}
                </div>
                <div className="aspect-[4/5] bg-muted">
                  <img src={item.afterPhoto} alt={t('proDashboard.portfolio.afterPhoto')} className="h-full w-full object-cover" />
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {item.service && <p className="text-sm font-medium">{item.service.name}</p>}
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString(locale)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => confirmDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-brand-error" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setFieldErrors({}); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('proDashboard.portfolio.addItem')}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} noValidate className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('proDashboard.portfolio.beforePhoto')}</Label>
              <Input value={form.beforePhoto} onChange={(e) => { setForm((p) => ({ ...p, beforePhoto: e.target.value })); clearFieldError('beforePhoto'); }} placeholder="https://..." className={fieldErrors.beforePhoto ? 'border-brand-error' : ''} />
              {fieldErrors.beforePhoto && <p className="text-xs text-brand-error">{fieldErrors.beforePhoto}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.portfolio.afterPhoto')} *</Label>
              <Input value={form.afterPhoto} onChange={(e) => { setForm((p) => ({ ...p, afterPhoto: e.target.value })); clearFieldError('afterPhoto'); }} placeholder="https://..." className={fieldErrors.afterPhoto ? 'border-brand-error' : ''} />
              {fieldErrors.afterPhoto && <p className="text-xs text-brand-error">{fieldErrors.afterPhoto}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.portfolio.relatedService')}</Label>
              <Select value={form.serviceId} onValueChange={(v) => setForm((p) => ({ ...p, serviceId: v }))}>
                <SelectTrigger><SelectValue placeholder={t('validation.selectOption')} /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('proDashboard.portfolio.description')}</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder={t('proDashboard.portfolio.description')} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('common.delete')}</DialogTitle></DialogHeader>
          <div className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-error" />
            <p className="text-sm text-muted-foreground">{t('errors.deleteConfirm')}</p>
          </div>
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
