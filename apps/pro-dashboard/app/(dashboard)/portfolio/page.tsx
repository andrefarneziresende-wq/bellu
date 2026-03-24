'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Camera, AlertCircle, Upload, X } from 'lucide-react';
import { apiFetch, apiUpload } from '@/lib/api';
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

  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ description: '', serviceId: '' });

  const handleFileSelect = (type: 'before' | 'after', file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'before') {
      setBeforeFile(file);
      setBeforePreview(url);
    } else {
      setAfterFile(file);
      setAfterPreview(url);
    }
    setFieldErrors((prev) => { const next = { ...prev }; delete next[type === 'before' ? 'beforePhoto' : 'afterPhoto']; return next; });
  };

  const clearFile = (type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforeFile(null);
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      setBeforePreview(null);
    } else {
      setAfterFile(null);
      if (afterPreview) URL.revokeObjectURL(afterPreview);
      setAfterPreview(null);
    }
  };

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
    const errors: PortfolioFieldErrors = {};
    if (!afterFile) errors.afterPhoto = t('validation.required');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setUploading(true);
    try {
      // Upload photos to R2
      let beforePhotoUrl: string | null = null;
      let afterPhotoUrl: string;

      if (beforeFile) {
        beforePhotoUrl = await apiUpload(beforeFile, 'portfolio');
      }
      afterPhotoUrl = await apiUpload(afterFile!, 'portfolio');

      setUploading(false);

      await apiFetch('/api/portfolio', {
        method: 'POST',
        body: JSON.stringify({
          beforePhoto: beforePhotoUrl,
          afterPhoto: afterPhotoUrl,
          description: form.description,
          serviceId: form.serviceId || null,
        }),
      });
      toast.success(t('proDashboard.portfolio.addItem'));
      setCreateOpen(false);
      setForm({ description: '', serviceId: '' });
      clearFile('before');
      clearFile('after');
      fetchItems();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
      setUploading(false);
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
            <div className="grid grid-cols-2 gap-4">
              {/* Before Photo */}
              <div className="space-y-2">
                <Label>{t('proDashboard.portfolio.beforePhoto')}</Label>
                {beforePreview ? (
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg border">
                    <img src={beforePreview} alt="Antes" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => clearFile('before')} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-primary/5 ${fieldErrors.beforePhoto ? 'border-brand-error' : 'border-muted-foreground/30'}`}>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Foto antes</span>
                    <span className="text-[10px] text-muted-foreground/60">(opcional)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect('before', e.target.files?.[0] || null)} />
                  </label>
                )}
              </div>

              {/* After Photo */}
              <div className="space-y-2">
                <Label>{t('proDashboard.portfolio.afterPhoto')} *</Label>
                {afterPreview ? (
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg border">
                    <img src={afterPreview} alt="Depois" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => clearFile('after')} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-primary/5 ${fieldErrors.afterPhoto ? 'border-brand-error' : 'border-muted-foreground/30'}`}>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Foto depois</span>
                    <span className="text-[10px] text-muted-foreground/60">(obrigatoria)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect('after', e.target.files?.[0] || null)} />
                  </label>
                )}
                {fieldErrors.afterPhoto && <p className="text-xs text-brand-error">{fieldErrors.afterPhoto}</p>}
              </div>
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
