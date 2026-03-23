'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Megaphone } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';
import { DatePicker } from '@/components/ui/date-picker';

interface Promotion {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  active: boolean;
  services?: { service: { name: string } }[];
}

const emptyForm = { name: '', discountType: 'percent', discountValue: '', startDate: '', endDate: '' };

interface PromotionFieldErrors {
  name?: string;
  discountType?: string;
  discountValue?: string;
  startDate?: string;
  endDate?: string;
}

function validatePromotionForm(
  form: typeof emptyForm,
  t: (key: string, params?: Record<string, string>) => string,
): PromotionFieldErrors {
  const errors: PromotionFieldErrors = {};
  if (!form.name.trim()) errors.name = t('validation.required');
  if (!form.discountType) errors.discountType = t('validation.required');
  if (!form.discountValue || isNaN(parseFloat(form.discountValue)) || parseFloat(form.discountValue) <= 0) {
    errors.discountValue = t('validation.positiveNumber');
  } else if (form.discountType === 'percent' && parseFloat(form.discountValue) > 100) {
    errors.discountValue = t('validation.maxPercent');
  }
  if (!form.startDate) errors.startDate = t('validation.required');
  if (!form.endDate) {
    errors.endDate = t('validation.required');
  } else if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = t('validation.endDateAfterStart');
  }
  return errors;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<Promotion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PromotionFieldErrors>({});
  const toast = useToast();
  const { t, locale } = useTranslation();

  const clearFieldError = (field: keyof PromotionFieldErrors) => {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Promotion[] }>('/api/promotions');
      setPromotions(res.data || []);
    } catch {
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const isActive = (p: Promotion) => {
    const now = new Date();
    return p.active && new Date(p.startDate) <= now && new Date(p.endDate) >= now;
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFieldErrors({}); setFormOpen(true); };
  const openEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      discountType: p.discountType,
      discountValue: String(p.discountValue),
      startDate: p.startDate?.split('T')[0] || '',
      endDate: p.endDate?.split('T')[0] || '',
    });
    setFieldErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const errors = validatePromotionForm(form, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
    try {
      const body = {
        name: form.name,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        startDate: form.startDate,
        endDate: form.endDate,
      };
      if (editingId) {
        await apiFetch(`/api/promotions/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success(t('proDashboard.promotions.editPromotion'));
      } else {
        await apiFetch('/api/promotions', { method: 'POST', body: JSON.stringify(body) });
        toast.success(t('proDashboard.promotions.newPromotion'));
      }
      setFormOpen(false);
      fetchPromotions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPromo) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/promotions/${deletingPromo.id}`, { method: 'DELETE' });
      toast.success(t('common.delete'));
      setDeleteOpen(false);
      fetchPromotions();
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
          <h1 className="font-serif text-2xl font-bold">{t('proDashboard.promotions.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('proDashboard.promotions.title')}</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />{t('proDashboard.promotions.newPromotion')}</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('proDashboard.promotions.title')} ({promotions.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : promotions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Megaphone className="h-12 w-12" />
              <p className="mt-4 text-sm">{t('proDashboard.promotions.noPromotions')}</p>
              <Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />{t('proDashboard.promotions.newPromotion')}</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('proDashboard.promotions.name')}</TableHead>
                  <TableHead>{t('proDashboard.promotions.discountValue')}</TableHead>
                  <TableHead>{t('proDashboard.promotions.startDate')}</TableHead>
                  <TableHead>{t('proDashboard.promotions.endDate')}</TableHead>
                  <TableHead>{t('booking.status')}</TableHead>
                  <TableHead className="w-[100px]">{t('common.edit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      {p.discountType === 'percent' ? `${p.discountValue}%` : `R$ ${Number(p.discountValue).toFixed(2)}`}
                    </TableCell>
                    <TableCell>{new Date(p.startDate).toLocaleDateString(locale)}</TableCell>
                    <TableCell>{new Date(p.endDate).toLocaleDateString(locale)}</TableCell>
                    <TableCell>
                      <Badge variant={isActive(p) ? 'default' : 'secondary'}>{isActive(p) ? t('proDashboard.promotions.activePromotion') : t('proDashboard.promotions.inactivePromotion')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingPromo(p); setDeleteOpen(true); }}>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? t('proDashboard.promotions.editPromotion') : t('proDashboard.promotions.newPromotion')}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('proDashboard.promotions.name')} *</Label>
              <Input value={form.name} onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); clearFieldError('name'); }} placeholder={t('proDashboard.promotions.namePlaceholder')} className={fieldErrors.name ? 'border-brand-error' : ''} />
              {fieldErrors.name && <p className="text-xs text-brand-error">{fieldErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('proDashboard.promotions.discountType')} *</Label>
                <Select value={form.discountType} onValueChange={(v) => { setForm((p) => ({ ...p, discountType: v })); clearFieldError('discountType'); }}>
                  <SelectTrigger className={fieldErrors.discountType ? 'border-brand-error' : ''}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">{t('proDashboard.promotions.percent')} (%)</SelectItem>
                    <SelectItem value="fixed">{t('proDashboard.promotions.fixed')} (R$)</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.discountType && <p className="text-xs text-brand-error">{fieldErrors.discountType}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('proDashboard.promotions.discountValue')} *</Label>
                <Input type="number" step="0.01" value={form.discountValue} onChange={(e) => { setForm((p) => ({ ...p, discountValue: e.target.value })); clearFieldError('discountValue'); }} className={fieldErrors.discountValue ? 'border-brand-error' : ''} />
                {fieldErrors.discountValue && <p className="text-xs text-brand-error">{fieldErrors.discountValue}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('proDashboard.promotions.startDate')} *</Label>
                <DatePicker
                  value={form.startDate}
                  onChange={(v) => { setForm((p) => ({ ...p, startDate: v })); clearFieldError('startDate'); }}
                  minDate={new Date()}
                  error={!!fieldErrors.startDate}
                />
                {fieldErrors.startDate && <p className="text-xs text-brand-error">{fieldErrors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('proDashboard.promotions.endDate')} *</Label>
                <DatePicker
                  value={form.endDate}
                  onChange={(v) => { setForm((p) => ({ ...p, endDate: v })); clearFieldError('endDate'); }}
                  minDate={form.startDate ? new Date(form.startDate + 'T00:00:00') : new Date()}
                  error={!!fieldErrors.endDate}
                />
                {fieldErrors.endDate && <p className="text-xs text-brand-error">{fieldErrors.endDate}</p>}
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingId ? t('common.save') : t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('common.delete')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t('proDashboard.promotions.title')} <strong>{deletingPromo?.name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
